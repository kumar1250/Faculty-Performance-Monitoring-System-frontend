import { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function ConsultancyModule({ records = [], isReadOnly, currentUserId, onRefresh }) {
  const [secureFileUrl, setSecureFileUrl] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    organization_name: '',
    amount: '',
    position: 'SINGLE',
    certificate_file: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, certificate_file: e.target.files[0] });
  };

  const openCreateModal = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setFormData({ title: '', organization_name: '', amount: '', position: 'SINGLE', certificate_file: null });
    setIsOpen(true);
  };

  const openEditModal = (e, record) => {
    e.stopPropagation();
    setEditingId(record.id);
    setFormData({
      title: record.title,
      organization_name: record.organization_name,
      amount: record.amount,
      position: record.position,
      certificate_file: null
    });
    setIsOpen(true);
  };

  useEffect(() => {
    async function fetchSecureAsset() {
      if (!selectedRecord || !selectedRecord.certificate_file) {
        setSecureFileUrl(null);
        return;
      }
      try {
        const response = await API.get(`/consultancy/${selectedRecord.id}/file/`);
        setSecureFileUrl(response.data.certificate_url);
      } catch (err) {
        console.error("Asset pipeline failed:", err);
        setSecureFileUrl(null);
      }
    }
    fetchSecureAsset();
  }, [selectedRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('organization_name', formData.organization_name);
    data.append('amount', formData.amount);
    data.append('position', formData.position);
    
    if (editingId) {
      const record = records.find(r => r.id === editingId);
      data.append('user', record.user);
    } else {
      data.append('user', currentUserId);
    }

    if (formData.certificate_file) {
      data.append('certificate_file', formData.certificate_file);
    }

    try {
      if (editingId) {
        await API.put(`/consultancy/${editingId}/update/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await API.post('/consultancy/consultancy/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsOpen(false);
      onRefresh();
    } catch (err) {
      alert('Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure?')) return;
    try {
      await API.delete(`/consultancy/${id}/delete/`);
      onRefresh();
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-6 space-y-4 font-sans mt-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Consultancy & Project Works</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage single or multi-consultant corporate execution works histories.</p>
        </div>
        {!isReadOnly && (
          <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition">
            + Add Project
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-slate-400 text-sm italic py-2">No corporate consultancy projects logged.</p>
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
                  <p className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{record.title}</p>
                  <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-white">View Details</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                  <span>Client Org: <strong className="text-slate-700">{record.organization_name}</strong></span>
                  <span>Amount: <strong className="text-slate-700">₹{parseFloat(record.amount).toLocaleString()}</strong></span>
                  <span>Execution: <strong className="text-slate-700 capitalize">{record.position?.toLowerCase()}</strong></span>
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
                    <button onClick={(e) => openEditModal(e, record)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition" title="Edit Entry">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={(e) => handleDelete(e, record.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition" title="Delete Entry">
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">Audit Activity Review</span>
                <h4 className="text-xl font-black text-slate-900 mt-1">{selectedRecord.title}</h4>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-b border-slate-100 pb-5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Client Organization</span>
                <strong className="text-slate-800 text-base mt-0.5 block">{selectedRecord.organization_name}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Sanctioned Grant Amount</span>
                <strong className="text-slate-800 text-base mt-0.5 block">₹{parseFloat(selectedRecord.amount).toLocaleString()}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Consultant Execution Assignment</span>
                <strong className="text-slate-800 text-base mt-0.5 block uppercase">{selectedRecord.position}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Institutional Evaluation Status</span>
                  <strong className="text-slate-800 text-base mt-0.5 block capitalize">{selectedRecord.approval_status}</strong>
                </div>
                {selectedRecord.approval_status === 'approved' && (
                  <span className="bg-blue-600 text-white font-black text-sm px-2.5 py-1 rounded-lg">+{selectedRecord.points} pts</span>
                )}
              </div>
            </div>

            {selectedRecord.message && (
              <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 text-sm space-y-1">
                <h5 className="font-bold text-amber-900">Evaluation Feed Remarks</h5>
                <p className="text-amber-800"><strong className="font-semibold text-amber-900">Feedback Note:</strong> {selectedRecord.message}</p>
                {selectedRecord.approved_by && <p className="text-xs text-amber-700/80 font-medium">Evaluated By: {selectedRecord.approved_by}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Uploaded Sanction Grant Proof Document</label>
              {selectedRecord.certificate_file ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 h-[280px] flex flex-col justify-center items-center relative group/file">
                  {secureFileUrl ? (
                    <iframe src={secureFileUrl} className="w-full h-full border-0 bg-white" title="Document Preview" />
                  ) : (
                    <div className="text-white text-xs flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Resolving secure token validation context...</span>
                    </div>
                  )}
                  {secureFileUrl && (
                    <div className="absolute bottom-3 right-3">
                      <a href={secureFileUrl} target="_blank" rel="noreferrer" className="bg-slate-900/90 text-white border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm">Open in New Tab</a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 bg-slate-50 text-slate-400 italic text-xs py-8 rounded-xl text-center">No structural proof asset linked onto this instance item descriptor.</div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setSelectedRecord(null)} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition shadow-sm">Close Review Panel</button>
            </div>
          </div>
        </div>
      )}

      {/* INPUT FORM MODAL WINDOW */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-bold text-slate-900">{editingId ? 'Modify Consultancy Project' : 'Log New Consultancy Work'}</h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Project Work / Assignment Title</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="e.g., Enterprise Architecture Assessment Layout Strategy" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Client Organization Name</label>
                  <input type="text" name="organization_name" required value={formData.organization_name} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="e.g., TE Connectivity R&D Labs Division" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Sanctioned Grant Amount (INR)</label>
                  <input type="number" name="amount" required value={formData.amount} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="e.g., 250000" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Consultant Execution Assignment</label>
                  <select name="position" value={formData.position} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white font-medium text-slate-700">
                    <option value="SINGLE">SINGLE (Principal Consultant)</option>
                    <option value="OTHER">OTHER (Co-Consultant / Joint Group Team)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Verification Document Asset (.jpg, .jpeg, .png, .webp)</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} required={!editingId} className="w-full text-sm px-3 py-1.5 border border-slate-200 bg-slate-50/50 rounded-xl file:mr-4 file:py-1 file:px-2.5 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border border-slate-200 text-sm text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Saving Consultancy Data...' : 'Save Consultancy Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}