import { getMeta, humanize, formatFieldValue } from './moduleMeta';
import Pill from './Pill';
import { DEPARTMENT_OPTIONS } from '../../utils/facultyFilters';

export default function ModuleDrawer({ module, department, onClose }) {
  const deptLabel = department
    ? (DEPARTMENT_OPTIONS.find(d => d.value === department)?.label || department)
    : null;
  const meta = getMeta(module.module);
  const records = module.records || [];
  const skipFields = new Set(['user', 'faculty', 'password']);
  const fieldKeys = records.length > 0
    ? Object.keys(records[0]).filter(k => !skipFields.has(k))
    : [];

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6 overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
          style={{ background: meta.bg }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.icon}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900">{module.module}</h2>
                {deptLabel && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/70 border border-slate-300 text-slate-600 uppercase tracking-wider">
                    {deptLabel}
                  </span>
                )}
              </div>
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
          {records.length === 0 ? (
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
            ← Back to Faculty Details
          </button>
        </div>
      </div>
    </div>
  );
}