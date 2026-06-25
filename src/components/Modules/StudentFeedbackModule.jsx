import { useState, useEffect, useRef } from 'react';
import API from '../../api/axios';

// ── Faculty picker (register-no / name search) ─────────────────────────────
function FacultyPicker({ value, onChange }) {
  const [roster, setRoster]             = useState([]);
  const [rosterLoaded, setRosterLoaded] = useState(false);
  const [query, setQuery]               = useState(value?.registerNo || '');
  const [suggestions, setSuggestions]   = useState([]);
  const [open, setOpen]                 = useState(false);
  const wrapRef                         = useRef(null);

  const ensureRoster = async () => {
    if (rosterLoaded) return;
    try {
      const res = await API.get('/accounts/user/list/');
      const ASSIGNABLE_ROLES = ['faculty', 'department_incharge', 'committee_coordinator'];
      const faculty = (res.data || []).filter(u =>
        ASSIGNABLE_ROLES.includes((u.role || '').toLowerCase())
      );
      setRoster(faculty);
      setRosterLoaded(true);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setOpen(false); return; }
    const term = query.trim().toLowerCase();
    const hits = roster.filter(u =>
      (u.register_no || '').toLowerCase().includes(term) ||
      (u.username    || '').toLowerCase().includes(term)
    ).slice(0, 8);
    setSuggestions(hits);
    setOpen(hits.length > 0);
  }, [query, roster]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (u) => {
    onChange({ userId: u.id, registerNo: u.register_no, username: u.username });
    setQuery(u.register_no);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    setSuggestions([]);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50/50 transition
        ${value ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200 focus-within:bg-white focus-within:border-blue-400'}`}>
        <span className="text-slate-400 text-sm flex-shrink-0">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (value) onChange(null); }}
          onFocus={ensureRoster}
          placeholder="Type register no. or name…"
          className="flex-1 bg-transparent text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none min-w-0"
        />
        {(query || value) && (
          <button type="button" onClick={clear}
            className="text-slate-400 hover:text-red-500 transition text-xs font-black flex-shrink-0">✕</button>
        )}
      </div>

      {value && (
        <div className="mt-1.5 flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
            {(value.username?.[0] || '?').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-indigo-800 capitalize truncate">{value.username}</p>
            <p className="text-[10px] font-bold text-indigo-500">{value.registerNo}</p>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-md uppercase tracking-wide">
            ✓ Points → This Faculty
          </span>
        </div>
      )}

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => select(u)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 transition text-left"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">
                {(u.username?.[0] || '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 capitalize truncate">{u.username}</p>
                <p className="text-[10px] font-semibold text-slate-400">{u.register_no}</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-300 flex-shrink-0">ID:{u.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Module ────────────────────────────────────────────────────────────────
export default function StudentFeedbackModule({
  records = [],
  isReadOnly,
  currentUserId,
  onRefresh,
  facultyName = '',
  viewerRole = '',
}) {
  const [isOpen, setIsOpen]                 = useState(false);
  const [editingId, setEditingId]           = useState(null);
  const [loading, setLoading]               = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Editing/deleting allowed when viewing own profile OR when viewer is HOD/Dean/Principal
  const PRIVILEGED_ROLES = ['hod', 'dean', 'principal', 'department_incharge'];
  const canModify = !isReadOnly || PRIVILEGED_ROLES.includes(viewerRole);

  // { userId, registerNo, username }
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  const [formData, setFormData] = useState({
    academic_year:    '',
    subject_name:     '',
    cycle_1_feedback: 'excellent',
    cycle_2_feedback: 'excellent',
    exam_result:      'ge_90',
    message:          '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setSelectedFaculty(null);
    setFormData({
      academic_year:    new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      subject_name:     '',
      cycle_1_feedback: 'excellent',
      cycle_2_feedback: 'excellent',
      exam_result:      'ge_90',
      message:          '',
    });
    setIsOpen(true);
  };

  const openEditModal = (e, record) => {
    e.stopPropagation();
    setEditingId(record.id);

    setSelectedFaculty(
      record.user
        ? {
            userId:     record.user.id,
            registerNo: record.user.register_no,
            username:   record.user.username,
          }
        : null
    );

    setFormData({
      academic_year:    record.academic_year    || '',
      subject_name:     record.subject_name     || '',
      cycle_1_feedback: record.cycle_1_feedback || 'excellent',
      cycle_2_feedback: record.cycle_2_feedback || 'excellent',
      exam_result:      record.exam_result      || 'ge_90',
      message:          record.message          || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingId && !selectedFaculty?.userId) {
      alert('Please select a faculty member before saving.');
      return;
    }

    setLoading(true);

    const payload = {
      academic_year:    formData.academic_year,
      subject_name:     formData.subject_name,
      cycle_1_feedback: formData.cycle_1_feedback,
      cycle_2_feedback: formData.cycle_2_feedback,
      exam_result:      formData.exam_result,
      message:          formData.message,
    };

    if (editingId) {
      const record = records.find(r => r.id === editingId);
      payload.user = selectedFaculty?.userId || record?.user?.id;
    } else {
      payload.user = selectedFaculty.userId;
    }

    try {
      if (editingId) {
        // FIX: trailing slash added — Django redirects without it, losing PUT body
        await API.put(`/feedback/student-feedback/${editingId}/update/`, payload);
      } else {
        await API.post('/feedback/student-feedback/create/', payload);
      }
      setIsOpen(false);
      onRefresh();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this feedback performance record?')) return;
    try {
      // FIX: trailing slash added — Django redirects without it
      await API.delete(`/feedback/student-feedback/${id}/delete/`);
      onRefresh();
    } catch {
      alert('Failed to delete performance entry.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-6 space-y-4 font-sans mt-6">

      {/* ── Card Header ── */}
      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Theory Courses Handled (Student Feedback Performance)</h3>
          <p className="text-xs text-slate-500 mt-0.5">Track intermediate feedback metric indexes and exam passing distributions.</p>
          {PRIVILEGED_ROLES.includes(viewerRole) && facultyName && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Faculty</span>
              <span className="text-xs font-bold text-indigo-700 capitalize">{facultyName}</span>
              <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-md uppercase tracking-wide">
                {viewerRole.toUpperCase()} View
              </span>
            </div>
          )}
        </div>
        {canModify && (
          <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex-shrink-0 ml-4">
            + Log Course Performance
          </button>
        )}
      </div>

      {/* ── Records List ── */}
      {records.length === 0 ? (
        <p className="text-slate-400 text-sm italic py-2">No theory course handled feedback records listed.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {records.map((record) => (
            <div
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className="group border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-200 cursor-pointer"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{record.subject_name}</p>
                  {record.register_no && (
                    <span className="text-[10px] font-black text-indigo-600 border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      🆔 {record.register_no}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-white">View Full Metrics</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                  <span>Year: <strong className="text-slate-700">{record.academic_year}</strong></span>
                  <span>Cycle 1: <strong className="text-slate-700 capitalize">{record.cycle_1_feedback}</strong></span>
                  <span>Cycle 2: <strong className="text-slate-700 capitalize">{record.cycle_2_feedback}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide bg-green-50 text-green-700 border border-green-100">
                    Auto-Calculated Points
                  </span>
                  <span className="text-xs font-bold text-blue-600">+{record.points} Points</span>
                </div>
                {canModify && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openEditModal(e, record)}
                      className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition"
                      title="Edit record"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, record.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition"
                      title="Delete record"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Audit Modal ── */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">Feedback Audit View</span>
                <h4 className="text-xl font-black text-slate-900 mt-1">{selectedRecord.subject_name}</h4>
                {selectedRecord.register_no && (
                  <p className="text-xs font-bold text-indigo-600 mt-0.5">🆔 Faculty: {selectedRecord.register_no}</p>
                )}
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-b border-slate-100 pb-5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Academic Tracking Year</span>
                <strong className="text-slate-800 text-base mt-0.5 block">{selectedRecord.academic_year}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Cycle 1 Metric Index</span>
                <strong className="text-slate-800 text-base mt-0.5 block capitalize">{selectedRecord.cycle_1_feedback}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Cycle 2 Metric Index</span>
                <strong className="text-slate-800 text-base mt-0.5 block capitalize">{selectedRecord.cycle_2_feedback}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">University Exam Result Bracket</span>
                <strong className="text-slate-800 text-base mt-0.5 block uppercase">
                  {selectedRecord.exam_result?.replace('ge_', '>= ').replace('lt_', '< ')}%
                </strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center sm:col-span-2">
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Appraisal Score Allotment Status</span>
                  <strong className="text-green-700 text-base mt-0.5 block font-bold">Points Auto-Calculated and Active</strong>
                </div>
                <span className="bg-blue-600 text-white font-black text-sm px-2.5 py-1 rounded-lg">+{selectedRecord.points} pts</span>
              </div>
            </div>

            {selectedRecord.message && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm space-y-1">
                <h5 className="font-bold text-slate-700">Course Notes or Faculty Remarks</h5>
                <p className="text-slate-600">{selectedRecord.message}</p>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button type="button" onClick={() => setSelectedRecord(null)} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition shadow-sm">
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Form Modal ── */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h4 className="text-lg font-bold text-slate-900">{editingId ? 'Modify Feedback Entry' : 'Log Theory Course Performance Metrics'}</h4>
              <p className="text-xs text-slate-400 mt-0.5">Entry will be attributed to the selected faculty's profile.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Faculty Picker */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-2">
                <label className="block text-xs font-black text-indigo-700 uppercase tracking-wide">
                  🆔 Faculty Register Number <span className="text-red-500">*</span>
                </label>
                <FacultyPicker
                  value={selectedFaculty}
                  onChange={setSelectedFaculty}
                />
                {!editingId && !selectedFaculty && (
                  <p className="text-[10px] text-indigo-400 font-semibold">Search by register number or name to assign this entry.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Subject Name Title</label>
                  <input
                    type="text"
                    name="subject_name"
                    required
                    value={formData.subject_name}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-blue-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Academic Year</label>
                  <input
                    type="text"
                    name="academic_year"
                    required
                    value={formData.academic_year}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-blue-400 transition"
                    placeholder="e.g., 2025-2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Exam Pass Result Bracket</label>
                  <select
                    name="exam_result"
                    value={formData.exam_result}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white font-medium text-slate-700"
                  >
                    <option value="ge_90">&gt;= 90% Pass Rate</option>
                    <option value="ge_80">&gt;= 80% Pass Rate</option>
                    <option value="ge_70">&gt;= 70% Pass Rate</option>
                    <option value="lt_70">&lt; 70% Pass Rate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Cycle 1 Feedback Index</label>
                  <select
                    name="cycle_1_feedback"
                    value={formData.cycle_1_feedback}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white font-medium text-slate-700"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="satisfactory">Satisfactory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Cycle 2 Feedback Index</label>
                  <select
                    name="cycle_2_feedback"
                    value={formData.cycle_2_feedback}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white font-medium text-slate-700"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="satisfactory">Satisfactory</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Additional Observations (Optional)</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full text-sm p-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none h-16 resize-none"
                    placeholder="e.g., Special remediation streams deployed for struggling candidates."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-sm text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (!editingId && !selectedFaculty)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Performance Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}