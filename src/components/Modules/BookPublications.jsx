import { useState, useEffect } from 'react'; // Fixed: Included useEffect here
import API from '../../api/axios';

export default function BookPublications({ records = [], isReadOnly, onRefresh }) {
  const [secureFileUrl, setSecureFileUrl] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // UX State: Track which record is currently selected for full detail viewing
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [formData, setFormData] = useState({
    book_title: '',
    publisher_name: '',
    publisher_type: 'national',
    isbn_status: 'no',
    isbn_number: '',
    author_type: 'first_author',
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
    e.stopPropagation(); // Prevent opening the detail card drawer
    setEditingId(null);
    setFormData({
      book_title: '',
      publisher_name: '',
      publisher_type: 'national',
      isbn_status: 'no',
      isbn_number: '',
      author_type: 'first_author',
      publication_date: '',
      certificate_file: null
    });
    setIsOpen(true);
  };

  const openEditModal = (e, record) => {
    e.stopPropagation(); // Prevent opening the detail card drawer
    setEditingId(record.id);
    setFormData({
      book_title: record.book_title,
      publisher_name: record.publisher_name || '',
      publisher_type: record.publisher_type,
      isbn_status: record.isbn_status,
      isbn_number: record.isbn_number || '',
      author_type: record.author_type,
      publication_date: record.publication_date,
      certificate_file: null
    });
    setIsOpen(true);
  };

  // Dynamic secure hook to call the backend pre-signed asset generator
  useEffect(() => {
    async function fetchSecureAsset() {
      if (!selectedRecord || !selectedRecord.certificate_file) {
        setSecureFileUrl(null);
        return;
      }
      try {
        // Hits your backend: GET /book/book-publications/<id>/file/ with Auth headers
        const response = await API.get(`/book/book-publications/${selectedRecord.id}/file/`);
        setSecureFileUrl(response.data.certificate_url);
      } catch (err) {
        console.error("Asset tracking pipeline failed to decode source:", err);
        setSecureFileUrl(null);
      }
    }
    fetchSecureAsset();
  }, [selectedRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('book_title', formData.book_title);
    data.append('publisher_name', formData.publisher_name);
    data.append('publisher_type', formData.publisher_type);
    data.append('isbn_status', formData.isbn_status);
    data.append('isbn_number', formData.isbn_number);
    data.append('author_type', formData.author_type);
    data.append('publication_date', formData.publication_date);
    
    if (editingId) {
      const record = records.find(r => r.id === editingId);
      data.append('user', record.user);
    }

    if (formData.certificate_file) {
      data.append('certificate_file', formData.certificate_file);
    }

    try {
      if (editingId) {
        await API.put(`/book/book-publications/${editingId}/update/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await API.post('/book/book-publications/create/', data, {
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
    e.stopPropagation(); // Prevent opening the detail card drawer
    if (!window.confirm('Are you absolutely sure you want to remove this publication entry?')) return;
    try {
      await API.delete(`/book/book-publications/${id}/delete/`);
      onRefresh();
    } catch (err) {
      alert('Failed to complete entry removal request.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-6 space-y-4 font-sans">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Book Publications</h3>
          <p className="text-xs text-slate-500 mt-0.5">Track books authored, co-authored, or published with ISBN allocations.</p>
        </div>
        {!isReadOnly && (
          <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition">
            + Add Book
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-slate-400 text-sm italic py-2">No book publications recorded down in portfolio history charts.</p>
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
                  <p className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{record.book_title}</p>
                  <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-white">View Details</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                  <span>Publisher: <strong className="text-slate-700">{record.publisher_name || 'N/A'}</strong></span>
                  <span className="capitalize">Type: <strong className="text-slate-700">{record.publisher_type}</strong></span>
                  <span className="capitalize">Role: <strong className="text-slate-700">{record.author_type.replace('_', ' ')}</strong></span>
                  {record.isbn_number && <span>ISBN: <strong className="text-slate-700">{record.isbn_number}</strong></span>}
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
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">
                  Verification Audit View
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-1">{selectedRecord.book_title}</h4>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-b border-slate-100 pb-5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Publisher Name</span>
                <strong className="text-slate-800 text-base mt-0.5 block">{selectedRecord.publisher_name || 'N/A'}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Publisher Type</span>
                <strong className="text-slate-800 text-base mt-0.5 block capitalize">{selectedRecord.publisher_type}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Author Assignment</span>
                <strong className="text-slate-800 text-base mt-0.5 block capitalize">{selectedRecord.author_type.replace('_', ' ')}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Publication Date</span>
                <strong className="text-slate-800 text-base mt-0.5 block">{selectedRecord.publication_date}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">ISBN Registration</span>
                <strong className="text-slate-800 text-base mt-0.5 block uppercase">{selectedRecord.isbn_number || 'No ISBN Tracked'}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Audit Status / Points</span>
                  <strong className="text-slate-800 text-base mt-0.5 block capitalize">{selectedRecord.approval_status}</strong>
                </div>
                {selectedRecord.approval_status === 'approved' && (
                  <span className="bg-blue-600 text-white font-black text-sm px-2.5 py-1 rounded-lg">+{selectedRecord.points} pts</span>
                )}
              </div>
            </div>

            {/* Audit Tracking Trail & Remarks */}
            {(selectedRecord.remarks || selectedRecord.approved_by) && (
              <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 text-sm space-y-1">
                <h5 className="font-bold text-amber-900 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  Evaluation Audit Remarks
                </h5>
                <p className="text-amber-800"><strong className="font-semibold text-amber-900">Remarks:</strong> {selectedRecord.remarks || 'No processing feedback logged.'}</p>
                {selectedRecord.approved_by && <p className="text-xs text-amber-700/80 font-medium">Evaluated and approved by user profile session parameter: {selectedRecord.approved_by}</p>}
              </div>
            )}

            {/* Document Viewer Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Uploaded Document Proof</label>
              {selectedRecord.certificate_file ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 h-[280px] flex flex-col justify-center items-center relative group/file">
                  {secureFileUrl ? (
                    <iframe 
                      src={secureFileUrl} 
                      className="w-full h-full border-0 bg-white"
                      title="Certificate Preview"
                    />
                  ) : (
                    <div className="text-white text-xs flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading secure validation layer...</span>
                    </div>
                  )}
                  {secureFileUrl && (
                    <div className="absolute bottom-3 right-3 opacity-90 hover:opacity-100 transition-opacity">
                      <a 
                        href={secureFileUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="bg-slate-900/90 text-white border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg backdrop-blur-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        Open in New Tab
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 bg-slate-50 text-slate-400 italic text-xs py-8 rounded-xl text-center">
                  No certificate verification upload linked onto this entry structure.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setSelectedRecord(null)} 
                className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition shadow-sm"
              >
                Close Audit View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* INPUT FORM MODAL WINDOW */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-bold text-slate-900">{editingId ? 'Modify Publication Record' : 'Log New Book Publication'}</h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Book Title</label>
                  <input type="text" name="book_title" required value={formData.book_title} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="e.g., Fundamentals of Python Automation" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Publisher Name</label>
                  <input type="text" name="publisher_name" required value={formData.publisher_name} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="e.g., O'Reilly Media" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Publication Date</label>
                  <input type="date" name="publication_date" required value={formData.publication_date} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Publisher Jurisdiction</label>
                  <select name="publisher_type" value={formData.publisher_type} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700">
                    <option value="national">National Publisher</option>
                    <option value="international">International Publisher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Author Ownership Role</label>
                  <select name="author_type" value={formData.author_type} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700">
                    <option value="first_author">First Author</option>
                    <option value="co_author">Co-Author / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Has ISBN Allocation?</label>
                  <select name="isbn_status" value={formData.isbn_status} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700">
                    <option value="no">No ISBN Allocation</option>
                    <option value="yes">Yes, ISBN Allocated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">ISBN Reference Number</label>
                  <input type="text" name="isbn_number" disabled={formData.isbn_status === 'no'} value={formData.isbn_number} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all disabled:opacity-40 disabled:bg-slate-100" placeholder="e.g., 978-3-16-148410-0" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Verification Certificate File (.pdf, .png, .jpg)</label>
                  <input type="file" onChange={handleFileChange} required={!editingId} className="w-full text-sm px-3 py-1.5 border border-slate-200 bg-slate-50/50 rounded-xl file:mr-4 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border border-slate-200 text-sm text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Saving Changes...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}