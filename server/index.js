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
  add('Current Symptoms', profile.currentSymptoms);
  add('Current Side Effects', profile.currentSideEffects);
  add('Current Medications', profile.currentMedications);
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

function buildSystemPrompt(profile) {
  return `You are an AI assistant specializing in Ewing's sarcoma, created to help patients and families battling this disease. Introduce yourself as an AI-based support tool for Ewing's sarcoma patients and families on your first message in a new conversation.

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
All information I provide is AI-generated and for educational purposes only. Treatment decisions must always be made in partnership with the patient's medical oncology team.${buildPatientContext(profile)}`;
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
    const history    = await db.getMessages(chatId);

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
      system: buildSystemPrompt(profile),
      messages: claudeMessages,
    });

    const aiContent = response.content[0].text;
    await db.insertMessage(chatId, 'assistant', aiContent);

    res.json({ content: aiContent });
  } catch (err) {
    console.error('Claude API error:', err?.status, err?.message);
    if (err?.status === 401) return res.status(401).json({ error: 'Invalid API key.' });
    if (err?.status === 429) return res.status(429).json({ error: 'Rate limit reached. Please wait and try again.' });
    if (err?.status === 529) return res.status(503).json({ error: 'Claude API is temporarily overloaded.' });
    res.status(500).json({ error: 'Failed to reach the AI. Please try again.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

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

