import React, { useState, useRef } from 'react';

function FileIcon({ mime }) {
  const isPdf = mime === 'pdf';
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isPdf ? 'bg-red-100' : 'bg-blue-100'}`}>
      <svg className={`w-5 h-5 ${isPdf ? 'text-red-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseAiSummary(raw) {
  if (!raw) return null;
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
}

export default function FilesPanel({ authFetch, onUpdateProfile, profile }) {
  const [files, setFiles]             = useState(null); // null = not loaded yet
  const [loading, setLoading]         = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [expanded, setExpanded]       = useState({}); // id → 'summary' | 'text' | null
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id
  const [dragOver, setDragOver]       = useState(false);
  const [medSuggestion, setMedSuggestion] = useState(null); // { fileId, medications[], filename }
  const fileInputRef = useRef(null);

  async function loadFiles() {
    if (loading) return;
    setLoading(true);
    try {
      const res  = await authFetch('/api/documents');
      const data = await res.json();
      setFiles(data.documents || []);
    } catch { setFiles([]); }
    finally { setLoading(false); }
  }

  // Load on first render
  React.useEffect(() => { loadFiles(); }, []); // eslint-disable-line

  async function uploadFile(file) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await authFetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      await loadFiles();
      const parsed = parseAiSummary(data.aiSummary);
      if (parsed?.medications?.length > 0) {
        setMedSuggestion({ filename: data.filename, medications: parsed.medications });
      }
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e) {
    uploadFile(e.target.files?.[0]);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    uploadFile(e.dataTransfer.files?.[0]);
  }

  async function deleteFile(id) {
    try {
      await authFetch(`/api/documents/${id}`, { method: 'DELETE' });
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch {
      setUploadError('Failed to delete file.');
    }
    setDeleteConfirm(null);
  }

  async function loadFullText(id) {
    try {
      const res  = await authFetch(`/api/documents/${id}`);
      const data = await res.json();
      setFiles(prev => prev.map(f => f.id === id ? { ...f, text: data.document.text } : f));
    } catch { /* ignore */ }
  }

  function toggleExpand(id, key) {
    setExpanded(prev => {
      const cur = prev[id];
      return { ...prev, [id]: cur === key ? null : key };
    });
  }

  async function addMedsToProfile(medications) {
    if (!onUpdateProfile || !profile) return;
    const existing = Array.isArray(profile.medications) ? profile.medications : [];
    const newMeds = medications.map(m => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      name: m.name || '',
      dosage: m.dosage || '',
      frequencyType: 'recurring',
      frequencyCount: '',
      frequencyUnit: 'day',
      startDate: '',
      endDate: '',
      date: '',
      notes: [m.frequency, m.notes].filter(Boolean).join(' — '),
    }));
    await onUpdateProfile({ ...profile, medications: [...existing, ...newMeds] });
    setMedSuggestion(null);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900">My Files</h2>
          <p className="text-xs text-gray-500">Upload test results, therapy summaries, and other medical documents.</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0"
        >
          {uploading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileInput} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Medication suggestion banner */}
        {medSuggestion && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-800 mb-1">
              Medications found in "{medSuggestion.filename}"
            </p>
            <p className="text-xs text-amber-700 mb-3">
              {medSuggestion.medications.map(m => m.name).join(', ')} — add to your Medical Profile?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => addMedsToProfile(medSuggestion.medications)}
                className="text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Add to profile
              </button>
              <button
                onClick={() => setMedSuggestion(null)}
                className="text-xs text-amber-700 hover:text-amber-900 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
            <span className="flex-1">{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
          </div>
        )}

        {/* Drag-drop zone — desktop only */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`hidden sm:flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-8 cursor-pointer transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <p className="text-sm text-gray-500">Drag & drop or <span className="text-blue-600 font-medium">browse</span></p>
          <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, WebP — up to 20 MB</p>
        </div>

        {/* File list */}
        {loading && files === null ? (
          <div className="flex justify-center py-12">
            <svg className="w-6 h-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : files?.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No files uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {(files || []).map(file => {
              const parsed  = parseAiSummary(file.ai_summary);
              const expKey  = expanded[file.id];
              const hasMeds = parsed?.medications?.length > 0;

              return (
                <div key={file.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* File header row */}
                  <div className="flex items-start gap-3 p-3">
                    <FileIcon mime={file.filename?.endsWith('.pdf') ? 'pdf' : 'img'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                      <p className="text-xs text-gray-400">{fmtDate(file.created_at)}</p>
                    </div>
                    {/* Action buttons — always visible on mobile */}
                    <div className="flex gap-1 flex-shrink-0">
                      {parsed?.summary && (
                        <button
                          onClick={() => toggleExpand(file.id, 'summary')}
                          title="AI Summary"
                          className={`p-1.5 rounded-lg transition-colors ${expKey === 'summary' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!file.text) await loadFullText(file.id);
                          toggleExpand(file.id, 'text');
                        }}
                        title="View extracted text"
                        className={`p-1.5 rounded-lg transition-colors ${expKey === 'text' ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      {deleteConfirm === file.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => deleteFile(file.id)}
                            className="text-xs font-medium bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition-colors">
                            Delete
                          </button>
                          <button onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg border border-gray-200 transition-colors">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(file.id)} title="Delete"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Medications badge */}
                  {hasMeds && (
                    <div className="px-3 pb-2 flex items-center gap-2">
                      <span className="text-xs bg-green-100 text-green-700 rounded-full px-2.5 py-0.5 font-medium">
                        {parsed.medications.length} medication{parsed.medications.length !== 1 ? 's' : ''} found
                      </span>
                      <button
                        onClick={() => setMedSuggestion({ filename: file.filename, medications: parsed.medications })}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Add to profile →
                      </button>
                    </div>
                  )}

                  {/* Expanded: AI summary */}
                  {expKey === 'summary' && parsed?.summary && (
                    <div className="border-t border-gray-100 bg-blue-50/50 px-4 py-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        AI Summary
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{parsed.summary}</p>
                      {parsed.medications?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-blue-100">
                          <p className="text-xs font-medium text-blue-700 mb-1">Medications mentioned:</p>
                          <ul className="space-y-0.5">
                            {parsed.medications.map((m, i) => (
                              <li key={i} className="text-xs text-gray-600">
                                <span className="font-medium">{m.name}</span>
                                {m.dosage && <span className="text-gray-400"> · {m.dosage}</span>}
                                {m.frequency && <span className="text-gray-400"> · {m.frequency}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expanded: raw extracted text */}
                  {expKey === 'text' && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Extracted text</p>
                      {file.text ? (
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                          {file.text}
                        </pre>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Loading…</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
