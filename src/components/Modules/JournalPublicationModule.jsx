import { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function JournalPublicationModule({ records = [], isReadOnly, currentUserId, onRefresh }) {
  const [secureFileUrl, setSecureFileUrl] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [formData, setFormData] = useState({
    publication_title: '',
    journal_name: '',
    publication_type: 'SCI',
    author_type: 'FIRST_AUTHOR',
    doi_number: '',
    publication_date: '',
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
    setFormData({
      publication_title: '',
      journal_name: '',
      publication_type: 'SCI',
      author_type: 'FIRST_AUTHOR',
      doi_number: '',
      publication_date: '',
      certificate_file: null
    });
    setIsOpen(true);
  };

  const openEditModal = (e, record) => {
    e.stopPropagation();
    setEditingId(record.id);
    setFormData({
      publication_title: record.publication_title,
      journal_name: record.journal_name || '',
      publication_type: record.publication_type,
      author_type: record.author_type,
      doi_number: record.doi_number || '',
      publication_date: record.publication_date || '',
      certificate_file: null
    });
    setIsOpen(true);
  };

  // Securely resolve pre-signed S3 download URLs
  useEffect(() => {
    async function fetchSecureAsset() {
      if (!selectedRecord || !selectedRecord.certificate_file) {
        setSecureFileUrl(null);
        return;
      }
      try {
        // Hits backend: GET /journal/journalpublication/<id>/file (No trailing slash)
        const response = await API.get(`/journal/journalpublication/${selectedRecord.id}/file`);
        setSecureFileUrl(response.data.certificate_url);
      } catch (err) {
        console.error("Asset pipeline failed to resolve file source:", err);
        setSecureFileUrl(null);
      }
    }
    fetchSecureAsset();
  }, [selectedRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('publication_title', formData.publication_title);
    data.append('journal_name', formData.journal_name);
    data.append('publication_type', formData.publication_type);
    data.append('author_type', formData.author_type);
    data.append('doi_number', formData.doi_number);
    data.append('publication_date', formData.publication_date);
    
    if (editingId) {
      const record = records.find(r => r.id === editingId);
      data.append('user', record.user); // Required explicitly by backend update validations
    } else {
      if (records.length > 0 && records[0].user) {
        data.append('user', records[0].user);
      } else if (currentUserId) {
        data.append('user', currentUserId);
      }
    }

    if (formData.certificate_file) {
      data.append('certificate_file', formData.certificate_file);
    }

    try {
      if (editingId) {
        // Hits PUT /journal/journalpublication/<id>/update (No trailing slash)
        await API.put(`/journal/journalpublication/${editingId}/update`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Hits POST /journal/journalpublication/create/ (With trailing slash)
        await API.post('/journal/journalpublication/create/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
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
    if (!window.confirm('Are you sure you want to remove this journal entry?')) return;
    try {
      // Hits DELETE /journal/journalpublication/<id>/delete (No trailing slash)
      await API.delete(`/journal/journalpublication/${id}/delete`);
      onRefresh();
    } catch (err) {
      alert('Failed to delete journal publication entry.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-6 space-y-4 font-sans mt-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Journal Publications</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage and append professional journal research entries cleanly mapped to verification streams.</p>
        </div>
        {!isReadOnly && (
          <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition">
            + Add Journal
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-slate-400 text-sm italic py-2">No tracked journal publication entries logged.</p>
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
                  <p className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{record.publication_title}</p>
                  <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-white">View Details</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                  <span>Journal: <strong className="text-slate-700">{record.journal_name || 'N/A'}</strong></span>
                  <span>Index Track: <strong className="text-slate-700 uppercase">{record.publication_type}</strong></span>
                  <span>Ownership: <strong className="text-slate-700 capitalize">{record.author_type?.toLowerCase().replace('_', ' ')}</strong></span>
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">Journal Inspection View</span>
                <h4 className="text-xl font-black text-slate-900 mt-1">{selectedRecord.publication_title}</h4>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-b border-slate-100 pb-5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Journal Title Platform</span>
                <strong className="text-slate-800 text-base mt-0.5 block">{selectedRecord.journal_name || 'N/A'}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Indexing Stream Base</span>
                <strong className="text-slate-800 text-base mt-0.5 block uppercase">{selectedRecord.publication_type}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Author Assignment Ownership</span>
                <strong className="text-slate-800 text-base mt-0.5 block uppercase">{selectedRecord.author_type?.replace('_', ' ')}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">DOI Identifier Index</span>
                <strong className="text-slate-800 text-sm mt-0.5 block font-mono">{selectedRecord.doi_number || 'None'}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Publication Release Date</span>
                <strong className="text-slate-800 text-base mt-0.5 block">{selectedRecord.publication_date || 'N/A'}</strong>
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
                <p className="text-amber-800"><strong className="font-semibold text-amber-900">Feedback Notes:</strong> {selectedRecord.message}</p>
                {selectedRecord.approved_by && <p className="text-xs text-amber-700/80 font-medium">Evaluated By: {selectedRecord.approved_by}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Uploaded Manuscript / Copy Page Proof Document</label>
              {selectedRecord.certificate_file ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 h-[280px] flex flex-col justify-center items-center relative group/file">
                  {secureFileUrl ? (
                    <iframe src={secureFileUrl} className="w-full h-full border-0 bg-white" title="Proof View Preview" />
                  ) : (
                    <div className="text-white text-xs flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading secure file tracking layer...</span>
                    </div>
                  )}
                  {secureFileUrl && (
                    <div className="absolute bottom-3 right-3">
                      <a href={secureFileUrl} target="_blank" rel="noreferrer" className="bg-slate-900/90 text-white border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm">Open in New Tab</a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 bg-slate-50 text-slate-400 italic text-xs py-8 rounded-xl text-center">No structural verification asset linked onto this description model.</div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setSelectedRecord(null)} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition shadow-sm">Close Audit View</button>
            </div>
          </div>
        </div>
      )}

      {/* INPUT FORM MODAL WINDOW */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-bold text-slate-900">{editingId ? 'Modify Journal Milestone' : 'Log New Journal Publication'}</h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Publication Article Title</label>
                  <input type="text" name="publication_title" required value={formData.publication_title} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Journal Index Name</label>
                  <input type="text" name="journal_name" required value={formData.journal_name} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="e.g., International Journal of Quality Assurance Structures" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Indexing Stream Category</label>
                  <select name="publication_type" value={formData.publication_type} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white font-medium text-slate-700">
                    <option value="SCI">SCI Track Index</option>
                    <option value="SCOPUS">SCOPUS Indexed</option>
                    <option value="UGC">UGC Care Listed</option>
                    <option value="PEER_REVIEWED">Standard Peer Reviewed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Author Assignment</label>
                  <select name="author_type" value={formData.author_type} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white font-medium text-slate-700">
                    <option value="FIRST_AUTHOR">FIRST AUTHOR</option>
                    <option value="OTHER_AUTHOR">CO-AUTHOR / OTHER AUTHOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">DOI Digital Number Link</label>
                  <input type="text" name="doi_number" value={formData.doi_number} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="e.g., 10.1007/s001-026" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Publication Issue Date</label>
                  <input type="date" name="publication_date" required value={formData.publication_date} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Verification Manuscript Copy (.jpg, .png, .pdf)</label>
                  <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} required={!editingId} className="w-full text-sm px-3 py-1.5 border border-slate-200 bg-slate-50/50 rounded-xl file:mr-4 file:py-1 file:px-2.5 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border border-slate-200 text-sm text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Saving Publication...' : 'Save Activity Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}