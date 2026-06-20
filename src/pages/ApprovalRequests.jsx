import { useEffect, useState } from 'react';
import API from '../api/axios';

export default function ApprovalRequests() {
  const [requests, setRequests] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [activeFileRecordId, setActiveFileRecordId] = useState(null);
  const [activeModuleType, setActiveModuleType] = useState(''); 
  const [secureFileUrl, setSecureFileUrl] = useState(null);
  const [fetchingFile, setFetchingFile] = useState(false);

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const endpoints = [
        // Update these URLs to match your Django router prefixes exactly!
        { url: '/book/book-publications/requests/', type: 'book' },
        { url: '/course/course/requests/', type: 'course' },
        { url: '/conference/publications/requests/', type: 'conference_pub' },
        { url: '/consultancy/requests/', type: 'consultancy' },
        { url: '/fdps-attend/fdp/requests/', type: 'fdp_attend' }, // Make sure this matches your Postman test
        { url: '/fdpsor/fdpso/requests/', type: 'fdp_organized' }, // Make sure this matches
        { url: '/funded/funded-projects/requests/', type: 'funded_project' }, 
        { url: '/journal/journalpublication/requests/', type: 'journal' },
        { url: '/learning/learning-material/requests/', type: 'learning_material' },
        { url: '/professional-membership/professional/requests/', type: 'membership' },
        { url: '/patents/requests/', type: 'patent' },
        { url: '/research/research/requests/', type: 'guidance' },
        { url: '/session/chairing/requests/', type: 'session_chair' },
        { url: '/counselling/counselling/requests/', type: 'student_counselling' },
        { url: '/project/studentproject/requests/', type: 'student_project' },
      ];

      const responses = await Promise.all(endpoints.map(ep => API.get(ep.url).catch(() => ({ data: [] }))));
      
      const normalized = responses.flatMap((res, index) => 
        (res.data || []).map(item => ({ ...item, itemType: endpoints[index].type }))
      );

      setRequests(normalized);
    } catch (err) {
      console.error('Failed to retrieve validation queues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPendingRequests(); }, []);

  const handleInspectFile = async (id, type) => {
    setActiveFileRecordId(id);
    setActiveModuleType(type);
    setFetchingFile(true);
    try {
      const fileMap = {
        book: `/book/book-publications/${id}/file/`,
        course: `/course/course/${id}/file/`,
        conference_pub: `/conference/publications/${id}/file/`,
        consultancy: `/consultancy/${id}/file/`,
        fdp_attend: `/fdps-attend/fdp/${id}/file/`,
        fdp_organized: `/fdpsor/fdpso/${id}/file/`,
        journal: `/journal/journalpublication/${id}/file/`,
        membership: `/professional-membership/professional/${id}/file/`,
        patent: `/patents/${id}/file/`,
        session_chair: `/session/chairing/${id}/file/`,
        student_project: `/project/studentproject/${id}/file/`
      };

      if (!fileMap[type]) return;
      const response = await API.get(fileMap[type]);
      setSecureFileUrl(response.data.certificate_url);
    } catch (err) {
      alert("Could not load secure verification file.");
    } finally {
      setFetchingFile(false);
    }
  };

  const handleAction = async (pk, type, statusValue) => {
    const reqUid = `${type}-${pk}`;
    setProcessingId(reqUid);
    const textRemark = remarks[reqUid] || '';
    
    const routeMap = {
      book: `/book/book-publications/${pk}/approve/`,
      course: `/course/course/${pk}/approve/`,
      conference_pub: `/conference/publications/${pk}/approve/`,
      consultancy: `/consultancy/${pk}/approve/`,
      fdp_attend: `/fdps-attend/fdp/${pk}/approve/`,
      fdp_organized: `/fdpsor/fdpso/${pk}/approve/`,
      funded_project: `/funded/funded-projects/${pk}/approve/`,
      journal: `/journal/journalpublication/${pk}/approve/`,
      learning_material: `/learning/learning-material/${pk}/approve/`,
      membership: `/professional-membership/professional/${pk}/approve/`,
      patent: `/patents/${pk}/approve/`,
      guidance: `/research/research/${pk}/approve/`,
      session_chair: `/session/chairing/${pk}/approve/`,
      student_counselling: `/counselling/counselling/${pk}/approve/`,
      student_project: `/project/studentproject/${pk}/approve/`,
    };

    try {
      if (!routeMap[type]) throw new Error("Unknown module type");
      
      await API.post(routeMap[type], { status: statusValue, message: textRemark });
      
      alert(`Successfully ${statusValue}d.`);
      setRemarks(prev => ({ ...prev, [reqUid]: '' }));
      loadPendingRequests();
    } catch (err) {
      console.error("Action Error:", err);
      alert('Action failed. Check console.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemarkChange = (pk, type, val) => {
    setRemarks({ ...remarks, [`${type}-${pk}`]: val });
  };

  if (loading) return <div className="flex justify-center p-10">Loading...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto antialiased font-sans p-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <h2 className="text-xl font-black text-slate-900">Appraisal Approval Inbox</h2>
        <p className="text-slate-500 text-sm mt-0.5">Evaluate pending faculty submissions, verify uploaded document assets, and clear point weight queues.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 font-medium italic">
          No pending evaluation requests found inside your department tracking queue backlog.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => {
            const reqUid = `${req.itemType}-${req.id}`;
            
            const titleText = req.book_title || req.title || req.project_title || req.publication_title || req.subject_name || req.organization_name || req.event_name || req.Course_name || "Appraisal Submission Log";
            const facultyName = req.user_name || req.user?.username || "Faculty Member";
            const facultyReg = req.user_register_no || req.user?.register_no || "N/A";

            return (
              <div key={reqUid} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:border-slate-300 transition-colors">
                <div className="space-y-3 flex-grow">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase bg-blue-50 border border-blue-100 text-blue-700">
                      {req.itemType?.replace('_', ' ')}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 mt-2">{titleText}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Submitted By: <span className="text-blue-600 font-bold">{facultyName}</span> ({facultyReg})
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/60 border border-slate-100 p-3 rounded-xl text-xs text-slate-600">
                    {req.organization_name && <div>Organization: <strong>{req.organization_name}</strong></div>}
                    {req.publisher_name && <div>Publisher: <strong>{req.publisher_name}</strong></div>}
                    {req.journal_name && <div>Journal: <strong>{req.journal_name}</strong></div>}
                    {req.grant_amount && <div>Grant Amount: <strong>₹{parseFloat(req.grant_amount).toLocaleString()}</strong></div>}
                    {req.amount && <div>Amount: <strong>₹{parseFloat(req.amount).toLocaleString()}</strong></div>}
                    {req.total_students && <div>Students Target: <strong>{req.total_students} Candidates</strong></div>}
                    {req.publication_type && <div className="uppercase">Indexing Track: <strong>{req.publication_type}</strong></div>}
                    {req.patent_number && <div>Patent ID: <strong className="font-mono">{req.patent_number}</strong></div>}
                  </div>

                  <div className="pt-1">
                    {activeFileRecordId === req.id && activeModuleType === req.itemType ? (
                      <div className="space-y-2">
                        <button onClick={() => { setActiveFileRecordId(null); setActiveModuleType(''); }} className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1">
                          ✕ Hide Certificate Document Preview
                        </button>
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 h-[280px] flex flex-col justify-center items-center relative">
                          {fetchingFile ? (
                            <div className="text-white text-xs flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Requesting secure validation link...</span>
                            </div>
                          ) : secureFileUrl ? (
                            <iframe src={secureFileUrl} className="w-full h-full border-0 bg-white" title="Evaluation Document Preview" />
                          ) : (
                            <span className="text-slate-400 text-xs italic">Failed to open proof asset window.</span>
                          )}
                          {secureFileUrl && (
                            <div className="absolute bottom-3 right-3">
                              <a href={secureFileUrl} target="_blank" rel="noreferrer" className="bg-slate-900/90 text-white border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm">Open in New Tab</a>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      !['funded_project', 'learning_material', 'guidance', 'student_counselling', 'student_feedback'].includes(req.itemType) && (
                        <button onClick={() => handleInspectFile(req.id, req.itemType)} className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold underline underline-offset-2">
                          📁 Securely View Uploaded Verification Certificate Proof
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="md:w-72 shrink-0 flex flex-col justify-between gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Evaluation Review Remarks</label>
                    <textarea
                      placeholder="Enter rejection reasons or approval feedback notes..."
                      value={remarks[reqUid] || ''}
                      onChange={(e) => handleRemarkChange(req.id, req.itemType, e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none h-16"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAction(req.id, req.itemType, 'rejected')} disabled={processingId === reqUid} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition">
                      Reject
                    </button>
                    <button onClick={() => handleAction(req.id, req.itemType, 'approved')} disabled={processingId === reqUid} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm transition">
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}