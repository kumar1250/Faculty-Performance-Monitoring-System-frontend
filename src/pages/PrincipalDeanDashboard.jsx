/**
 * PrincipalDeanDashboard.jsx  — FIXED
 *
 * ROOT CAUSE of the broken dashboard: /summary/faculty-summary/leaderboard/
 * does NOT return a `department` field on its rows (confirmed in
 * FACULTY_SUMMARY/views.py — the leaderboard rows only carry user_id,
 * register_no, username, email, role, total_points, profile_image_url).
 * The previous version of this file assumed `department` was present,
 * so every department bucket came back empty and the whole screen
 * (summary cards, distribution bars, department table, drill-down) broke.
 *
 * FIX (frontend-only, no backend changes):
 * Reuse the existing `getFacultyDirectory()` helper from
 * `utils/facultyFilters.js` (already used elsewhere in the app, e.g.
 * ApprovalRequests.jsx) which hits /accounts/user/list/ once, caches the
 * register_no -> department map in memory, and lets us enrich the
 * leaderboard rows with `department` via `attachDepartments()`.
 * Two API calls total (leaderboard + user directory), but the directory
 * call is cached app-wide so it's free on subsequent visits.
 *
 * VIEW 1 — Department Summary Table
 * VIEW 2 — Department Leaderboard (slides in per department)
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import API from '../api/axios';
import FacultyDetailModal from '../components/Leaderboard/FacultyDetailModal';
import Avatar from '../components/Leaderboard/Avatar';
import {
  DEPARTMENT_OPTIONS,
  getFacultyDirectory,
  attachDepartments,
} from '../utils/facultyFilters';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

const DEPT_GRADIENT = {
  CSE:          ['#6366f1', '#818cf8'],
  'CSE-ELITE':  ['#8b5cf6', '#a78bfa'],
  ECE:          ['#0ea5e9', '#38bdf8'],
  EEE:          ['#f59e0b', '#fbbf24'],
  MECH:         ['#10b981', '#34d399'],
  CIVIL:        ['#ef4444', '#f87171'],
};

function deptGrad(code) {
  const [a, b] = DEPT_GRADIENT[code] || ['#3b82f6', '#60a5fa'];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rerank(rows) {
  let rank = 0;
  let lastPts = null;
  return rows.map((row, idx) => {
    if (lastPts === null || row.total_points !== lastPts) {
      rank = idx + 1;
      lastPts = row.total_points;
    }
    return { ...row, rank };
  });
}

function deptLabel(code) {
  if (code === 'UNASSIGNED') return 'Unassigned';
  return DEPARTMENT_OPTIONS.find(d => d.value === code)?.label || code || 'Unknown';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner({ size = 'w-8 h-8' }) {
  return (
    <div className={`${size} border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin`} />
  );
}

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-1.5 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ─── Department Leaderboard (view 2) ─────────────────────────────────────────
function DepartmentLeaderboard({ dept, allFaculty, onBack }) {
  const [loadingDash, setLoadingDash] = useState(false);
  const [dashData, setDashData]       = useState(null);
  const [dashError, setDashError]     = useState('');

  const board = useMemo(() => {
    const members = allFaculty
      .filter(u => u.department === dept.code)
      .sort((a, b) => b.total_points - a.total_points);
    return rerank(members);
  }, [allFaculty, dept.code]);

  const topThree = board.filter(r => r.rank <= 3).slice(0, 3);
  const rest     = board.filter(r => !topThree.includes(r));

  const openProfile = useCallback(async (registerNo) => {
    setDashError('');
    setLoadingDash(true);
    try {
      const res = await API.get(
        `/summary/faculty-summary/dashboard/?register_no=${registerNo}&role=all`
      );
      setDashData(res.data);
    } catch {
      setDashError("Could not load that faculty member's profile.");
    } finally {
      setLoadingDash(false);
    }
  }, []);

  const grad = deptGrad(dept.code);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ── Back button — standalone and clearly visible above the banner ── */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-blue-700 bg-white border border-slate-200 hover:border-blue-300 rounded-xl px-4 py-2 shadow-sm hover:shadow transition-all"
      >
        ← Back to All Departments
      </button>

      {loadingDash && (
        <div className="fixed inset-0 z-[65] bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3">
            <Spinner />
            <p className="text-sm font-bold text-slate-700">Loading Faculty Profile…</p>
          </div>
        </div>
      )}

      {dashData && (
        <FacultyDetailModal data={dashData} onClose={() => setDashData(null)} />
      )}
      {dashError && !dashData && (
        <div className="fixed bottom-6 right-6 z-[65] bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl shadow-lg max-w-xs">
          {dashError}
          <button onClick={() => setDashError('')} className="ml-2 text-red-400 hover:text-red-600 font-black">✕</button>
        </div>
      )}

      {/* ── Header ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg"
        style={{ background: grad }}
      >
        <div className="absolute -top-8 -right-8 w-44 h-44 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black leading-tight">{deptLabel(dept.code)}</h2>
            <p className="text-white/70 text-sm font-semibold mt-1">
              Department Leaderboard · {board.length} faculty members
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/15 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-black">{board.length}</p>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Faculty</p>
            </div>
            <div className="bg-white/15 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-black">{dept.totalPoints}</p>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Total Pts</p>
            </div>
            <div className="bg-white/15 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-black">{dept.avgPoints}</p>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Avg Pts</p>
            </div>
          </div>
        </div>
      </div>

      {board.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium">
          No faculty data found for this department.
        </div>
      ) : (
        <>
          {/* ── Podium top-3 ── */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topThree.map(row => (
                <button
                  key={row.user_id || row.register_no}
                  onClick={() => openProfile(row.register_no)}
                  className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all group"
                >
                  <span className="text-4xl block mb-2">{MEDAL[row.rank]}</span>
                  <Avatar
                    name={row.username}
                    seed={row.register_no}
                    photoUrl={row.profile_image_url}
                    size="w-16 h-16 mx-auto"
                    textSize="text-lg"
                  />
                  <p className="text-sm font-black text-slate-900 capitalize mt-2 truncate">
                    {row.username}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">{row.register_no}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {row.role?.replace(/_/g, ' ')}
                  </p>
                  <p className="text-2xl font-black text-amber-600 mt-2">
                    {row.total_points}
                    <span className="text-xs font-bold text-slate-400"> pts</span>
                  </p>
                  <span className="mt-2 inline-block text-[10px] font-bold text-blue-600 bg-blue-50 group-hover:bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-full transition">
                    View Profile →
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ── Ranked list (rank 4+) ── */}
          {rest.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider">All Rankings</p>
              </div>
              <div className="divide-y divide-slate-50">
                {rest.map(row => (
                  <button
                    key={row.user_id || row.register_no}
                    onClick={() => openProfile(row.register_no)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-blue-50/40 transition text-left group"
                  >
                    <span className="w-10 text-center text-sm font-black text-slate-400 flex-shrink-0">
                      #{row.rank}
                    </span>
                    <Avatar
                      name={row.username}
                      seed={row.register_no}
                      photoUrl={row.profile_image_url}
                      size="w-9 h-9"
                      textSize="text-xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 capitalize truncate group-hover:text-blue-700 transition">
                        {row.username}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-400">
                        {row.register_no} · <span className="uppercase">{row.role?.replace(/_/g, ' ')}</span>
                      </p>
                    </div>
                    <span className="text-sm font-black text-blue-700 flex-shrink-0">
                      {row.total_points}
                      <span className="text-[10px] font-bold text-slate-400"> pts</span>
                    </span>
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 group-hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full transition flex-shrink-0 hidden sm:inline-block">
                      View →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Department Summary Table (view 1) ───────────────────────────────────────

function DepartmentTable({ departments, maxPoints, onViewDept }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h2 className="text-base font-black text-slate-900">🏛️ All Departments</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {departments.length} departments · Click <strong>View Department</strong> to open its leaderboard
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              {['#', 'Department', 'Faculty', 'Total Pts', 'Avg Pts / Faculty', 'Progress', 'Action'].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  style={{ textAlign: ['Faculty', 'Total Pts', 'Avg Pts / Faculty'].includes(h) ? 'center' : 'left' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {departments.map((dept, idx) => {
              const grad = deptGrad(dept.code);
              const [gradStart] = DEPT_GRADIENT[dept.code] || ['#3b82f6', '#60a5fa'];
              return (
                <tr key={dept.code} className="hover:bg-blue-50/20 transition-colors group">

                  <td className="px-4 py-4 text-xs font-bold text-slate-300">{idx + 1}</td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-black shadow-sm"
                        style={{ background: grad }}
                      >
                        {dept.code.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 whitespace-nowrap">
                          {deptLabel(dept.code)}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {dept.code}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className="text-lg font-black text-slate-800">{dept.facultyCount}</span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className="text-base font-black" style={{ color: gradStart }}>
                      {dept.totalPoints}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-bold text-slate-600">{dept.avgPoints}</span>
                  </td>

                  <td className="px-4 py-4 w-36">
                    <Bar value={dept.totalPoints} max={maxPoints} color={gradStart} />
                  </td>

                  <td className="px-4 py-4">
                    <button
                      onClick={() => onViewDept(dept)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-1.5 rounded-xl border transition-all whitespace-nowrap
                        bg-white hover:bg-blue-600 hover:text-white hover:border-blue-600 text-slate-600 border-slate-200 shadow-sm cursor-pointer"
                    >
                      🏆 View Department
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PrincipalDeanDashboard() {
  // ── State ──
  // allFaculty: leaderboard rows — each already has department + total_points
  const [allFaculty, setAllFaculty] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [activeDept, setActiveDept] = useState(null);

  // ── Fetch ──
  // Two calls: the leaderboard (points/rank) and the user directory
  // (department) — the directory is cached in memory by facultyFilters.js,
  // so this is a one-time cost across the whole app, not per-visit.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [boardRes, directory] = await Promise.all([
          API.get('/summary/faculty-summary/leaderboard/?role=all'),
          getFacultyDirectory(),
        ]);
        if (cancelled) return;

        const rawRows = boardRes.data?.leaderboard || [];
        const enriched = attachDepartments(rawRows, directory);
        const knownCodes = new Set(DEPARTMENT_OPTIONS.map(d => d.value));
        const rows = enriched.map(r => ({
          ...r,
          department: knownCodes.has(r.department) ? r.department : 'UNASSIGNED',
        }));
        setAllFaculty(rows);
      } catch {
        if (!cancelled) setError('Could not load department data. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Derive department stats directly from leaderboard rows ──
  // (rows are pre-normalized in the fetch effect: unknown/missing department
  // becomes 'UNASSIGNED', so every faculty member lands in exactly one bucket)
  const departments = useMemo(() => {
    const deptMap = {};

    allFaculty.forEach(u => {
      const code = u.department || 'UNASSIGNED';
      if (!deptMap[code]) {
        deptMap[code] = { code, facultyCount: 0, totalPoints: 0 };
      }
      deptMap[code].facultyCount += 1;
      deptMap[code].totalPoints  += u.total_points ?? 0;
    });

    return Object.values(deptMap)
      .map(d => ({
        ...d,
        avgPoints: d.facultyCount > 0 ? Math.round(d.totalPoints / d.facultyCount) : 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [allFaculty]);

  const maxDeptPoints = useMemo(
    () => Math.max(...departments.map(d => d.totalPoints), 1),
    [departments]
  );

  // ── Summary numbers ──
  const totalFaculty = allFaculty.length;
  const totalPoints  = departments.reduce((s, d) => s + d.totalPoints, 0);
  const topDept      = departments[0];

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Spinner size="w-12 h-12" />
        <p className="text-sm text-slate-500 font-medium animate-pulse">
          Loading department data…
        </p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <span className="text-5xl block mb-3">⚠️</span>
        <h3 className="font-black text-red-800 mb-1">Failed to Load</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Department leaderboard drill-down ──
  if (activeDept) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto antialiased font-sans p-4 sm:p-6">
        <DepartmentLeaderboard
          dept={activeDept}
          allFaculty={allFaculty}
          onBack={() => setActiveDept(null)}
        />
      </div>
    );
  }

  // ── Main overview ──
  return (
    <div className="space-y-6 max-w-6xl mx-auto antialiased font-sans p-4 sm:p-6 pb-12">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative">
          <p className="text-blue-300 text-sm font-bold uppercase tracking-widest mb-1">
            Principal / Dean · Institution Overview
          </p>
          <h1 className="text-3xl font-black tracking-tight">Department Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            All departments, faculty counts, and performance at a glance.
            Click any department to open its leaderboard.
          </p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '🏛️', label: 'Departments',   value: departments.length, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
          { icon: '👥', label: 'Total Faculty', value: totalFaculty,        color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
          { icon: '⭐', label: 'Total Points',  value: totalPoints,         color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
          { icon: '🏆', label: 'Top Department',value: topDept?.code || '—',color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-5 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            style={{ background: s.bg, borderColor: s.border }}
          >
            <span className="text-2xl">{s.icon}</span>
            <p className="text-3xl font-black mt-2" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: s.color, opacity: 0.7 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Points distribution bars ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 mb-4">Points Distribution by Department</h3>
        <div className="space-y-3">
          {departments.map(dept => {
            const [c] = DEPT_GRADIENT[dept.code] || ['#3b82f6'];
            return (
              <div key={dept.code} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-black flex-shrink-0"
                  style={{ background: deptGrad(dept.code) }}
                >
                  {dept.code.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      {deptLabel(dept.code)}
                    </span>
                    <span className="text-xs font-black ml-2 flex-shrink-0" style={{ color: c }}>
                      {dept.totalPoints} pts
                    </span>
                  </div>
                  <Bar value={dept.totalPoints} max={maxDeptPoints} color={c} />
                </div>
                <button
                  onClick={() => setActiveDept(dept)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex-shrink-0 hidden sm:inline"
                >
                  View →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Institution-wide top 10 leaderboard ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">🏅 Institution Leaderboard — Top 10</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Highest-performing faculty across all departments</p>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {allFaculty.slice(0, 10).map((row) => {
            const [c] = DEPT_GRADIENT[row.department] || ['#3b82f6'];
            return (
              <div
                key={row.user_id || row.register_no}
                className="flex items-center gap-4 px-5 py-3.5"
              >
                <span className="w-8 text-center text-sm font-black text-slate-300 flex-shrink-0">
                  {row.rank <= 3 ? MEDAL[row.rank] : `#${row.rank}`}
                </span>
                <Avatar
                  name={row.username}
                  seed={row.register_no}
                  photoUrl={row.profile_image_url}
                  size="w-9 h-9"
                  textSize="text-xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 capitalize truncate">{row.username}</p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {row.register_no}
                    {row.department && (
                      <span
                        className="ml-1.5 inline-block text-[9px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: `${c}18`, color: c, border: `1px solid ${c}40` }}
                      >
                        {row.department}
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-sm font-black text-blue-700 flex-shrink-0">
                  {row.total_points}
                  <span className="text-[10px] font-bold text-slate-400"> pts</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Department table ── */}
      <DepartmentTable
        departments={departments}
        maxPoints={maxDeptPoints}
        onViewDept={setActiveDept}
      />

      <p className="text-center text-xs text-slate-400 font-medium">
        Faculty Performance Monitoring System ·{' '}
        {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
}