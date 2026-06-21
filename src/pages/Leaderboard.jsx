import { useEffect, useState } from 'react';
import API from '../api/axios';
import Avatar from '../components/Leaderboard/Avatar';
import FacultyDetailModal from '../components/Leaderboard/FacultyDetailModal';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Leaderboard() {
  const [board, setBoard]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [loadingDash, setLoadingDash] = useState(false);
  const [dashData, setDashData]       = useState(null);
  const [dashError, setDashError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadBoard() {
      setLoading(true);
      setError('');
      try {
        // Highest points first, dense-ranked (ties share a rank), every role included.
        const res = await API.get('/summary/faculty-summary/leaderboard/?role=all');
        if (!cancelled) setBoard(res.data?.leaderboard || []);
      } catch {
        if (!cancelled) setError('Could not load the leaderboard. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadBoard();
    return () => { cancelled = true; };
  }, []);

  const openProfile = async (registerNo) => {
    setDashError('');
    setLoadingDash(true);
    try {
      // Full module breakdown + profile photo + live rank for this one person.
      const res = await API.get(`/summary/faculty-summary/dashboard/?register_no=${registerNo}&role=all`);
      setDashData(res.data);
    } catch {
      setDashError("Could not load that faculty member's profile.");
    } finally {
      setLoadingDash(false);
    }
  };

  const topThree = board.filter(row => row.rank <= 3).slice(0, 3);
  const rest = board.filter(row => !topThree.includes(row));

  return (
    <div className="space-y-6 max-w-5xl mx-auto antialiased font-sans p-6">

      {/* Loading overlay while opening a profile */}
      {loadingDash && (
        <div className="fixed inset-0 z-[65] bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-700">Loading Faculty Profile…</p>
          </div>
        </div>
      )}

      {/* Full faculty detail modal */}
      {dashData && <FacultyDetailModal data={dashData} onClose={() => setDashData(null)} />}
      {dashError && !dashData && (
        <div className="fixed bottom-6 right-6 z-[65] bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl shadow-lg max-w-xs">
          {dashError}
          <button onClick={() => setDashError('')} className="ml-2 text-red-400 hover:text-red-600 font-black">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">🏆 Faculty Leaderboard</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Everyone ranked by total approved points, highest first. Click anyone to see their full profile and activity breakdown.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-semibold text-sm">Loading leaderboard…</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-red-500 font-semibold">
          {error}
        </div>
      ) : board.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 font-medium italic">
          No faculty data yet.
        </div>
      ) : (
        <>
          {/* ── Podium — top 3 ── */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topThree.map(row => (
                <button key={row.user_id}
                  onClick={() => openProfile(row.register_no)}
                  className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all">
                  <span className="text-4xl block mb-2">{MEDAL[row.rank]}</span>
                  <Avatar name={row.username} seed={row.register_no} photoUrl={row.profile_image_url}
                    size="w-16 h-16 mx-auto" textSize="text-lg" />
                  <p className="text-sm font-black text-slate-900 capitalize mt-2 truncate">{row.username}</p>
                  <p className="text-[11px] font-semibold text-slate-400">{row.register_no}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{row.role?.replace(/_/g, ' ')}</p>
                  <p className="text-2xl font-black text-amber-600 mt-2">{row.total_points}<span className="text-xs font-bold text-slate-400"> pts</span></p>
                </button>
              ))}
            </div>
          )}

          {/* ── Full ranked list ── */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider">All Rankings</p>
            </div>
            <div className="divide-y divide-slate-50">
              {rest.map(row => (
                <button key={row.user_id}
                  onClick={() => openProfile(row.register_no)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-blue-50/40 transition text-left group">
                  <span className="w-10 text-center text-sm font-black text-slate-400 flex-shrink-0">
                    #{row.rank}
                  </span>
                  <Avatar name={row.username} seed={row.register_no} photoUrl={row.profile_image_url}
                    size="w-9 h-9" textSize="text-xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 capitalize truncate group-hover:text-blue-700 transition">{row.username}</p>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {row.register_no} · <span className="uppercase">{row.role?.replace(/_/g, ' ')}</span> · {row.email}
                    </p>
                  </div>
                  <span className="text-sm font-black text-blue-700 flex-shrink-0">
                    {row.total_points}<span className="text-[10px] font-bold text-slate-400"> pts</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 group-hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full transition flex-shrink-0 hidden sm:inline-block">
                    View →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}