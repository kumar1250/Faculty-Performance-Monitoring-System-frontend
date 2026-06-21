import { useState } from 'react';
import Avatar from './Avatar';
import Pill from './Pill';
import ModuleDrawer from './ModuleDrawer';
import { getMeta } from './moduleMeta';

export default function FacultyDetailModal({ data, onClose }) {
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
        <ModuleDrawer module={activeModule} onClose={() => setActiveModule(null)} />
      )}

      <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 overflow-y-auto"
        onClick={onClose}>
        <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl my-4 overflow-hidden"
          onClick={e => e.stopPropagation()}>

          {/* ── Modal Header — profile photo + identity ── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-5 text-white">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Avatar name={data.username} seed={data.register_no} photoUrl={data.profile_image_url}
                  size="w-14 h-14 mt-0.5" textSize="text-lg" />
                <div>
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-0.5">Faculty Performance Dashboard</p>
                  <h2 className="text-2xl font-black capitalize">{data.username}</h2>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-blue-100">
                    <span>🆔 {data.register_no}</span>
                    <span>✉️ {data.email}</span>
                    <span>🏷️ {data.role?.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
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