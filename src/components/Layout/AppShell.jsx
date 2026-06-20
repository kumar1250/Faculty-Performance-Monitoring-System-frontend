import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import { fetchModuleRecords, fetchPresignedFileUrl } from '../../api/moduleEndpoints';

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIVILEGED = ['hod', 'principal', 'dean', 'committee_coordinator', 'department_incharge'];

const MODULE_META = {
  'Book Publications':                    { icon: '📚', color: '#6366f1', bg: '#eef2ff' },
  'Certificate Courses Done':             { icon: '🏆', color: '#10b981', bg: '#ecfdf5' },
  'Conference Publications':              { icon: '📄', color: '#8b5cf6', bg: '#f5f3ff' },
  'Consultancy':                          { icon: '🤝', color: '#f59e0b', bg: '#fffbeb' },
  'FDPs Attended':                        { icon: '🎓', color: '#ef4444', bg: '#fef2f2' },
  'FDPs Organized':                       { icon: '🗂️',  color: '#ec4899', bg: '#fdf2f8' },
  'Funded Projects':                      { icon: '💰', color: '#0ea5e9', bg: '#f0f9ff' },
  'Journal Publications':                 { icon: '📰', color: '#7c3aed', bg: '#ede9fe' },
  'Learning Material':                    { icon: '📝', color: '#64748b', bg: '#f8fafc' },
  'Memberships with Professional Bodies': { icon: '🏅', color: '#84cc16', bg: '#f7fee7' },
  'Patents':                              { icon: '💡', color: '#f97316', bg: '#fff7ed' },
  'Research Guidance':                    { icon: '🔬', color: '#14b8a6', bg: '#f0fdfa' },
  'Sessions & Delivering Talks/Lectures': { icon: '🎙️', color: '#a855f7', bg: '#faf5ff' },
  'Student Counselling / Mentoring':      { icon: '💬', color: '#06b6d4', bg: '#ecfeff' },
  'Student Project Works':                { icon: '🛠️', color: '#3b82f6', bg: '#eff6ff' },
  'Theory Courses Handled':               { icon: '⭐', color: '#eab308', bg: '#fefce8' },
};
function getMeta(label) {
  return MODULE_META[label] || { icon: '📌', color: '#3b82f6', bg: '#eff6ff' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Pill({ count, type }) {
  const s = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${s[type] || s.pending}`}>
      {count}
    </span>
  );
}

function humanize(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatFieldValue(val, key, ctx) {
  if (val === null || val === undefined || val === '') return <span className="text-slate-300 italic text-xs">—</span>;
  if (key === 'approval_status') return <Pill count={val} type={val} />;
  if (typeof val === 'object' && val.username) return <span>{val.username} <span className="text-slate-400">({val.register_no})</span></span>;
  if (typeof val === 'object') return <span className="text-slate-500 text-xs">{JSON.stringify(val)}</span>;
  if (typeof val === 'boolean') return val ? '✅ Yes' : '❌ No';
  if (typeof val === 'string' && val.startsWith('http')) {
    return <SecureFilePreview moduleLabel={ctx?.moduleLabel} recordId={ctx?.recordId} rawUrl={val} />;
  }
  if (key === 'points') return <span className="font-black text-blue-700">{val}</span>;
  return <span className="text-slate-700 text-sm">{String(val)}</span>;
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

function getExtension(url) {
  if (!url) return '';
  const clean = url.split('?')[0];
  const last = clean.split('.').pop();
  return (last || '').toLowerCase();
}

// Raw `certificate_file` URLs from list/detail responses are unsigned and
// will 403 (AccessDenied) since the S3 bucket is private. This component
// instead calls the module's dedicated /file/ action on click, which
// returns a short-lived signed URL, and renders the file inline in the
// card (image preview, or an embedded PDF viewer) rather than opening a
// new tab — avoiding popup-blocker issues entirely.
function SecureFilePreview({ moduleLabel, recordId, rawUrl }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState(null);

  const extension = getExtension(rawUrl);
  const isImage = IMAGE_EXTENSIONS.includes(extension);
  const isPdf = extension === 'pdf';

  const handleToggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (resolvedUrl) return; // already fetched once, just re-show it
    setError(false);
    setLoading(true);
    const url = await fetchPresignedFileUrl(API, moduleLabel, recordId);
    setLoading(false);
    if (url) {
      setResolvedUrl(url);
    } else {
      setError(true);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1.5 w-full">
      <button type="button" onClick={handleToggle} disabled={loading}
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-xs font-semibold disabled:text-slate-400 disabled:no-underline">
        {loading ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            Loading…
          </>
        ) : open ? (
          <>▾ Hide File</>
        ) : (
          <>📎 View File</>
        )}
      </button>

      {error && <span className="text-[10px] text-red-500 font-semibold">Could not load file. Check you're signed in and try again.</span>}

      {open && resolvedUrl && (
        <div className="w-full border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
          {isImage ? (
            <img src={resolvedUrl} alt="Uploaded certificate"
              className="w-full max-h-72 object-contain bg-white" />
          ) : isPdf ? (
            <iframe src={resolvedUrl} title="Uploaded certificate"
              className="w-full h-72 bg-white border-0" />
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 font-semibold">
              Preview not available for this file type.
            </div>
          )}
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer"
            className="block text-center text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline py-1.5 bg-white border-t border-slate-100">
            Open full size ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Module Detail Drawer (inside Faculty Modal) ──────────────────────────────
function ModuleDrawer({ module, registerNo, onClose }) {
  const [recordState, setRecordState] = useState({ key: null, records: [] });

  useEffect(() => {
    let cancelled = false;
    const key = `${module.module}::${registerNo}`;
    fetchModuleRecords(API, module.module, registerNo).then(data => {
      if (!cancelled) {
        setRecordState({ key, records: data });
      }
    });
    return () => { cancelled = true; };
  }, [module, registerNo]);

  const currentKey = `${module.module}::${registerNo}`;
  const loadingRecords = recordState.key !== currentKey;
  const records = loadingRecords ? [] : recordState.records;
  const meta = getMeta(module.module);
  const skipFields = new Set(['user', 'faculty', 'password']);
  const fieldKeys = records.length > 0
    ? Object.keys(records[0]).filter(k => !skipFields.has(k))
    : [];

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6 overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
          style={{ background: meta.bg }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.icon}</span>
            <div>
              <h2 className="text-lg font-black text-slate-900">{module.module}</h2>
              <p className="text-xs text-slate-500 font-semibold">
                {module.total} submitted · {module.approved} approved · {module.pending} pending · {module.rejected} rejected · <span className="font-black" style={{ color: meta.color }}>{module.points} pts</span>
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-red-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition font-bold text-lg">
            ✕
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-white">
          {[
            { l: 'Submitted', v: module.total,    c: '#3b82f6' },
            { l: 'Approved',  v: module.approved, c: '#10b981' },
            { l: 'Pending',   v: module.pending,  c: '#f59e0b' },
            { l: 'Rejected',  v: module.rejected, c: '#ef4444' },
          ].map(s => (
            <div key={s.l} className="py-3 text-center">
              <p className="text-2xl font-black" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Records */}
        <div className="p-5 max-h-[62vh] overflow-y-auto space-y-4">
          {loadingRecords ? (
            <div className="text-center py-12 text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="font-semibold">Loading records…</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="text-4xl block mb-2">📭</span>
              <p className="font-semibold">No records in this module.</p>
            </div>
          ) : records.map((rec, idx) => (
            <div key={rec.id || idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Record #{idx + 1}</span>
                <div className="flex items-center gap-2">
                  {rec.points !== undefined && rec.points !== null && (
                    <span className="text-xs font-black px-2 py-0.5 rounded-full border"
                      style={{ color: meta.color, background: meta.bg, borderColor: meta.color + '30' }}>
                      {rec.points} pts
                    </span>
                  )}
                  {rec.approval_status && <Pill count={rec.approval_status} type={rec.approval_status} />}
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {fieldKeys
                  .filter(k => k !== 'approval_status' && k !== 'points')
                  .map(key => {
                    const isFileField = typeof rec[key] === 'string' && rec[key].startsWith('http');
                    return (
                      <div key={key} className={`min-w-0 ${isFileField ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{humanize(key)}</p>
                        <div className={`text-sm font-semibold ${isFileField ? '' : 'truncate'}`}>
                          {formatFieldValue(rec[key], key, { moduleLabel: module.module, recordId: rec.id })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50">
          <button onClick={onClose}
            className="px-5 py-2 text-sm font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition">
            ← Back to Faculty Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Faculty Dashboard Modal (search result) ──────────────────────────────────
function FacultyDashboardModal({ data, onClose }) {
  const [activeModule, setActiveModule] = useState(null);

  if (!data) return null;

  const modules = data.modules || [];
  const totalPoints = data.total_points ?? 0;
  const totalApproved  = modules.reduce((s, m) => s + (m.approved ?? 0), 0);
  const totalPending   = modules.reduce((s, m) => s + (m.pending ?? 0), 0);
  const totalRejected  = modules.reduce((s, m) => s + (m.rejected ?? 0), 0);
  const totalSubmitted = modules.reduce((s, m) => s + (m.total ?? 0), 0);
  const maxPts = Math.max(...modules.map(m => m.points ?? 0), 1);

  return (
    <>
      {activeModule && (
        <ModuleDrawer module={activeModule} registerNo={data.register_no} onClose={() => setActiveModule(null)} />
      )}

      <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 overflow-y-auto"
        onClick={onClose}>
        <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl my-4 overflow-hidden"
          onClick={e => e.stopPropagation()}>

          {/* ── Modal Header ── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-5 text-white">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-0.5">Faculty Performance Dashboard</p>
                <h2 className="text-2xl font-black capitalize">{data.username}</h2>
                <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-blue-100">
                  <span>🆔 {data.register_no}</span>
                  <span>✉️ {data.email}</span>
                  <span>🏷️ {data.role?.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
              </div>
              <button onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition font-bold text-lg flex-shrink-0">
                ✕
              </button>
            </div>

            {/* Rank + Points badges */}
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center min-w-[90px]">
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Total Points</p>
                <p className="text-3xl font-black">{totalPoints}</p>
              </div>
              {data.rank && (
                <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center min-w-[90px]">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Rank</p>
                  <p className="text-3xl font-black">
                    {data.rank === 1 ? '🥇' : data.rank === 2 ? '🥈' : data.rank === 3 ? '🥉' : `#${data.rank}`}
                  </p>
                </div>
              )}
              {data.peer_group_size && (
                <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center min-w-[90px]">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Peer Group</p>
                  <p className="text-3xl font-black">{data.peer_group_size}</p>
                </div>
              )}
              {data.points_behind_first !== undefined && data.points_behind_first > 0 && (
                <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center min-w-[90px]">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Behind #1</p>
                  <p className="text-3xl font-black">{data.points_behind_first}</p>
                </div>
              )}
              {data.points_behind_first === 0 && data.rank === 1 && (
                <div className="bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-4 py-2 flex items-center gap-2">
                  <span className="text-2xl">👑</span>
                  <span className="text-yellow-100 text-sm font-black">Top of the Leaderboard!</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Quick Stats ── */}
          <div className="grid grid-cols-4 divide-x divide-slate-200 border-b border-slate-200 bg-white">
            {[
              { l: 'Submitted', v: totalSubmitted, c: '#3b82f6' },
              { l: 'Approved',  v: totalApproved,  c: '#10b981' },
              { l: 'Pending',   v: totalPending,   c: '#f59e0b' },
              { l: 'Rejected',  v: totalRejected,  c: '#ef4444' },
            ].map(s => (
              <div key={s.l} className="py-4 text-center">
                <p className="text-2xl font-black" style={{ color: s.c }}>{s.v}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.l}</p>
              </div>
            ))}
          </div>

          {/* ── Modules Table ── */}
          <div className="p-5 max-h-[55vh] overflow-y-auto">
            <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
              📋 All Activity Modules
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Click "View Details" to expand records
              </span>
            </h3>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">#</th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Module</th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Total</th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Approved</th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Pending</th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Rejected</th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Points</th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-24">Progress</th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {modules.map((m, idx) => {
                    const meta = getMeta(m.module);
                    const hasData = (m.total ?? 0) > 0;
                    const pct = maxPts > 0 ? Math.min(100, ((m.points ?? 0) / maxPts) * 100) : 0;
                    return (
                      <tr key={m.module} className={`hover:bg-blue-50/30 transition-colors ${!hasData ? 'opacity-40' : ''}`}>
                        <td className="px-4 py-3 text-xs font-bold text-slate-300">{idx + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                              style={{ background: meta.bg }}>{meta.icon}</div>
                            <span className="text-sm font-bold text-slate-800 whitespace-nowrap">{m.module}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-sm font-black text-slate-700">{m.total ?? 0}</span>
                        </td>
                        <td className="px-3 py-3 text-center"><Pill count={m.approved ?? 0} type="approved" /></td>
                        <td className="px-3 py-3 text-center"><Pill count={m.pending ?? 0} type="pending" /></td>
                        <td className="px-3 py-3 text-center"><Pill count={m.rejected ?? 0} type="rejected" /></td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-sm font-black" style={{ color: (m.points ?? 0) > 0 ? meta.color : '#cbd5e1' }}>
                            {m.points ?? 0}
                          </span>
                        </td>
                        <td className="px-3 py-3 w-24">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: meta.color }} />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => hasData && setActiveModule(m)}
                            disabled={!hasData}
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all
                              ${hasData
                                ? 'bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 text-slate-600 border-slate-200 shadow-sm'
                                : 'text-slate-200 border-slate-100 cursor-default'}`}>
                            🔍 View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan="2" className="px-4 py-3">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-wider">TOTAL</span>
                    </td>
                    <td className="px-3 py-3 text-center font-black text-sm text-slate-800">{totalSubmitted}</td>
                    <td className="px-3 py-3 text-center font-black text-sm text-emerald-700">{totalApproved}</td>
                    <td className="px-3 py-3 text-center font-black text-sm text-amber-700">{totalPending}</td>
                    <td className="px-3 py-3 text-center font-black text-sm text-red-700">{totalRejected}</td>
                    <td className="px-3 py-3 text-right font-black text-sm text-blue-700">{totalPoints}</td>
                    <td colSpan="2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Rankings Panel (navbar) ───────────────────────────────────────────────────
function RankingsPanel({ isPrivileged }) {
  const [open, setOpen]             = useState(false);
  const [board, setBoard]           = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [boardError, setBoardError] = useState('');

  const [regQuery, setRegQuery]     = useState('');
  const [lookupError, setLookupError] = useState('');
  const [loadingLookup, setLoadingLookup] = useState(false);

  const [loadingDash, setLoadingDash] = useState(false);
  const [dashData, setDashData]     = useState(null);
  const [dashError, setDashError]   = useState('');

  const panelRef = useRef(null);
  const btnRef   = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadBoard = async () => {
    setLoadingBoard(true);
    setBoardError('');
    try {
      const res = await API.get('/summary/faculty-summary/all-faculty/?role=all');
      setBoard(res.data?.leaderboard || []);
      setLoadedOnce(true);
    } catch {
      setBoardError('Could not load rankings.');
    } finally {
      setLoadingBoard(false);
    }
  };

  const togglePanel = () => {
    const next = !open;
    setOpen(next);
    if (next && !loadedOnce) loadBoard();
  };

  const openDashboard = async (registerNo) => {
    setDashError('');
    setLoadingDash(true);
    try {
      const res = await API.get(`/summary/faculty-summary/dashboard/?register_no=${registerNo}&role=all`);
      setDashData(res.data);
      setOpen(false);
    } catch {
      setDashError('Could not load faculty dashboard for that register number.');
    } finally {
      setLoadingDash(false);
    }
  };

  const handleRegisterLookup = async (e) => {
    e.preventDefault();
    const regNo = regQuery.trim();
    if (!regNo) return;
    setLookupError('');
    setLoadingLookup(true);
    try {
      const res = await API.get(`/summary/faculty-summary/dashboard/?register_no=${encodeURIComponent(regNo)}&role=all`);
      setDashData(res.data);
      setOpen(false);
      setRegQuery('');
    } catch {
      setLookupError(`No faculty found with register number "${regNo}".`);
    } finally {
      setLoadingLookup(false);
    }
  };

  if (!isPrivileged) return null;

  return (
    <>
      {/* Loading overlay while opening a faculty dashboard */}
      {loadingDash && (
        <div className="fixed inset-0 z-[65] bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-700">Loading Faculty Dashboard…</p>
          </div>
        </div>
      )}

      {/* Faculty Dashboard Modal */}
      {dashData && <FacultyDashboardModal data={dashData} onClose={() => setDashData(null)} />}
      {dashError && !dashData && (
        <div className="fixed bottom-6 right-6 z-[65] bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl shadow-lg max-w-xs">
          {dashError}
          <button onClick={() => setDashError('')} className="ml-2 text-red-400 hover:text-red-600 font-black">✕</button>
        </div>
      )}

      <div className="relative">
        <button
          ref={btnRef}
          onClick={togglePanel}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
            open
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50 border-transparent hover:border-amber-100'
          }`}>
          🏆 <span className="hidden lg:inline">Rankings</span>
        </button>

        {open && (
          <div ref={panelRef}
            className="absolute top-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 w-[22rem] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">

            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-br from-amber-50 to-white">
              <p className="text-sm font-black text-slate-800 flex items-center gap-1.5">🏆 Faculty Rankings</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Ranked by total approved points</p>
            </div>

            {/* Register-number search */}
            <form onSubmit={handleRegisterLookup} className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Find by Register Number</p>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-xl px-3 py-1.5 transition-all">
                <span className="text-slate-400 text-sm flex-shrink-0">🆔</span>
                <input
                  type="text"
                  value={regQuery}
                  onChange={(e) => { setRegQuery(e.target.value); setLookupError(''); }}
                  placeholder="e.g. FAC0123"
                  className="bg-transparent text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none flex-1 min-w-0"
                />
                <button type="submit" disabled={loadingLookup || !regQuery.trim()}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 disabled:text-slate-300 transition flex-shrink-0">
                  {loadingLookup ? '…' : 'Go →'}
                </button>
              </div>
              {lookupError && <p className="text-[10px] text-red-500 font-semibold mt-1.5">{lookupError}</p>}
            </form>

            {/* Board */}
            <div className="max-h-80 overflow-y-auto">
              {loadingBoard ? (
                <div className="py-10 text-center">
                  <div className="w-6 h-6 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-semibold">Loading rankings…</p>
                </div>
              ) : boardError ? (
                <p className="px-4 py-6 text-xs text-red-500 font-semibold text-center">{boardError}</p>
              ) : board.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-400 font-medium text-center">No faculty data yet.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {board.map((row) => (
                    <button key={row.user_id}
                      onClick={() => openDashboard(row.register_no)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50/60 transition text-left group">
                      <span className="w-7 text-center text-sm font-black text-slate-400 flex-shrink-0">
                        {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                        {(row.username?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 capitalize truncate group-hover:text-amber-800 transition">{row.username}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{row.register_no} · <span className="uppercase">{row.role?.replace(/_/g, ' ')}</span></p>
                      </div>
                      <span className="text-xs font-black text-amber-700 flex-shrink-0">{row.total_points}<span className="text-[9px] font-bold text-slate-400"> pts</span></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function FacultySearch({ isPrivileged }) {
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching]   = useState(false);
  const [loadingDash, setLoadingDash] = useState(false);
  const [dashData, setDashData]     = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError]           = useState('');
  const inputRef                    = useRef(null);
  const dropdownRef                 = useRef(null);
  const debounceRef                 = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchUsers = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    setSearching(true);
    setError('');
    try {
      const res = await API.get(`/summary/faculty-summary/search/?q=${encodeURIComponent(q.trim())}`);
      setSuggestions(res.data?.results || []);
      setShowDropdown(true);
    } catch {
      setError('Search failed');
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(val), 300);
  };

  const openDashboard = async (registerNo) => {
    setShowDropdown(false);
    setLoadingDash(true);
    setError('');
    try {
      const res = await API.get(`/summary/faculty-summary/dashboard/?register_no=${registerNo}&role=all`);
      setDashData(res.data);
    } catch {
      setError('Could not load faculty dashboard.');
    } finally {
      setLoadingDash(false);
    }
  };
  
  if (!isPrivileged) return null;
  return (
    <>
      {/* Loading overlay */}
      {loadingDash && (
        <div className="fixed inset-0 z-[65] bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-700">Loading Faculty Dashboard…</p>
          </div>
        </div>
      )}

      {/* Faculty Dashboard Modal */}
      {dashData && <FacultyDashboardModal data={dashData} onClose={() => { setDashData(null); setQuery(''); }} />}

      {/* Search widget */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-white border border-slate-200 hover:border-blue-300 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-xl px-3 py-1.5 transition-all w-56">
          <span className="text-slate-400 text-sm flex-shrink-0">
            {searching ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : '🔍'}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Search faculty…"
            className="bg-transparent text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none flex-1 min-w-0"
          />
          {query && (
            <button onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); setError(''); }}
              className="text-slate-400 hover:text-slate-600 transition text-sm flex-shrink-0">✕</button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} found
              </p>
            </div>
            {error && <p className="px-4 py-3 text-xs text-red-500 font-semibold">{error}</p>}
            {suggestions.length === 0 && !error && (
              <p className="px-4 py-4 text-sm text-slate-400 font-medium text-center">No faculty found for "{query}"</p>
            )}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
              {suggestions.map(user => (
                <button key={user.user_id}
                  onClick={() => openDashboard(user.register_no)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {(user.username?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 capitalize truncate group-hover:text-blue-700 transition">{user.username}</p>
                    <p className="text-[10px] font-semibold text-slate-400">{user.register_no} · <span className="uppercase">{user.role?.replace(/_/g, ' ')}</span></p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 group-hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full transition flex-shrink-0">
                    View →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────
export default function AppShell() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await API.get('/accounts/user/details/');
        setUser(res.data);
      } catch {
        localStorage.clear();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [navigate]);

  const handleSignOut = () => { localStorage.clear(); navigate('/login'); };

  const role        = user?.role?.toLowerCase() || '';
  const isHOD       = role === 'hod';
  const isPrivileged = PRIVILEGED.includes(role);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navLink = (to, label, exact = false) => {
    const active = exact
      ? location.pathname === to || location.pathname === '/'
      : location.pathname === to;
    return (
      <Link to={to}
        className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
          active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}>
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-sm font-black tracking-tight group-hover:bg-blue-700 transition">
                FP
              </div>
              <span className="font-black text-slate-900 tracking-tight text-base hidden sm:inline">
                PerformanceHub
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              {navLink('/dashboard', 'Dashboard', true)}
              {navLink('/profile', 'My Profile')}
              {isHOD && (
                <Link to="/requests"
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-1.5 ${
                    location.pathname === '/requests'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50 border-transparent hover:border-amber-100'
                  }`}>
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Approval Inbox
                </Link>
              )}
            </nav>

            
          </div>

          {/* Center: Search (privileged only) */}
          <div className="flex-1 flex justify-center max-w-xs">
            <FacultySearch isPrivileged={isPrivileged} />
          </div>

          {/* Right: User + Sign Out */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-900 capitalize">{user?.username || 'Faculty'}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black hidden sm:flex">
              {(user?.username?.[0] || 'F').toUpperCase()}
            </div>
            <button onClick={handleSignOut}
              className="text-xs font-bold bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 px-3 py-2 rounded-xl border border-slate-200 hover:border-red-100 transition-all active:scale-[0.98]">
              Sign Out
            </button>
          </div>

        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

    </div>
  );
}