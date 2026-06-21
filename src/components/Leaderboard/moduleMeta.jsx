import Pill from './Pill';
import SecureFilePreview from './SecureFilePreview';

export const MODULE_META = {
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

export function getMeta(label) {
  return MODULE_META[label] || { icon: '📌', color: '#3b82f6', bg: '#eff6ff' };
}

export function humanize(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ctx: { moduleLabel, recordId } — required for file fields so
// SecureFilePreview knows which module's /file/ endpoint to call
export function formatFieldValue(val, key, ctx) {
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