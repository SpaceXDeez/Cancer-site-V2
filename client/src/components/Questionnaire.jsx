import React, { useState } from 'react';

// ── Data ───────────────────────────────────────────────────────────────────────
const TUMOR_SITES = [
  'Femur (thigh bone)', 'Tibia (shin bone)', 'Fibula', 'Humerus (upper arm)',
  'Pelvis / iliac bone', 'Rib', 'Spine / vertebrae', 'Skull / facial bones',
  'Scapula (shoulder blade)', 'Soft tissue (not involving bone)', 'Other',
];

const CHEMO_REGIMENS = [
  'VDC/IE — Vincristine, Doxorubicin, Cyclophosphamide / Ifosfamide, Etoposide (standard COG regimen)',
  'Gemcitabine + Docetaxel',
  'Irinotecan + Temozolomide',
  'Cyclophosphamide + Topotecan',
  'High-dose chemo with autologous stem cell rescue',
  'VDC alone',
  'IE alone',
  'Other',
];

const METASTASIS_SITES = [
  'Lungs / pulmonary', 'Bone marrow', 'Other bones', 'Lymph nodes', 'Brain / CNS', 'Liver', 'Other',
];

const RELAPSE_SITES = [
  'Local (original tumor site)', 'Pulmonary (lungs)', 'Bone marrow', 'Other bones', 'Brain / CNS', 'Other',
];

const SECTIONS = [
  { id: 'basics',     label: 'Patient Basics',          icon: '👤' },
  { id: 'diagnosis',  label: 'Diagnosis',                icon: '🔬' },
  { id: 'treatment',  label: 'Treatment History',        icon: '💊' },
  { id: 'status',     label: 'Current Status',           icon: '📊' },
  { id: 'relapse',    label: 'Relapse',                  icon: '🔄' },
  { id: 'symptoms',   label: 'Symptoms & Medications',   icon: '🩺' },
  { id: 'careteam',   label: 'Care Team & Trials',       icon: '🏥' },
  { id: 'additional', label: 'Additional Notes',         icon: '📝' },
];

// ── Shared UI primitives ───────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2 leading-relaxed">{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
    />
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
    >
      <option value="">— Select —</option>
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition resize-none"
    />
  );
}

function Radios({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return (
          <label key={v} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value={v}
              checked={value === v}
              onChange={() => onChange(v)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{l}</span>
          </label>
        );
      })}
    </div>
  );
}

function Checkboxes({ options, selected = [], onToggle }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map(opt => (
        <label key={opt} className="flex items-start gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-snug">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function SubSection({ children }) {
  return (
    <div className="ml-4 pl-4 border-l-2 border-blue-100 mb-5 space-y-4">
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      <div className="mt-3 border-t border-gray-100" />
    </div>
  );
}

// ── Section panels ─────────────────────────────────────────────────────────────
function BasicsPanel({ form, upd }) {
  return (
    <>
      <SectionTitle title="Patient Basics" subtitle="Basic information about the patient." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label="Patient's First Name">
          <TextInput value={form.patientName} onChange={v => upd('patientName', v)} placeholder="e.g. Alex" />
        </Field>
        <Field label="Age">
          <TextInput value={form.age} onChange={v => upd('age', v)} placeholder="e.g. 15" type="number" />
        </Field>
        <Field label="Biological Sex">
          <SelectInput value={form.sex} onChange={v => upd('sex', v)}
            options={['Male', 'Female', 'Other / Prefer not to say']} />
        </Field>
        <Field label="City, State / Country" hint="Used to help find nearby clinical trials.">
          <TextInput value={form.location} onChange={v => upd('location', v)} placeholder="e.g. Austin, TX" />
        </Field>
        <Field label="Height">
          <TextInput value={form.height} onChange={v => upd('height', v)} placeholder={`e.g. 5'6" or 168 cm`} />
        </Field>
        <Field label="Weight">
          <TextInput value={form.weight} onChange={v => upd('weight', v)} placeholder="e.g. 130 lbs or 59 kg" />
        </Field>
      </div>
    </>
  );
}

function DiagnosisPanel({ form, upd, tog }) {
  return (
    <>
      <SectionTitle title="Diagnosis" subtitle="Details about the Ewing's sarcoma diagnosis." />

      <Field label="Date of Diagnosis">
        <TextInput value={form.diagnosisDate} onChange={v => upd('diagnosisDate', v)} type="date" />
      </Field>

      <Field label="Primary Tumor Site" hint="Where is (or was) the main tumor located?">
        <SelectInput value={form.primaryTumorSite} onChange={v => upd('primaryTumorSite', v)} options={TUMOR_SITES} />
        {form.primaryTumorSite === 'Other' && (
          <div className="mt-2">
            <TextInput value={form.primaryTumorSiteOther} onChange={v => upd('primaryTumorSiteOther', v)}
              placeholder="Describe tumor location" />
          </div>
        )}
      </Field>

      <Field label="Tumor Size at Diagnosis" hint="Longest diameter, in centimeters.">
        <TextInput value={form.tumorSize} onChange={v => upd('tumorSize', v)} placeholder="e.g. 8" type="number" />
      </Field>

      <Field label="Disease Extent at Diagnosis">
        <Radios value={form.diseaseExtent} onChange={v => upd('diseaseExtent', v)}
          options={['Localized (no spread)', 'Metastatic (has spread)', 'Unknown']} />
      </Field>

      {form.diseaseExtent === 'Metastatic (has spread)' && (
        <Field label="Metastasis Sites" hint="Check all that apply.">
          <Checkboxes options={METASTASIS_SITES} selected={form.metastasisSites || []}
            onToggle={item => tog('metastasisSites', item)} />
          {(form.metastasisSites || []).includes('Other') && (
            <div className="mt-2">
              <TextInput value={form.metastasisSitesOther} onChange={v => upd('metastasisSitesOther', v)}
                placeholder="Describe other sites" />
            </div>
          )}
        </Field>
      )}

      <Field label="EWSR1 Fusion Type" hint="Determined by molecular/genetic testing of the tumor biopsy.">
        <SelectInput value={form.ewsr1Fusion} onChange={v => upd('ewsr1Fusion', v)} options={[
          'EWSR1-FLI1 (most common, ~85%)',
          'EWSR1-ERG (~10%)',
          'EWSR1-ETV4',
          'EWSR1-FEV',
          'FUS rearrangement (FUS-ERG or FUS-FEV)',
          'Other / Atypical fusion',
          'Tested — result unknown',
          'Not tested',
        ]} />
      </Field>

      <Field label="LDH (Lactate Dehydrogenase) at Diagnosis" hint="LDH is a prognostic marker often checked at diagnosis.">
        <Radios value={form.ldh} onChange={v => upd('ldh', v)}
          options={['Normal', 'Elevated', 'Not tested / Unknown']} />
      </Field>
    </>
  );
}

function TreatmentPanel({ form, upd, tog }) {
  return (
    <>
      <SectionTitle title="Treatment History" subtitle="Chemotherapy, surgery, radiation, and other treatments." />

      <Field label="Current Treatment Phase">
        <SelectInput value={form.treatmentPhase} onChange={v => upd('treatmentPhase', v)} options={[
          'Induction chemotherapy (before local control)',
          'Local control (surgery and/or radiation)',
          'Consolidation / maintenance chemotherapy',
          'Active surveillance (post-treatment monitoring)',
          'Relapsed / Refractory disease',
          'Palliative care',
          'Unknown',
        ]} />
      </Field>

      <Field label="Chemotherapy Regimens Received" hint="Check all that have been used.">
        <Checkboxes options={CHEMO_REGIMENS} selected={form.chemoRegimens || []}
          onToggle={item => tog('chemoRegimens', item)} />
        {(form.chemoRegimens || []).includes('Other') && (
          <div className="mt-2">
            <TextInput value={form.chemoRegimensOther} onChange={v => upd('chemoRegimensOther', v)}
              placeholder="Describe other regimens" />
          </div>
        )}
      </Field>

      <Field label="Number of Chemo Cycles Completed">
        <TextInput value={form.cyclesCompleted} onChange={v => upd('cyclesCompleted', v)}
          placeholder="e.g. 6" type="number" />
      </Field>

      {/* Surgery */}
      <Field label="Has the patient had surgery?">
        <Radios value={form.hadSurgery} onChange={v => upd('hadSurgery', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'planned', label: 'Planned' }]} />
      </Field>
      {(form.hadSurgery === 'yes' || form.hadSurgery === 'planned') && (
        <SubSection>
          <Field label="Surgery Type">
            <SelectInput value={form.surgeryType} onChange={v => upd('surgeryType', v)} options={[
              'Limb-sparing resection', 'Amputation', 'Wide resection (pelvis / spine / rib)',
              'Thoracoscopic resection (pulmonary metastases)', 'Other',
            ]} />
          </Field>
          <Field label="Surgery Date">
            <TextInput value={form.surgeryDate} onChange={v => upd('surgeryDate', v)} type="date" />
          </Field>
          <Field label="Surgical Margins">
            <Radios value={form.surgicalMargins} onChange={v => upd('surgicalMargins', v)}
              options={['Wide negative margins', 'Marginal margins', 'Positive margins', 'Unknown / Pending']} />
          </Field>
          <Field label="Reconstruction (if limb-sparing)">
            <TextInput value={form.reconstruction} onChange={v => upd('reconstruction', v)}
              placeholder="e.g. Endoprosthesis, allograft, rotationplasty" />
          </Field>
        </SubSection>
      )}

      {/* Radiation */}
      <Field label="Has the patient had radiation therapy?">
        <Radios value={form.hadRadiation} onChange={v => upd('hadRadiation', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'planned', label: 'Planned' }]} />
      </Field>
      {(form.hadRadiation === 'yes' || form.hadRadiation === 'planned') && (
        <SubSection>
          <Field label="Radiation Site">
            <TextInput value={form.radiationSite} onChange={v => upd('radiationSite', v)}
              placeholder="e.g. Primary tumor site, whole lung irradiation" />
          </Field>
          <Field label="Total Radiation Dose (Gy)">
            <TextInput value={form.radiationDose} onChange={v => upd('radiationDose', v)}
              placeholder="e.g. 45 or 54" type="number" />
          </Field>
          <Field label="Radiation Date / Period">
            <TextInput value={form.radiationDate} onChange={v => upd('radiationDate', v)}
              placeholder="e.g. March – April 2024" />
          </Field>
          <Field label="Radiation Modality">
            <SelectInput value={form.radiationModality} onChange={v => upd('radiationModality', v)} options={[
              'Conventional photon radiation (EBRT)',
              'Proton beam therapy',
              'IMRT (Intensity Modulated Radiation Therapy)',
              'Stereotactic body radiation (SBRT / SRS)',
              'Unknown',
            ]} />
          </Field>
        </SubSection>
      )}

      {/* Stem cell transplant */}
      <Field label="Has the patient had a stem cell transplant?">
        <Radios value={form.hadSCT} onChange={v => upd('hadSCT', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'planned', label: 'Planned' }]} />
      </Field>
      {(form.hadSCT === 'yes' || form.hadSCT === 'planned') && (
        <SubSection>
          <Field label="Transplant Type">
            <Radios value={form.transplantType} onChange={v => upd('transplantType', v)}
              options={['Autologous (own stem cells)', 'Allogeneic (donor stem cells)', 'Unknown']} />
          </Field>
          <Field label="Transplant Date">
            <TextInput value={form.transplantDate} onChange={v => upd('transplantDate', v)} type="date" />
          </Field>
        </SubSection>
      )}
    </>
  );
}

function StatusPanel({ form, upd }) {
  return (
    <>
      <SectionTitle title="Current Status" subtitle="The patient's current situation and most recent results." />

      <Field label="Current Treatment Status">
        <SelectInput value={form.currentStatus} onChange={v => upd('currentStatus', v)} options={[
          'Actively receiving chemotherapy',
          'Actively receiving radiation',
          'Post-treatment surveillance (no active therapy)',
          'Relapsed — receiving treatment',
          'Refractory — treatment not working',
          'Palliative / comfort care',
          'Unknown',
        ]} />
      </Field>

      <Field label="Response to Initial Chemotherapy"
        hint="Typically assessed by % tumor necrosis in the resected specimen after induction chemo.">
        <SelectInput value={form.chemoResponse} onChange={v => upd('chemoResponse', v)} options={[
          'Good responder (≥90% tumor necrosis)',
          'Poor responder (<90% tumor necrosis)',
          'Still in induction — not yet assessed',
          'Not assessed / Unknown',
        ]} />
      </Field>

      <Field label="Most Recent Imaging Result">
        <SelectInput value={form.lastScanResult} onChange={v => upd('lastScanResult', v)} options={[
          'NED — No Evidence of Disease',
          'Complete response (CR)',
          'Partial response (PR)',
          'Stable disease (SD)',
          'Progressive disease (PD)',
          'Awaiting results',
          'Unknown',
        ]} />
      </Field>

      <Field label="Date of Most Recent Scan">
        <TextInput value={form.lastScanDate} onChange={v => upd('lastScanDate', v)} type="date" />
      </Field>

      <Field label="Date of Last Treatment">
        <TextInput value={form.lastTreatmentDate} onChange={v => upd('lastTreatmentDate', v)} type="date" />
      </Field>

      <Field label="Performance Status"
        hint="ECOG: 0 = fully active; 1 = restricted but ambulatory; 2 = ambulatory, unable to work; 3 = limited self-care; 4 = completely disabled.">
        <SelectInput value={form.performanceStatus} onChange={v => upd('performanceStatus', v)} options={[
          '0 — Fully active', '1 — Restricted, fully ambulatory',
          '2 — Ambulatory, unable to work', '3 — Limited self-care',
          '4 — Completely disabled', 'Unknown',
        ]} />
      </Field>
    </>
  );
}

function RelapsePanel({ form, upd, tog }) {
  return (
    <>
      <SectionTitle title="Relapse" subtitle="Complete this section only if the patient has experienced a relapse." />

      <Field label="Has the patient relapsed?">
        <Radios value={form.hasRelapsed} onChange={v => upd('hasRelapsed', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'Not sure' }]} />
      </Field>

      {form.hasRelapsed === 'yes' && (
        <>
          <Field label="Date of First Relapse">
            <TextInput value={form.relapseDate} onChange={v => upd('relapseDate', v)} type="date" />
          </Field>

          <Field label="Number of Relapses (total)">
            <TextInput value={form.numberOfRelapses} onChange={v => upd('numberOfRelapses', v)}
              placeholder="e.g. 1" type="number" />
          </Field>

          <Field label="Time from End of Initial Treatment to First Relapse">
            <Radios value={form.timeToRelapse} onChange={v => upd('timeToRelapse', v)} options={[
              'Early relapse (< 2 years from diagnosis)',
              'Late relapse (≥ 2 years from diagnosis)',
              'Refractory (never fully responded to initial treatment)',
              'Unknown',
            ]} />
          </Field>

          <Field label="Relapse Site(s)" hint="Check all that apply.">
            <Checkboxes options={RELAPSE_SITES} selected={form.relapseSites || []}
              onToggle={item => tog('relapseSites', item)} />
            {(form.relapseSites || []).includes('Other') && (
              <div className="mt-2">
                <TextInput value={form.relapseSitesOther} onChange={v => upd('relapseSitesOther', v)}
                  placeholder="Describe other relapse sites" />
              </div>
            )}
          </Field>

          <Field label="Is the relapse localized or disseminated?">
            <Radios value={form.relapseExtent} onChange={v => upd('relapseExtent', v)}
              options={['Localized (single site)', 'Disseminated (multiple sites)', 'Unknown']} />
          </Field>

          <Field label="Treatments Tried After Relapse"
            hint="List any regimens, surgeries, or trials used at relapse.">
            <TextArea value={form.postRelapseTreatments} onChange={v => upd('postRelapseTreatments', v)}
              placeholder="e.g. Irinotecan/Temozolomide ×6 cycles, then Gemcitabine/Docetaxel..." rows={3} />
          </Field>
        </>
      )}
    </>
  );
}

function SymptomsPanel({ form, upd }) {
  return (
    <>
      <SectionTitle title="Symptoms & Medications" subtitle="Current symptoms, side effects, and medications." />

      <Field label="Current Symptoms">
        <TextArea value={form.currentSymptoms} onChange={v => upd('currentSymptoms', v)}
          placeholder="e.g. Fatigue, pain at tumor site, shortness of breath, decreased appetite..." rows={3} />
      </Field>

      <Field label="Current Side Effects from Treatment"
        hint="Side effects from chemotherapy, radiation, or surgery.">
        <TextArea value={form.currentSideEffects} onChange={v => upd('currentSideEffects', v)}
          placeholder="e.g. Nausea, mucositis, peripheral neuropathy, hearing loss, low counts..." rows={3} />
      </Field>

      <Field label="Current Medications"
        hint="Include chemo drugs, supportive care, and any other medications.">
        <TextArea value={form.currentMedications} onChange={v => upd('currentMedications', v)}
          placeholder="e.g. Vincristine, Doxorubicin, Ondansetron (Zofran), G-CSF (Neupogen), Mesna..." rows={3} />
      </Field>

      <Field label="Medication Allergies or Intolerances">
        <TextInput value={form.medicationAllergies} onChange={v => upd('medicationAllergies', v)}
          placeholder="e.g. Penicillin allergy; NKDA (no known drug allergies)" />
      </Field>

      <Field label="Other Significant Health Conditions / Comorbidities">
        <TextArea value={form.comorbidities} onChange={v => upd('comorbidities', v)}
          placeholder="e.g. Asthma, prior cardiac condition, hearing impairment, diabetes..." rows={2} />
      </Field>
    </>
  );
}

function CareTeamPanel({ form, upd }) {
  return (
    <>
      <SectionTitle title="Care Team & Clinical Trials" subtitle="Treating team and clinical trial information." />

      <Field label="Treating Hospital / Cancer Center">
        <TextInput value={form.treatingInstitution} onChange={v => upd('treatingInstitution', v)}
          placeholder="e.g. Children's Hospital of Philadelphia, MD Anderson Cancer Center" />
      </Field>

      <Field label="Treating Oncologist's Name">
        <TextInput value={form.oncologistName} onChange={v => upd('oncologistName', v)}
          placeholder="e.g. Dr. Jane Smith" />
      </Field>

      <Field label="Is the patient currently enrolled in a clinical trial?">
        <Radios value={form.inClinicalTrial} onChange={v => upd('inClinicalTrial', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'Not sure' }]} />
      </Field>
      {form.inClinicalTrial === 'yes' && (
        <SubSection>
          <Field label="Clinical Trial Name or NCT Number">
            <TextInput value={form.clinicalTrialName} onChange={v => upd('clinicalTrialName', v)}
              placeholder="e.g. NCT12345678 or AEWS1221" />
          </Field>
        </SubSection>
      )}

      <Field label="Would you be willing to travel for a clinical trial or second opinion?">
        <Radios value={form.willingToTravel} onChange={v => upd('willingToTravel', v)}
          options={['Yes', 'Maybe / Limited', 'No', 'Already at a major center']} />
      </Field>

      <Field label="Second Opinion Status">
        <Radios value={form.secondOpinion} onChange={v => upd('secondOpinion', v)}
          options={['Already had second opinion', 'Considering it', 'No', 'Not sure']} />
      </Field>

      <Field label="Insurance Type">
        <SelectInput value={form.insuranceType} onChange={v => upd('insuranceType', v)} options={[
          'Private / Employer insurance', 'Medicaid / CHIP', 'Medicare',
          'Tricare (Military)', 'Uninsured', 'Other', 'Prefer not to say',
        ]} />
      </Field>
    </>
  );
}

function AdditionalPanel({ form, upd }) {
  return (
    <>
      <SectionTitle title="Additional Notes" subtitle="Anything else that may help the AI give better answers." />

      <Field label="Most Pressing Questions or Concerns Right Now"
        hint="What are you most worried about or most hoping to find out?">
        <TextArea value={form.mainConcerns} onChange={v => upd('mainConcerns', v)}
          placeholder="e.g. I want to understand if there are clinical trials for relapsed disease; I'm worried about late effects of radiation on bone growth..." rows={4} />
      </Field>

      <Field label="Anything Else You'd Like the AI to Know"
        hint="Circumstances, priorities, or context that might affect recommendations.">
        <TextArea value={form.additionalContext} onChange={v => upd('additionalContext', v)}
          placeholder="e.g. Patient is a competitive athlete focused on limb preservation; family speaks limited English; already connected with COG..." rows={4} />
      </Field>
    </>
  );
}

// ── Count filled fields per section ───────────────────────────────────────────
const SECTION_FIELDS = {
  basics:     ['patientName','age','sex','location','height','weight'],
  diagnosis:  ['diagnosisDate','primaryTumorSite','tumorSize','diseaseExtent','ewsr1Fusion','ldh'],
  treatment:  ['treatmentPhase','chemoRegimens','cyclesCompleted','hadSurgery','hadRadiation','hadSCT'],
  status:     ['currentStatus','chemoResponse','lastScanResult','lastScanDate','performanceStatus'],
  relapse:    ['hasRelapsed','relapseDate','relapseSites','postRelapseTreatments'],
  symptoms:   ['currentSymptoms','currentSideEffects','currentMedications','medicationAllergies'],
  careteam:   ['treatingInstitution','oncologistName','inClinicalTrial','willingToTravel','insuranceType'],
  additional: ['mainConcerns','additionalContext'],
};

function sectionHasData(sectionId, form) {
  return (SECTION_FIELDS[sectionId] || []).some(f => {
    const v = form[f];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== '' && v !== null;
  });
}

// ── Main Questionnaire component ───────────────────────────────────────────────
export default function Questionnaire({ profile, isFirstVisit, onSave, onClose }) {
  const [form, setForm]         = useState({ ...profile });
  const [active, setActive]     = useState('basics');

  const upd = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const tog = (field, item)  => setForm(prev => {
    const cur = prev[field] || [];
    return { ...prev, [field]: cur.includes(item) ? cur.filter(i => i !== item) : [...cur, item] };
  });

  const panels = { basics: BasicsPanel, diagnosis: DiagnosisPanel, treatment: TreatmentPanel,
    status: StatusPanel, relapse: RelapsePanel, symptoms: SymptomsPanel,
    careteam: CareTeamPanel, additional: AdditionalPanel };
  const ActivePanel = panels[active];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-2xl w-full sm:max-w-4xl h-[95vh] sm:max-h-[92vh] flex flex-col shadow-2xl rounded-t-2xl">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Patient Profile</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              All fields are optional. The more you fill in, the more personalized the AI responses will be.
            </p>
          </div>
          {!isFirstVisit && onClose && (
            <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop: side nav */}
          <nav className="hidden sm:block w-52 border-r border-gray-100 py-3 flex-shrink-0 overflow-y-auto bg-gray-50/50">
            {SECTIONS.map(s => {
              const filled = sectionHasData(s.id, form);
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors relative ${
                    active === s.id
                      ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <span className="text-base leading-none">{s.icon}</span>
                  <span className="flex-1 leading-snug">{s.label}</span>
                  {filled && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" title="Has data" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile: horizontal scrollable section tabs */}
          <div className="sm:hidden flex flex-col flex-1 min-h-0">
            <div className="flex-shrink-0 border-b border-gray-100 overflow-x-auto">
              <div className="flex px-3 gap-1 py-1.5">
                {SECTIONS.map(s => {
                  const filled = sectionHasData(s.id, form);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActive(s.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                        active === s.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <span>{s.icon}</span>
                      {s.label}
                      {filled && <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ActivePanel form={form} upd={upd} tog={tog} />
            </div>
          </div>

          {/* Desktop: form body */}
          <div className="hidden sm:block flex-1 overflow-y-auto p-6">
            <ActivePanel form={form} upd={upd} tog={tog} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center gap-3">
            {isFirstVisit && (
              <button
                onClick={() => onSave({})}
                className="text-sm text-gray-400 hover:text-gray-600 underline transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {!isFirstVisit && onClose && (
              <button onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            )}
            <button
              onClick={() => onSave(form)}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              {isFirstVisit ? 'Save & Start Chatting' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
