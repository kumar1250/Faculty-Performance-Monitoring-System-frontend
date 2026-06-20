import { useState } from 'react';
import API from '../../api/axios';

export default function StudentFeedbackModule({ records = [], isReadOnly, currentUserId, onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [formData, setFormData] = useState({
    academic_year: '',
    subject_name: '',
    cycle_1_feedback: 'excellent',
    cycle_2_feedback: 'excellent',
    exam_result: 'ge_90',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openCreateModal = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setFormData({
      academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      subject_name: '',
      cycle_1_feedback: 'excellent',
      cycle_2_feedback: 'excellent',
      exam_result: 'ge_90',
      message: ''
    });
    setIsOpen(true);
  };

  const openEditModal = (e, record) => {
    e.stopPropagation();
    setEditingId(record.id);
    setFormData({
      academic_year: record.academic_year || '',
      subject_name: record.subject_name || '',
      cycle_1_feedback: record.cycle_1_feedback || 'excellent',
      cycle_2_feedback: record.cycle_2_feedback || 'excellent',
      exam_result: record.exam_result || 'ge_90',
      message: record.message || ''
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      academic_year: formData.academic_year,
      subject_name: formData.subject_name,
      cycle_1_feedback: formData.cycle_1_feedback,
      cycle_2_feedback: formData.cycle_2_feedback,
      exam_result: formData.exam_result,
      message: formData.message
    };

    if (editingId) {
      const record = records.find(r => r.id === editingId);
      payload.user = record.user; // Appends explicit user foreign key on edit[cite: 31]
    } else {
      if (records.length > 0 && records[0].user) {
        payload.user = records[0].user;
      } else if (currentUserId) {
        payload.user = currentUserId;
      }
    }

    try {
      if (editingId) {
        // Hits PUT /feedback/student-feedback/<id>/update (No trailing slash)[cite: 30, 31]
        await API.put(`/feedback/student-feedback/${editingId}/update`, payload);
      } else {
        // Hits POST /feedback/student-feedback/create/ (With trailing slash)[cite: 30, 31]
        // Note: Backend creation reads keys as cycle_1_feedback / cycle_2_feedback from payload[cite: 31]
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
      // Hits DELETE /feedback/student-feedback/<id>/delete (No trailing slash)[cite: 30, 31]
      await API.delete(`/feedback/student-feedback/${id}/delete`);
      onRefresh();
    } catch (err) {
      alert('Failed to delete performance entry.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-6 space-y-4 font-sans mt-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Theory Courses Handled (Student Feedback Performance)</h3>
          <p className="text-xs text-slate-500 mt-0.5">Track intermediate feedback metric indexes and exam passing distributions.</p>
        </div>
        {!isReadOnly && (
          <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition">
            + Log Course Performance
          </button>
        )}
      </div>

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
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{record.subject_name}</p>
                  <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-white">View Full metrics</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                  <span>Year: <strong className="text-slate-700">{record.academic_year}</strong></span>
                  <span>Cycle 1: <strong className="text-slate-700 capitalize">{record.cycle_1_feedback}</strong></span>
                  <span>Cycle 2: <strong className="text-slate-700 capitalize">{record.cycle_2_feedback}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide capitalize bg-green-50 text-green-700 border border-green-100">
                    Auto-Calculated Points
                  </span>
                  <span className="text-xs font-bold text-blue-600">+{record.points} Points</span>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => openEditModal(e, record)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={(e) => handleDelete(e, record.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAILED INSPECTION DRAWER MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">Feedback Audit View</span>
                <h4 className="text-xl font-black text-slate-900 mt-1">{selectedRecord.subject_name}</h4>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-b border-slate-100 pb-5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Academic Tracking Year</span>
                <strong className="text-slate-800 text-base mt-0.5 block">{selectedRecord.academic_year}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Cycle 1 Metric Index[cite: 31]</span>
                <strong className="text-slate-800 text-base mt-0.5 block capitalize">{selectedRecord.cycle_1_feedback}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Cycle 2 Metric Index[cite: 31]</span>
                <strong className="text-slate-800 text-base mt-0.5 block capitalize">{selectedRecord.cycle_2_feedback}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">University Exam Result Bracket[cite: 31]</span>
                <strong className="text-slate-800 text-base mt-0.5 block uppercase">{selectedRecord.exam_result?.replace('_', ' >= ')}%</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center sm:col-span-2">
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Appraisal Score Allotment Status</span>
                  <strong className="text-green-700 text-base mt-0.5 block font-bold">Points Auto-Calculated and Active[cite: 31]</strong>
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
              <button type="button" onClick={() => setSelectedRecord(null)} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition shadow-sm">Close Audit View</button>
            </div>
          </div>
        </div>
      )}

      {/* INPUT FORM MODAL WINDOW */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-bold text-slate-900">{editingId ? 'Modify Feedback Entry' : 'Log Theory Course Performance Metrics'}</h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Subject Name Title[cite: 31]</label>
                  <input type="text" name="subject_name" required value={formData.subject_name} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Academic Year[cite: 31]</label>
                  <input type="text" name="academic_year" required value={formData.academic_year} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none" placeholder="e.g., 2025-2026" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Exam Pass Result Metric Bracket[cite: 31]</label>
                  <select name="exam_result" value={formData.exam_result} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white font-medium text-slate-700">
                    <option value="ge_90">&gt;= 90% Pass Rate[cite: 31]</option>
                    <option value="ge_80">&gt;= 80% Pass Rate[cite: 31]</option>
                    <option value="ge_70">&gt;= 70% Pass Rate[cite: 31]</option>
                    <option value="lt_70">&lt; 70% Pass Rate[cite: 31]</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Cycle 1 Feedback Index[cite: 31]</label>
                  <select name="cycle_1_feedback" value={formData.cycle_1_feedback} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white font-medium text-slate-700">
                    <option value="excellent">Excellent Index</option>
                    <option value="good">Good Index</option>
                    <option value="satisfactory">Satisfactory Index</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Cycle 2 Feedback Index[cite: 31]</label>
                  <select name="cycle_2_feedback" value={formData.cycle_2_feedback} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white font-medium text-slate-700">
                    <option value="excellent">Excellent Index</option>
                    <option value="good">Good Index</option>
                    <option value="satisfactory">Satisfactory Index</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Additional Observations Context Notes (Optional)</label>
                  <textarea name="message" value={formData.message} onChange={handleInputChange} className="w-full text-sm p-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none h-16 resize-none" placeholder="e.g., Special extra remediation logic streams deployed for struggling candidates." />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border border-slate-200 text-sm text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Logging Course Track...' : 'Save Performance Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}