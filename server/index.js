require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set. Copy server/.env.example to server/.env and add your key.');
  process.exit(1);
}

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'] }));
app.use(express.json({ limit: '2mb' }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Patient profile → readable context block ──────────────────────────────────
function buildPatientContext(profile) {
  if (!profile || Object.keys(profile).length === 0) return '';

  const lines = [];
  const add = (label, value) => { if (value) lines.push(`${label}: ${value}`); };

  // Basics
  add('Patient Name', profile.patientName);
  add('Age', profile.age);
  add('Biological Sex', profile.sex);
  add('Height', profile.height);
  add('Weight', profile.weight);
  add('Location', profile.location);

  // Diagnosis
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

  // Treatment
  add('Current Treatment Phase', profile.treatmentPhase);
  if (profile.chemoRegimens?.length) {
    const regimens = [
      ...profile.chemoRegimens.filter(r => r !== 'Other'),
      profile.chemoRegimens.includes('Other') ? profile.chemoRegimensOther : null,
    ].filter(Boolean);
    add('Chemotherapy Regimens Received', regimens.join(' | '));
  }
  add('Chemo Cycles Completed', profile.cyclesCompleted);
  if (profile.hadSurgery === 'yes' || profile.hadSurgery === 'planned') {
    lines.push(`Surgery: ${profile.hadSurgery === 'planned' ? 'Planned' : 'Yes'}`);
    add('Surgery Type', profile.surgeryType);
    add('Surgery Date', profile.surgeryDate);
    add('Surgical Margins', profile.surgicalMargins);
    add('Reconstruction', profile.reconstruction);
  } else if (profile.hadSurgery === 'no') {
    lines.push('Surgery: No');
  }
  if (profile.hadRadiation === 'yes' || profile.hadRadiation === 'planned') {
    lines.push(`Radiation: ${profile.hadRadiation === 'planned' ? 'Planned' : 'Yes'}`);
    add('Radiation Site', profile.radiationSite);
    add('Radiation Dose', profile.radiationDose ? `${profile.radiationDose} Gy` : null);
    add('Radiation Date', profile.radiationDate);
    add('Radiation Modality', profile.radiationModality);
  } else if (profile.hadRadiation === 'no') {
    lines.push('Radiation: No');
  }
  if (profile.hadStemCellTransplant === 'yes' || profile.hadStemCellTransplant === 'planned') {
    lines.push(`Stem Cell Transplant: ${profile.hadStemCellTransplant === 'planned' ? 'Planned' : 'Yes'}`);
    add('Transplant Type', profile.transplantType);
    add('Transplant Date', profile.transplantDate);
  }

  // Status
  add('Current Treatment Status', profile.currentStatus);
  add('Response to Initial Chemotherapy', profile.chemoResponse);
  add('Most Recent Scan Result', profile.lastScanResult);
  add('Date of Most Recent Scan', profile.lastScanDate);
  add('Date of Last Treatment', profile.lastTreatmentDate);
  add('Performance Status', profile.performanceStatus);

  // Relapse
  if (profile.hasRelapsed === 'yes') {
    lines.push('Has Relapsed: Yes');
    add('Relapse Date', profile.relapseDate);
    add('Number of Prior Relapses', profile.numberOfRelapses);
    add('Time to Relapse', profile.timeToRelapse);
    add('Relapse Extent', profile.relapseExtent);
    if (profile.relapseSites?.length) {
      const sites = [
        ...profile.relapseSites.filter(s => s !== 'Other'),
        profile.relapseSites.includes('Other') ? profile.relapseSitesOther : null,
      ].filter(Boolean);
      add('Relapse Sites', sites.join(', '));
    }
    add('Treatments After Relapse', profile.postRelapseTreatments);
  } else if (profile.hasRelapsed === 'no') {
    lines.push('Has Relapsed: No');
  }

  // Symptoms & meds
  add('Current Symptoms', profile.currentSymptoms);
  add('Current Treatment Side Effects', profile.currentSideEffects);
  add('Current Medications', profile.currentMedications);
  add('Medication Allergies', profile.medicationAllergies);
  add('Other Health Conditions', profile.comorbidities);

  // Care team
  add('Treating Institution', profile.treatingInstitution);
  add('Oncologist', profile.oncologistName);
  if (profile.inClinicalTrial === 'yes') {
    lines.push('Currently in Clinical Trial: Yes');
    add('Clinical Trial', profile.clinicalTrialName);
  }
  add('Willing to Travel for Treatment', profile.willingToTravel);
  add('Second Opinion Status', profile.secondOpinion);
  add('Insurance Type', profile.insuranceType);

  // Additional
  add('Main Concerns', profile.mainConcerns);
  add('Additional Context', profile.additionalContext);

  if (lines.length === 0) return '';
  return `\n\n--- PATIENT PROFILE ---\n${lines.join('\n')}\n--- END PATIENT PROFILE ---`;
}

// ── System prompt ──────────────────────────────────────────────────────────────
function buildSystemPrompt(profile) {
  const context = buildPatientContext(profile);

  return `You are an AI assistant specializing in Ewing's sarcoma, created to help patients and families battling this disease. Introduce yourself as an AI-based support tool for Ewing's sarcoma patients and families on your first message in a new conversation.

You are knowledgeable about:
- Ewing's sarcoma biology, diagnosis, staging, and pathology (EWSR1 fusions, histology, PET/CT/MRI imaging interpretation)
- Standard first-line treatment: VDC/IE chemotherapy (vincristine, doxorubicin, cyclophosphamide / ifosfamide, etoposide), dosing, and schedules
- Local control options: limb-sparing surgery, amputation, radiation therapy, proton beam
- High-dose chemotherapy with autologous stem cell transplant
- Side effects of all Ewing's sarcoma drugs and how to manage them (nausea, neuropathy, cardiotoxicity, ototoxicity, hemorrhagic cystitis, myelosuppression, etc.)
- Salvage and second-line regimens: gemcitabine/docetaxel, irinotecan/temozolomide, cyclophosphamide/topotecan, regorafenib, cabozantinib
- Current and actively recruiting clinical trials (reference NCT numbers when known)
- Prognosis factors: tumor size, location, metastatic status, histologic response, LDH, time to relapse
- Survivorship, late effects, fertility preservation, rehabilitation
- Navigating second opinions, COG (Children's Oncology Group), sarcoma specialist centers
- Questions patients should ask their oncology team
- Emotional support, caregiver resources, and connecting with the Ewing's sarcoma community

When the patient profile is provided, tailor all responses using that information — reference their specific tumor site, treatment history, current status, and concerns wherever relevant.

CRITICAL DISCLAIMER — include a brief reminder in every response:
All information I provide is AI-generated and for educational purposes only. Treatment decisions must always be made in partnership with the patient's medical oncology team. I am here to help you understand, prepare, and ask better questions — not to replace medical advice.${context}`;
}

// ── Routes ─────────────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, patientProfile } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array.' });
    }
    if (messages.length > 200) {
      return res.status(400).json({ error: 'Conversation is too long. Please start a new chat.' });
    }

    // Validate each message has role and string content
    for (const m of messages) {
      if (!['user', 'assistant'].includes(m.role) || typeof m.content !== 'string') {
        return res.status(400).json({ error: 'Invalid message format.' });
      }
    }

    const systemPrompt = buildSystemPrompt(patientProfile || {});

    const claudeMessages = messages.map(m => ({ role: m.role, content: m.content }));

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages,
    });

    res.json({ content: response.content[0].text });
  } catch (err) {
    console.error('Claude API error:', err?.status, err?.message);
    if (err?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key. Check your ANTHROPIC_API_KEY in server/.env.' });
    }
    if (err?.status === 429) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a moment and try again.' });
    }
    if (err?.status === 529) {
      return res.status(503).json({ error: 'Claude API is temporarily overloaded. Please try again shortly.' });
    }
    res.status(500).json({ error: 'Failed to reach the AI. Please try again.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
