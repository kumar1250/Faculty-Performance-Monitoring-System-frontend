import { useState } from 'react';
import API from '../../api/axios';

export default function StudentCounsellingModule({ records = [], isReadOnly, currentUserId, onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [formData, setFormData] = useState({
    total_students: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openCreateModal = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setFormData({ total_students: '' });
    setIsOpen(true);
  };

  const openEditModal = (e, record) => {
    e.stopPropagation();
    setEditingId(record.id);
    setFormData({ total_students: record.total_students });
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      total_students: parseInt(formData.total_students, 10)
    };
    
    // Strict Backend Requirement: This specific module targets the 'faculty' key name instead of 'user'
    if (editingId) {
      const record = records.find(r => r.id === editingId);
      payload.faculty = record.faculty; 
    } else {
      if (records.length > 0 && records[0].faculty) {
        payload.faculty = records[0].faculty;
      } else if (currentUserId) {
        payload.faculty = currentUserId;
      }
    }

    try {
      if (editingId) {
        // Hits PUT /counselling/counselling/<id>/update
        await API.put(`/counselling/counselling/${editingId}/update`, payload);
      } else {
        // Hits POST /counselling/counselling/contribution/[cite: 26, 27]
        await API.post('/counselling/counselling/contribution/', payload);
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
    if (!window.confirm('Are you sure you want to remove this counselling entry?')) return;
    try {
      // Hits DELETE /counselling/counselling/<id>/delete[cite: 26, 27]
      await API.delete(`/counselling/counselling/${id}/delete`);
      onRefresh();
    } catch (err) {
      alert('Failed to delete counselling entry.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-6 space-y-4 font-sans mt-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Student Counselling & Mentoring</h3>
          <p className="text-xs text-slate-500 mt-0.5">Log and track structural group size mentoring counts assigned for official performance scoring appraisal cycles.</p>
        </div>
        {!isReadOnly && (
          <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition">
            + Add Counselling Count
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-slate-400 text-sm italic py-2">No student mentoring group distributions tracked under this record portfolio.</p>
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
                  <p className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">Counselled Batch Record</p>
                  <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-white">View Details</span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Assigned Student Quota Capacity: <strong className="text-slate-700">{record.total_students} Registered Students</strong>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide capitalize ${
                    record.approval_status === 'approved' ? 'bg-green-50 text-green-700 border border-green-100' :
                    record.approval_status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-100' : 
                    'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {record.approval_status}
                  </span>
                  {record.approval_status === 'approved' && (
                    <span className="text-xs font-bold text-blue-600">+{record.points} Points</span>
                  )}
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
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">Audit Activity Review</span>
                <h4 className="text-xl font-black text-slate-900 mt-1">Counselling Batch Entry Log</h4>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-b border-slate-100 pb-5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Total Counselled Students</span>
                <strong className="text-slate-800 text-base mt-0.5 block">{selectedRecord.total_students} Students</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Appraisal Status</span>
                  <strong className="text-slate-800 text-base mt-0.5 block capitalize">{selectedRecord.approval_status}</strong>
                </div>
                {selectedRecord.approval_status === 'approved' && (
                  <span className="bg-blue-600 text-white font-black text-sm px-2.5 py-1 rounded-lg">+{selectedRecord.points} pts</span>
                )}
              </div>
            </div>

            {selectedRecord.message && (
              <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 text-sm space-y-1">
                <h5 className="font-bold text-amber-900">Evaluation Remarks</h5>
                <p className="text-amber-800"><strong className="font-semibold text-amber-900">Feedback:</strong> {selectedRecord.message}</p>
                {selectedRecord.approved_by && <p className="text-xs text-amber-700/80 font-medium">Evaluated By: {selectedRecord.approved_by}</p>}
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button type="button" onClick={() => setSelectedRecord(null)} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition">Close Review Panel</button>
            </div>
          </div>
        </div>
      )}

      {/* INPUT FORM MODAL WINDOW */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-bold text-slate-900">{editingId ? 'Modify Counselling Log' : 'Register Counselling Group'}</h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Total Mentored Students Count[cite: 27]</label>
                <input type="number" name="total_students" required min={1} value={formData.total_students} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none" placeholder="e.g., 20" />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border border-slate-200 text-sm text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Saving Quota Data...' : 'Save Record Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}