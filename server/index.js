require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set');
  process.exit(1);
}
if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: ENCRYPTION_KEY is not set — patient data will be stored unencrypted.');
}

const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: isProd ? undefined : false, // relax CSP in dev for Vite HMR
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
];
// CORS only needed for API routes (cross-origin dev) — static files are same-origin in prod
const corsMiddleware = cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
});

app.use(express.json({ limit: '2mb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Global limiter — protect all endpoints
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// Stricter limiter on the AI chat endpoint (costs money and CPU)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Chat rate limit reached. Please wait a moment.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload rate limit reached. Please wait a moment.' },
});

// Per-user daily upload cap — runs after requireAuth so req.user is available
const dailyUploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 20,
  keyGenerator: req => `upload_daily:${req.user.userId}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Daily upload limit reached (20 documents per day). Try again tomorrow.' },
});

const MAX_EXTRACTED_CHARS = 50_000;
const truncate = t =>
  t.length <= MAX_EXTRACTED_CHARS ? t
    : `${t.slice(0, MAX_EXTRACTED_CHARS)}\n\n[Document truncated — only the first ${MAX_EXTRACTED_CHARS.toLocaleString()} characters were included.]`;

// ── File upload (memory storage — no files written to disk) ───────────────────
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('Unsupported file type. Upload a PDF, JPG, PNG, or WebP.'), { status: 400 }));
  },
});

// ── App modules ───────────────────────────────────────────────────────────────
const anthropic   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db          = require('./db');
const requireAuth = require('./middleware/auth');

app.use('/api', corsMiddleware);

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/chats',   require('./routes/chats'));

// ── Patient profile → readable context block ──────────────────────────────────
function buildPatientContext(profile) {
  if (!profile || Object.keys(profile).length === 0) return '';
  const lines = [];
  const add = (label, value) => { if (value) lines.push(`${label}: ${value}`); };

  add('Patient Name', profile.patientName);
  add('Age', profile.age);
  add('Biological Sex', profile.sex);
  add('Height', profile.height);
  add('Weight', profile.weight);
  add('Location', profile.location);
  add('Date of Diagnosis', profile.diagnosisDate);
  add('Primary Tumor Site', profile.primaryTumorSite === 'Other' ? profile.primaryTumorSiteOther : profile.primaryTumorSite);
  add('Tumor Size at Diagnosis', profile.tumorSize ? `${profile.tumorSize} cm` : null);
  add('Disease Extent', profile.diseaseExtent);
  if (profile.metastasisSites?.length) {
    add('Metastasis Sites', [
      ...profile.metastasisSites.filter(s => s !== 'Other'),
      profile.metastasisSites.includes('Other') ? profile.metastasisSitesOther : null,
    ].filter(Boolean).join(', '));
  }
  add('EWSR1 Fusion Type', profile.ewsr1Fusion);
  add('LDH at Diagnosis', profile.ldh);
  add('Current Treatment Phase', profile.treatmentPhase);
  if (profile.chemoRegimens?.length) {
    add('Chemotherapy Regimens', [
      ...profile.chemoRegimens.filter(r => r !== 'Other'),
      profile.chemoRegimens.includes('Other') ? profile.chemoRegimensOther : null,
    ].filter(Boolean).join(' | '));
  }
  add('Chemo Cycles Completed', profile.cyclesCompleted);
  if (profile.hadSurgery === 'yes' || profile.hadSurgery === 'planned') {
    lines.push(`Surgery: ${profile.hadSurgery === 'planned' ? 'Planned' : 'Yes'}`);
    add('Surgery Type', profile.surgeryType);
    add('Surgical Margins', profile.surgicalMargins);
  }
  if (profile.hadRadiation === 'yes' || profile.hadRadiation === 'planned') {
    lines.push(`Radiation: ${profile.hadRadiation === 'planned' ? 'Planned' : 'Yes'}`);
    add('Radiation Site', profile.radiationSite);
    add('Radiation Dose', profile.radiationDose ? `${profile.radiationDose} Gy` : null);
    add('Radiation Modality', profile.radiationModality);
  }
  if (profile.hadSCT === 'yes' || profile.hadSCT === 'planned') {
    lines.push(`Stem Cell Transplant: ${profile.hadSCT === 'planned' ? 'Planned' : 'Yes'}`);
    add('Transplant Type', profile.transplantType);
  }
  add('Current Treatment Status', profile.currentStatus);
  add('Response to Initial Chemotherapy', profile.chemoResponse);
  add('Most Recent Scan Result', profile.lastScanResult);
  add('Date of Most Recent Scan', profile.lastScanDate);
  add('Performance Status', profile.performanceStatus);
  if (profile.ctdnaTested) {
    add('ctDNA Testing', profile.ctdnaTested);
    add('ctDNA Details', profile.ctdnaDetails);
  }
  if (profile.hasRelapsed === 'yes') {
    lines.push('Has Relapsed: Yes');
    add('Time to Relapse', profile.timeToRelapse);
    add('Relapse Extent', profile.relapseExtent);
    if (profile.relapseSites?.length) {
      add('Relapse Sites', [
        ...profile.relapseSites.filter(s => s !== 'Other'),
        profile.relapseSites.includes('Other') ? profile.relapseSitesOther : null,
      ].filter(Boolean).join(', '));
    }
    add('Treatments After Relapse', profile.postRelapseTreatments);
  }
  if (profile.currentSymptoms) {
    let symptomLine = `Current Symptoms: ${profile.currentSymptoms}`;
    if (profile.symptomsStartDate) symptomLine += ` (from ${profile.symptomsStartDate}${profile.symptomsEndDate ? ` to ${profile.symptomsEndDate}` : ' — ongoing'})`;
    lines.push(symptomLine);
  }
  if (profile.currentSideEffects) {
    let seLine = `Current Side Effects: ${profile.currentSideEffects}`;
    if (profile.sideEffectsStartDate) seLine += ` (from ${profile.sideEffectsStartDate}${profile.sideEffectsEndDate ? ` to ${profile.sideEffectsEndDate}` : ' — ongoing'})`;
    lines.push(seLine);
  }
  if (profile.currentMedications) {
    let medLine = `Current Medications: ${profile.currentMedications}`;
    if (profile.medicationsStartDate) medLine += ` (from ${profile.medicationsStartDate}${profile.medicationsEndDate ? ` to ${profile.medicationsEndDate}` : ' — ongoing'})`;
    lines.push(medLine);
  }
  add('Medication Allergies', profile.medicationAllergies);
  add('Other Health Conditions', profile.comorbidities);
  add('Treating Institution', profile.treatingInstitution);
  add('Oncologist', profile.oncologistName);
  if (profile.inClinicalTrial === 'yes') {
    lines.push('Currently in Clinical Trial: Yes');
    add('Clinical Trial', profile.clinicalTrialName);
  }
  add('Willing to Travel', profile.willingToTravel);
  add('Insurance Type', profile.insuranceType);
  add('Main Concerns', profile.mainConcerns);
  add('Additional Context', profile.additionalContext);

  if (lines.length === 0) return '';
  return `\n\n--- PATIENT PROFILE ---\n${lines.join('\n')}\n--- END PATIENT PROFILE ---`;
}

function buildDocumentContext(docs) {
  if (!docs?.length) return '';
  // Truncate each doc to 3 000 chars in the system prompt to stay within token budget
  const sections = docs.map(d => {
    const preview = d.text.length > 3000 ? d.text.slice(0, 3000) + '\n[…truncated]' : d.text;
    return `[${d.filename}]\n${preview}`;
  });
  return `\n\n--- UPLOADED DOCUMENTS ---\n${sections.join('\n\n')}\n--- END UPLOADED DOCUMENTS ---`;
}

function buildSystemPrompt(profile, docs, userDisplayName) {
  const settings = profile?._settings || {};

  const styleNote = {
    supportive: '\n\nCOMMUNICATION STYLE: Use warm, empathetic, accessible language. Minimise jargon. Prioritise emotional support alongside clinical information.',
    clinical:   '\n\nCOMMUNICATION STYLE: Use precise medical terminology and provide comprehensive clinical detail. The reader is medically literate and prefers thorough technical information.',
  }[settings.aiStyle] || '';

  const customNote = settings.customInstructions?.trim()
    ? `\n\nADDITIONAL USER INSTRUCTIONS: ${settings.customInstructions.trim()}`
    : '';

  // Distinguish the person using the app from the patient they may be supporting
  const userNote = userDisplayName
    ? `\n\nIMPORTANT: The person using this app is named ${userDisplayName}. The patient whose profile is below may be a different person (e.g. a child or family member). Always address the user as "${userDisplayName}", never by the patient's name.`
    : '\n\nNote: The user of this app may be a caregiver or family member, not the patient themselves. Do not address the user by the patient\'s name.';

  return `You are an AI assistant specialising in Ewing's sarcoma, created to help patients and families battling this disease. Introduce yourself as an AI-based support tool for Ewing's sarcoma patients and families on your first message in a new conversation.${userNote}

You are knowledgeable about:
- Ewing's sarcoma biology, diagnosis, staging, and pathology (EWSR1 fusions, histology, PET/CT/MRI imaging interpretation)
- Standard first-line treatment: VDC/IE chemotherapy (vincristine, doxorubicin, cyclophosphamide / ifosfamide, etoposide), dosing, and schedules
- Local control options: limb-sparing surgery, amputation, radiation therapy, proton beam
- High-dose chemotherapy with autologous stem cell transplant
- Side effects of all Ewing's sarcoma drugs and how to manage them
- Salvage and second-line regimens: gemcitabine/docetaxel, irinotecan/temozolomide, cyclophosphamide/topotecan, regorafenib, cabozantinib
- Current and actively recruiting clinical trials (reference NCT numbers when known)
- Prognosis factors: tumor size, location, metastatic status, histologic response, LDH, time to relapse
- Survivorship, late effects, fertility preservation, rehabilitation
- Navigating second opinions, COG, sarcoma specialist centers

When the patient profile is provided, tailor all responses using that information.

CRITICAL DISCLAIMER — include a brief reminder in every response:
All information I provide is AI-generated and for educational purposes only. Treatment decisions must always be made in partnership with the patient's medical oncology team.${buildPatientContext(profile)}${buildDocumentContext(docs)}${styleNote}${customNote}`;
}

// ── AI chat endpoint ───────────────────────────────────────────────────────────
app.post('/api/chat', requireAuth, chatLimiter, async (req, res) => {
  try {
    const { chatId, content } = req.body;
    if (!chatId || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'chatId and content are required.' });
    }

    const chat = await db.getChatById(chatId, req.user.userId);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    const profileRow = await db.getProfile(req.user.userId);
    const profile    = profileRow ? JSON.parse(profileRow.data) : {};
    const docs       = await db.getUserDocuments(req.user.userId);
    const history    = await db.getMessages(chatId);
    const userDisplayName = profile?._settings?.displayName?.trim() || null;

    if (history.length > 200) {
      return res.status(400).json({ error: 'Conversation is too long. Please start a new chat.' });
    }

    await db.insertMessage(chatId, 'user', content.trim());

    const claudeMessages = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: content.trim() },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: buildSystemPrompt(profile, docs, userDisplayName),
      messages: claudeMessages,
    });

    const aiContent = response.content[0].text;

    // Run DB write and context extraction in parallel — extraction never blocks the response
    const userMsgCount = history.filter(m => m.role === 'user').length + 1; // +1 for this message
    const shouldExtract = userMsgCount >= 2;

    const [, extractResult] = await Promise.allSettled([
      db.insertMessage(chatId, 'assistant', aiContent),
      shouldExtract ? (async () => {
        const snippet = [...claudeMessages, { role: 'assistant', content: aiContent }]
          .slice(-12) // last 12 messages is plenty
          .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.slice(0, 600)}`)
          .join('\n\n');
        const knownFields = JSON.stringify(profile, null, 2);
        return anthropic.messages.create({
          model: 'claude-opus-4-5',
          max_tokens: 300,
          system: 'You extract new factual patient information from a conversation. Respond ONLY with a valid JSON object, no prose.',
          messages: [{
            role: 'user',
            content: `Current patient profile:\n${knownFields}\n\nConversation:\n${snippet}\n\nExtract any NEW patient facts mentioned in the conversation that are not already in the profile. Focus on: patientName, age, sex, location, primaryTumorSite, diagnosisDate, treatmentPhase, cyclesCompleted, currentStatus, oncologistName, treatingInstitution, currentMedications, currentSymptoms, mainConcerns.\n\nReturn {"hasUpdates":false} if nothing new, or {"hasUpdates":true,"description":"one sentence summary","fields":{"key":"value",...}} if new info found.`,
          }],
        });
      })() : Promise.resolve(null),
    ]);

    let contextSuggestion = null;
    if (extractResult.status === 'fulfilled' && extractResult.value) {
      try {
        const parsed = JSON.parse(extractResult.value.content[0].text);
        if (parsed.hasUpdates && parsed.fields && Object.keys(parsed.fields).length > 0) {
          contextSuggestion = { description: parsed.description, fields: parsed.fields };
        }
      } catch { /* ignore malformed JSON */ }
    }

    res.json({ content: aiContent, contextSuggestion });
  } catch (err) {
    console.error('Claude API error:', err?.status, err?.message);
    if (err?.status === 401) return res.status(401).json({ error: 'Invalid API key.' });
    if (err?.status === 429) return res.status(429).json({ error: 'Rate limit reached. Please wait and try again.' });
    if (err?.status === 529) return res.status(503).json({ error: 'Claude API is temporarily overloaded.' });
    res.status(500).json({ error: 'Failed to reach the AI. Please try again.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Data export ───────────────────────────────────────────────────────────────
app.get('/api/export', requireAuth, async (req, res) => {
  try {
    const profileRow = await db.getProfile(req.user.userId);
    const profile    = profileRow ? JSON.parse(profileRow.data) : {};
    const chats      = await db.getChats(req.user.userId);
    const chatData   = await Promise.all(
      chats.map(async c => ({ ...c, messages: await db.getMessages(c.id) }))
    );
    res.json({ exportedAt: new Date().toISOString(), profile, chats: chatData });
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ error: 'Failed to export data.' });
  }
});

// ── File upload → text extraction ─────────────────────────────────────────────
app.post('/api/upload', requireAuth, dailyUploadLimiter, uploadLimiter, (req, res, next) => {
  upload.single('file')(req, res, err => {
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Maximum size is 20 MB.' });
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided.' });
    const { mimetype, buffer, originalname } = req.file;
    let text = '';

    if (mimetype === 'application/pdf') {
      // Try fast local extraction first; fall back to Claude if it fails or returns nothing
      try {
        const pdfParse = require('pdf-parse');
        const parsed   = await pdfParse(buffer);
        text = parsed.text.trim();
      } catch { /* fall through to Claude */ }

      if (!text) {
        const response = await anthropic.messages.create({
          model: 'claude-opus-4-5',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') } },
              { type: 'text', text: 'This is a medical document. Extract and transcribe all visible text, values, labels, dates, and units exactly as they appear. Preserve structure.' },
            ],
          }],
        });
        text = response.content[0].text.trim();
      }

      if (!text) return res.status(422).json({ error: 'No readable text found in this PDF.' });
    } else {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimetype, data: buffer.toString('base64') } },
            { type: 'text', text: 'This is a medical document or test result. Extract and transcribe all visible text, values, labels, dates, and units. Preserve the structure as closely as possible.' },
          ],
        }],
      });
      text = response.content[0].text.trim();
    }

    const truncated = truncate(text);
    await db.saveDocument(req.user.userId, originalname, truncated);
    res.json({ text: truncated, filename: originalname });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: 'Failed to process file. Please try again.' });
  }
});

// ── Health check (no auth, no CORS) ──────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// ── Serve React app in production ─────────────────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// ── Start server after DB is ready ────────────────────────────────────────────
db.initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });

