import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { fetchModuleRecords, fetchPresignedFileUrl } from '../api/moduleEndpoints';
import { enrichAndFilterFaculty, DEPARTMENT_OPTIONS } from '../utils/facultyFilters';

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
function AnimatedCount({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = Number(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    let cur = 0;
    const step = Math.ceil(end / 55);
    const t = setInterval(() => {
      cur = Math.min(cur + step, end);
      setDisplay(cur);
      if (cur >= end) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <>{display}</>;
}

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

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function DonutChart({ approved = 0, pending = 0, rejected = 0 }) {
  const total = approved + pending + rejected || 1;
  const r = 38; const cx = 46; const cy = 46; const C = 2 * Math.PI * r;
  const segs = [{ v: approved, c: '#22c55e' }, { v: pending, c: '#f59e0b' }, { v: rejected, c: '#ef4444' }];
  let off = 0;
  return (
    <svg width="92" height="92" viewBox="0 0 92 92">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="11" />
      {segs.map((s, i) => {
        const dash = (s.v / total) * C;
        const el = s.v > 0 ? (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.c}
            strokeWidth="11" strokeDasharray={`${dash} ${C - dash}`}
            strokeDashoffset={-off + C * 0.25} strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        ) : null;
        if (s.v > 0) off += dash;
        return el;
      })}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#1e293b">{approved}</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="7.5" fill="#94a3b8" fontWeight="700">APPROVED</text>
    </svg>
  );
}

function humanize(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatFieldValue(val, key, ctx) {
  if (val === null || val === undefined || val === '') return <span className="text-slate-300 italic text-xs">—</span>;
  if (key === 'approval_status') return <Pill count={val} type={val} />;
  if (typeof val === 'object' && val !== null && val.username)
    return <span className="text-slate-700">{val.username} <span className="text-slate-400 text-xs">({val.register_no})</span></span>;
  if (typeof val === 'object') return <span className="text-slate-500 text-xs">{JSON.stringify(val)}</span>;
  if (typeof val === 'boolean') return val ? '✅ Yes' : '❌ No';
  if (typeof val === 'string' && val.startsWith('http'))
    return <SecureFilePreview moduleLabel={ctx?.moduleLabel} recordId={ctx?.recordId} rawUrl={val} />;
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
    if (resolvedUrl) return;
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

// ─── Module Detail Modal ──────────────────────────────────────────────────────
function ModuleDetailModal({ module, registerNo, onClose }) {
  const [recordState, setRecordState] = useState({ key: null, records: [] });

  useEffect(() => {
    if (!module) return;
    let cancelled = false;
    const key = `${module.module}::${registerNo}`;
    fetchModuleRecords(API, module.module, registerNo).then(data => {
      if (!cancelled) {
        setRecordState({ key, records: data });
      }
    });
    return () => { cancelled = true; };
  }, [module, registerNo]);

  if (!module) return null;
  const currentKey = `${module.module}::${registerNo}`;
  const loadingRecords = recordState.key !== currentKey;
  const records = loadingRecords ? [] : recordState.records;
  const meta = getMeta(module.module);
  const skipFields = new Set(['user', 'faculty', 'password']);
  const fieldKeys = records.length > 0
    ? Object.keys(records[0]).filter(k => !skipFields.has(k))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
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
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {module.total} submitted ·
                <span className="text-emerald-600"> {module.approved} approved</span> ·
                <span className="text-amber-600"> {module.pending} pending</span> ·
                <span className="text-red-600"> {module.rejected} rejected</span> ·
                <span className="font-black ml-1" style={{ color: meta.color }}>{module.points} pts</span>
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-red-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition font-bold text-lg">
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
          {[
            { l: 'Submitted', v: module.total,    c: '#3b82f6' },
            { l: 'Approved',  v: module.approved, c: '#10b981' },
            { l: 'Pending',   v: module.pending,  c: '#f59e0b' },
            { l: 'Rejected',  v: module.rejected, c: '#ef4444' },
          ].map(s => (
            <div key={s.l} className="py-4 text-center">
              <p className="text-2xl font-black" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Records */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {loadingRecords ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 font-semibold text-sm">Loading records…</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl block mb-2">📭</span>
              <p className="text-slate-500 font-semibold text-sm">
                No records in this module yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((rec, idx) => (
                <div key={rec.id || idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Record #{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      {rec.points !== undefined && rec.points !== null && (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full border"
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
                            <div className="text-sm font-semibold">
                              {formatFieldValue(rec[key], key, { moduleLabel: module.module, recordId: rec.id })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          <p className="text-xs text-slate-400 font-medium">{records.length} record{records.length !== 1 ? 's' : ''} shown</p>
          <button onClick={onClose}
            className="px-5 py-2 text-sm font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard Panel ────────────────────────────────────────────────────────
function rerank(rows) {
  let rank = 0;
  let lastPoints = null;
  return rows.map((row, idx) => {
    if (lastPoints === null || row.total_points !== lastPoints) {
      rank = idx + 1;
      lastPoints = row.total_points;
    }
    return { ...row, rank };
  });
}

function LeaderboardPanel({ myId, isPrivileged, currentUser }) {
  const [board, setBoard]   = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await API.get('/summary/faculty-summary/all-faculty/?role=all');
      const rows = res.data?.leaderboard || [];
      // HOD -> only their department; dean/principal/others -> unchanged.
      const scoped = await enrichAndFilterFaculty(rows, currentUser);
      setBoard(rerank(scoped));
      setLoaded(true);
    } catch {}
    finally { setLoading(false); }
  };

  if (!isPrivileged) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900">🏆 Leaderboard</h3>
          <p className="text-xs text-slate-400 font-medium">
            {currentUser?.role?.toLowerCase() === 'hod'
              ? 'Faculty in your department ranked by total approved points'
              : 'Faculty ranked by total approved points'}
          </p>
        </div>
        {!loaded && (
          <button onClick={load}
            className="text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-1.5 rounded-xl border border-blue-200 transition">
            {loading ? 'Loading…' : 'Load Rankings'}
          </button>
        )}
      </div>
      {loaded && (
        <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
          {board.slice(0, 20).map(row => {
            const isMe = row.user_id === myId;
            const medal = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : null;
            return (
              <div key={row.user_id}
                className={`flex items-center gap-3 px-5 py-3 transition-colors ${isMe ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-slate-50'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
                  ${row.rank === 1 ? 'bg-yellow-100 text-yellow-700' : row.rank === 2 ? 'bg-slate-200 text-slate-600' : row.rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                  {medal || `#${row.rank}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate capitalize ${isMe ? 'text-blue-800' : 'text-slate-800'}`}>
                    {row.username}
                    {isMe && <span className="text-[10px] font-black text-blue-500 ml-1.5">(You)</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">{row.register_no} · <span className="uppercase">{row.role?.replace(/_/g, ' ')}</span></p>
                </div>
                <span className={`text-sm font-black flex-shrink-0 ${isMe ? 'text-blue-700' : 'text-slate-600'}`}>
                  {row.total_points} <span className="text-[10px] font-semibold text-slate-400">pts</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Faculty Directory Panel (Dean / Principal only) ──────────────────────────
// Shows every faculty member across every department with their role,
// department, email and total points — searchable by name/register no/email,
// and filterable down to a single department.
function FacultyDirectoryPanel({ isVisible }) {
  const [users, setUsers]     = useState([]);
  const [pointsMap, setPointsMap] = useState({});
  const [loaded, setLoaded]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    if (!isVisible || loaded || loading) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [usersRes, boardRes] = await Promise.all([
          API.get('/accounts/user/list/'),
          API.get('/summary/faculty-summary/all-faculty/?role=all').catch(() => ({ data: { leaderboard: [] } })),
        ]);
        if (cancelled) return;
        const pMap = {};
        (boardRes.data?.leaderboard || []).forEach(row => { pMap[row.register_no] = row.total_points; });
        setUsers(usersRes.data || []);
        setPointsMap(pMap);
        setLoaded(true);
      } catch {
        if (!cancelled) setError('Could not load the faculty directory.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isVisible, loaded, loading]);

  if (!isVisible) return null;

  const q = search.trim().toLowerCase();
  const filtered = users
    .filter(u => {
      const matchesSearch = !q
        || u.username?.toLowerCase().includes(q)
        || u.register_no?.toLowerCase().includes(q)
        || u.email?.toLowerCase().includes(q);
      const matchesDept = !deptFilter || u.department === deptFilter;
      return matchesSearch && matchesDept;
    })
    .sort((a, b) => (a.username || '').localeCompare(b.username || ''));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">🏛️ Faculty Directory — All Departments</h3>
          <p className="text-xs text-slate-400 font-medium">Every faculty member across every department, with role, department and points.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-xl px-3 py-2 transition-all flex-1">
            <span className="text-slate-400 text-sm flex-shrink-0">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, register no, or email…"
              className="bg-transparent text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none flex-1 min-w-0"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 transition text-sm flex-shrink-0">✕</button>
            )}
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all sm:w-64"
          >
            <option value="">All Departments</option>
            {DEPARTMENT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <div className="w-6 h-6 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-semibold">Loading faculty directory…</p>
        </div>
      ) : error ? (
        <p className="px-5 py-6 text-sm text-red-500 font-semibold text-center">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-400 font-medium text-center">
          No faculty match {search ? `"${search}"` : 'this filter'}{deptFilter ? ' in this department' : ''}.
        </p>
      ) : (
        <>
          <div className="px-5 py-2 border-b border-slate-100 bg-slate-50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {filtered.length} faculty member{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="divide-y divide-slate-50 max-h-[28rem] overflow-y-auto">
            {filtered.map(u => {
              const deptLabel = DEPARTMENT_OPTIONS.find(d => d.value === u.department)?.label || u.department || '—';
              const points = pointsMap[u.register_no];
              return (
                <div key={u.id || u.register_no} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {(u.username?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 capitalize truncate">{u.username}</p>
                    <p className="text-[11px] text-slate-400 font-semibold truncate">
                      {u.register_no} · {u.email}
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {u.role?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">{deptLabel}</span>
                  </div>
                  {points !== undefined && (
                    <span className="text-sm font-black text-slate-600 flex-shrink-0">
                      {points}<span className="text-[10px] font-bold text-slate-400"> pts</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]           = useState(null);   // full dashboard response
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);   // /accounts/profiles/me/ response
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [detailModule, setDetail] = useState(null);
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState('points');

  useEffect(() => {
    async function load() {
      try {
        const userRes = await API.get('/accounts/user/details/');
        setUser(userRes.data);
        const registerNo = userRes.data?.register_no;

        // Profile (avatar, headline, bio, department, experience) is fetched
        // separately and is allowed to fail silently — the dashboard's core
        // stats shouldn't be blocked by a missing/incomplete profile.
        API.get('/accounts/profiles/me/')
          .then(res => setProfile(res.data))
          .catch(() => setProfile(null));

        // /dashboard/ now returns module breakdown + rank for any authenticated
        // user requesting their own register_no (privileged roles can also pass
        // someone else's register_no, but here we always ask for our own).
        const dashRes = await API.get(`/summary/faculty-summary/dashboard/?register_no=${registerNo}&role=all`);
        setData(dashRes.data);
      } catch {
        setError('Could not retrieve your performance data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-slate-500 font-medium animate-pulse">Loading your performance data…</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <span className="text-5xl block mb-3">⚠️</span>
        <h3 className="font-black text-red-800 mb-1">Failed to Load Dashboard</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button onClick={() => window.location.reload()}
          className="mt-5 px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition">
          Retry
        </button>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────────
  const modules     = data?.modules || [];
  const totalPoints = data?.total_points ?? 0;
  const rank        = data?.rank;
  const peerSize    = data?.peer_group_size;
  const behind      = data?.points_behind_first ?? 0;
  const isPriv      = PRIVILEGED.includes(user?.role?.toLowerCase() || '');
  const isDeanOrPrincipal = ['dean', 'principal'].includes(user?.role?.toLowerCase() || '');

  const totalSubmitted = modules.reduce((s, m) => s + (m.total ?? 0), 0);
  const totalApproved  = modules.reduce((s, m) => s + (m.approved ?? 0), 0);
  const totalPending   = modules.reduce((s, m) => s + (m.pending ?? 0), 0);
  const totalRejected  = modules.reduce((s, m) => s + (m.rejected ?? 0), 0);
  const approvalRate   = totalSubmitted > 0 ? Math.round((totalApproved / totalSubmitted) * 100) : 0;
  const maxPoints      = Math.max(...modules.map(m => m.points ?? 0), 1);
  const topModule      = [...modules].sort((a, b) => (b.points ?? 0) - (a.points ?? 0))[0];
  const activeCount    = modules.filter(m => (m.total ?? 0) > 0).length;

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.username?.split(' ')[0] || 'Faculty';

  const filtered = modules
    .filter(m => m.module.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'points')   return (b.points ?? 0) - (a.points ?? 0);
      if (sortBy === 'total')    return (b.total ?? 0) - (a.total ?? 0);
      if (sortBy === 'approved') return (b.approved ?? 0) - (a.approved ?? 0);
      if (sortBy === 'pending')  return (b.pending ?? 0) - (a.pending ?? 0);
      return 0;
    });

  const rankDisplay = rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : rank ? `#${rank}` : null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {detailModule && <ModuleDetailModal module={detailModule} registerNo={data?.register_no} onClose={() => setDetail(null)} />}

      <div className="space-y-6 pb-12">

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-14 -left-8 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center text-white text-2xl font-black overflow-hidden flex-shrink-0">
                {profile?.profile_image_url ? (
                  <img src={profile.profile_image_url} alt={user?.username || 'Profile'}
                    className="w-full h-full object-cover" />
                ) : (
                  (firstName?.[0] || '?').toUpperCase()
                )}
              </div>

              <div>
                <p className="text-blue-200 text-sm font-medium">{greeting},</p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight capitalize mt-0.5">{firstName} 👋</h1>
                <p className="text-blue-200 text-sm mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                  {user?.role && <span>🏷️ {user.role.replace(/_/g, ' ').toUpperCase()}</span>}
                  {user?.register_no && <span>🆔 {user.register_no}</span>}
                  {user?.email && <span>✉️ {user.email}</span>}
                </p>

                {/* Profile details: headline, department, experience, bio */}
                {profile?.headline && (
                  <p className="text-white text-sm font-bold mt-2">{profile.headline}</p>
                )}
                {(profile?.department || profile?.experience_years) && (
                  <p className="text-blue-200 text-xs font-semibold mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {profile?.department && <span>🏛️ {profile.department}</span>}
                    {profile?.experience_years ? (
                      <span>📅 {profile.experience_years} {profile.experience_years === 1 ? 'year' : 'years'} experience</span>
                    ) : null}
                  </p>
                )}
                {profile?.bio && (
                  <p className="text-blue-100/80 text-xs mt-2 max-w-md leading-relaxed">{profile.bio}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-3">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3 text-center min-w-[100px]">
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-0.5">Total Points</p>
                <p className="text-4xl font-black leading-none"><AnimatedCount value={totalPoints} /></p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3 text-center min-w-[100px]">
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-0.5">Approval Rate</p>
                <p className="text-4xl font-black leading-none"><AnimatedCount value={approvalRate} />%</p>
              </div>
              {rankDisplay && (
                <div className="bg-yellow-400/20 backdrop-blur border border-yellow-300/30 rounded-2xl px-5 py-3 text-center min-w-[100px]">
                  <p className="text-[10px] font-bold text-yellow-200 uppercase tracking-widest mb-0.5">My Rank</p>
                  <p className="text-3xl font-black leading-none">{rankDisplay}</p>
                  {peerSize && <p className="text-[10px] text-yellow-200 font-semibold mt-0.5">of {peerSize}</p>}
                </div>
              )}
              {behind > 0 && (
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3 text-center min-w-[100px]">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-0.5">Behind #1</p>
                  <p className="text-3xl font-black leading-none text-orange-300">{behind}</p>
                  <p className="text-[10px] text-blue-200 font-semibold mt-0.5">pts to go</p>
                </div>
              )}
              {rank === 1 && behind === 0 && (
                <div className="bg-yellow-400/20 border border-yellow-300/30 rounded-2xl px-5 py-3 flex items-center gap-2">
                  <span className="text-3xl">👑</span>
                  <div>
                    <p className="text-yellow-100 text-sm font-black">Top of</p>
                    <p className="text-yellow-100 text-sm font-black">Leaderboard!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap gap-2">
            <Link to="/profile"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition">
              👤 My Profile
            </Link>
            <a href="#module-table"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition">
              📊 Module Table
            </a>
            {isPriv && (
              <Link to="/requests"
                className="flex items-center gap-1.5 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-100 text-xs font-bold px-3 py-1.5 rounded-xl transition">
                📥 Approval Inbox
              </Link>
            )}
          </div>
        </div>

        {/* ══ STAT CARDS ══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Submitted', value: totalSubmitted, icon: '📤', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Approved',        value: totalApproved,  icon: '✅', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
            { label: 'Pending Review',  value: totalPending,   icon: '⏳', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Rejected',        value: totalRejected,  icon: '❌', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
          ].map(s => (
            <div key={s.label}
              className="rounded-2xl p-5 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              style={{ background: s.bg, borderColor: s.border }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{s.icon}</span>
                {s.label === 'Approved' && totalSubmitted > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: s.color }}>
                    {Math.round((s.value / totalSubmitted) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-3xl font-black" style={{ color: s.color }}><AnimatedCount value={s.value} /></p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: s.color, opacity: 0.7 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ══ VISUAL ROW ══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Donut */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-sm font-black text-slate-700 mb-4 self-start">Submission Breakdown</h3>
            <DonutChart approved={totalApproved} pending={totalPending} rejected={totalRejected} />
            <div className="flex gap-4 mt-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Approved</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Pending</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Rejected</span>
            </div>
          </div>

          {/* Points bars */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-black text-slate-700 mb-4">Points by Module (Top 7)</h3>
            <div className="space-y-3">
              {[...modules]
                .filter(m => (m.points ?? 0) > 0)
                .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
                .slice(0, 7)
                .map(m => {
                  const meta = getMeta(m.module);
                  return (
                    <div key={m.module} className="flex items-center gap-3">
                      <span className="text-base w-6 text-center flex-shrink-0">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-slate-700 truncate">{m.module}</span>
                          <span className="text-xs font-black ml-2 flex-shrink-0" style={{ color: meta.color }}>{m.points} pts</span>
                        </div>
                        <ProgressBar value={m.points ?? 0} max={maxPoints} color={meta.color} />
                      </div>
                    </div>
                  );
                })}
              {modules.filter(m => (m.points ?? 0) > 0).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No points recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* ══ HIGHLIGHT TILES ═════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-3xl">{topModule ? getMeta(topModule.module).icon : '📌'}</span>
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Top Category</p>
              <p className="font-black text-indigo-800 text-sm">{topModule?.module || '—'}</p>
              <p className="text-indigo-600 text-xs font-semibold">{topModule?.points ?? 0} points earned</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-3xl">📂</span>
            <div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active Modules</p>
              <p className="font-black text-emerald-800 text-3xl leading-none"><AnimatedCount value={activeCount} /></p>
              <p className="text-emerald-600 text-xs font-semibold">of {modules.length} total</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-3xl">⏳</span>
            <div>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Needs Attention</p>
              <p className="font-black text-amber-800 text-3xl leading-none"><AnimatedCount value={totalPending} /></p>
              <p className="text-amber-600 text-xs font-semibold">entries pending review</p>
            </div>
          </div>
        </div>

        {/* ══ MODULE TABLE ════════════════════════════════════════════════════ */}
        <div id="module-table" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">All Activity Modules</h2>
              <p className="text-xs text-slate-400 font-medium">
                {modules.length} modules · Click <strong>View Details</strong> to inspect individual records
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input type="text" placeholder="Search modules…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-slate-50 w-44" />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-semibold text-slate-600">
                <option value="points">Sort: Points</option>
                <option value="total">Sort: Submitted</option>
                <option value="approved">Sort: Approved</option>
                <option value="pending">Sort: Pending</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">#</th>
                  <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Module Name</th>
                  <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Submitted</th>
                  <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Approved</th>
                  <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Pending</th>
                  <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Rejected</th>
                  <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Points</th>
                  <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-28">Progress</th>
                  <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-14 text-center">
                      <span className="text-4xl block mb-2">🔍</span>
                      <p className="text-sm font-semibold text-slate-500">
                        {search ? `No modules matching "${search}"` : 'No activity entries yet.'}
                      </p>
                      {search && <button onClick={() => setSearch('')}
                        className="text-xs text-blue-600 font-bold hover:underline mt-1">Clear search</button>}
                    </td>
                  </tr>
                ) : filtered.map((m, idx) => {
                  const meta = getMeta(m.module);
                  const hasData = (m.total ?? 0) > 0;
                  const hasRecords = (m.records?.length ?? 0) > 0;
                  const approvedPct = m.total > 0 ? Math.round((m.approved / m.total) * 100) : 0;
                  return (
                    <tr key={m.module}
                      className={`hover:bg-blue-50/30 transition-colors ${!hasData ? 'opacity-40' : ''}`}>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-300">{idx + 1}</td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                            style={{ background: meta.bg }}>{meta.icon}</div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 whitespace-nowrap">{m.module}</p>
                            {hasData && (
                              <p className="text-[10px] font-semibold" style={{ color: meta.color }}>
                                {approvedPct}% approval rate
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="text-sm font-black text-slate-700">{m.total ?? 0}</span>
                      </td>
                      <td className="px-3 py-3.5 text-center"><Pill count={m.approved ?? 0} type="approved" /></td>
                      <td className="px-3 py-3.5 text-center"><Pill count={m.pending ?? 0} type="pending" /></td>
                      <td className="px-3 py-3.5 text-center"><Pill count={m.rejected ?? 0} type="rejected" /></td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="text-sm font-black" style={{ color: (m.points ?? 0) > 0 ? meta.color : '#cbd5e1' }}>
                          {m.points ?? 0}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 w-28">
                        <ProgressBar value={m.points ?? 0} max={maxPoints} color={meta.color} />
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <button
                          onClick={() => hasData && setDetail(m)}
                          disabled={!hasData}
                          title={hasData ? `View ${m.total} records for ${m.module}` : 'No records'}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap
                            ${hasData
                              ? 'bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 text-slate-600 border-slate-200 shadow-sm cursor-pointer'
                              : 'text-slate-200 border-slate-100 cursor-default'}`}>
                          🔍 View Details
                          {hasRecords && (
                            <span className="ml-0.5 bg-blue-100 text-blue-700 text-[9px] font-black px-1 rounded-full">
                              {m.records.length}
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan="2" className="px-5 py-3">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-wider">TOTAL — {filtered.length} modules</span>
                    </td>
                    <td className="px-3 py-3 text-center font-black text-sm text-slate-800">{totalSubmitted}</td>
                    <td className="px-3 py-3 text-center font-black text-sm text-emerald-700">{totalApproved}</td>
                    <td className="px-3 py-3 text-center font-black text-sm text-amber-700">{totalPending}</td>
                    <td className="px-3 py-3 text-center font-black text-sm text-red-700">{totalRejected}</td>
                    <td className="px-3 py-3 text-right font-black text-sm text-blue-700">{totalPoints}</td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-bold text-slate-500">{approvalRate}% overall</span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ══ LEADERBOARD ═════════════════════════════════════════════════════ */}
        <LeaderboardPanel myId={data?.user_id || user?.id} isPrivileged={isPriv} currentUser={user} />

        {/* ══ FACULTY DIRECTORY (Dean / Principal only) ═══════════════════════ */}
        <FacultyDirectoryPanel isVisible={isDeanOrPrincipal} />

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <p className="text-center text-xs text-slate-400 font-medium">
          Faculty Performance Monitoring System ·
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

      </div>
    </>
  );
}