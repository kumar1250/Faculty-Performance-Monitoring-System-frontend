import { useEffect, useState, useRef } from 'react';
import API from '../api/axios';
import { DEPARTMENT_OPTIONS } from '../utils/facultyFilters';

export default function Account() {
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [editMode, setEditMode]     = useState(false);
  const fileInputRef                = useRef(null);

  const [profile, setProfile]       = useState(null);   // /accounts/profiles/me/
  const [userDetails, setUserDetails] = useState(null); // /accounts/user/details/
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    headline: '',
    bio: '',
    department: '',
    experience_years: '',
  });

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch both in parallel — profiles/me/ has optional extra fields;
      // user/details/ has authoritative identity fields (role, register_no, email, dept, points).
      const [profileRes, detailRes] = await Promise.all([
        API.get('/accounts/profiles/me/'),
        API.get('/accounts/user/details/'),
      ]);
      setProfile(profileRes.data);
      setUserDetails(detailRes.data);
      setForm({
        headline:         profileRes.data.headline || '',
        bio:              profileRes.data.bio || '',
        department:       profileRes.data.department || '',
        experience_years: profileRes.data.experience_years ?? '',
      });
    } catch (err) {
      console.error(err);
      setError('Could not load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCancel = () => {
    setEditMode(false);
    setImageFile(null);
    setImagePreview(null);
    setForm({
      headline:         profile.headline || '',
      bio:              profile.bio || '',
      department:       profile.department || '',
      experience_years: profile.experience_years ?? '',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      fd.append('headline',         form.headline);
      fd.append('bio',              form.bio);
      fd.append('department',       form.department);
      fd.append('experience_years', form.experience_years || 0);
      if (imageFile) fd.append('profile_image', imageFile);

      await API.put('/accounts/profiles/update/', fd, {
        headers: { 'Content-Type': undefined },
      });

      setSuccess('Profile updated successfully.');
      setEditMode(false);
      setImageFile(null);
      setImagePreview(null);
      await loadProfile();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to save changes. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-red-600 font-semibold">{error || 'Profile unavailable.'}</p>
      </div>
    );
  }

  // userDetails is the authoritative source for identity fields.
  // profile.username still has them as a fallback (older API shape).
  const ud         = userDetails || profile.username || {};
  const avatarUrl  = imagePreview || profile.profile_image_url;
  const deptLabel  = DEPARTMENT_OPTIONS.find(d => d.value === ud.department)?.label || ud.department || '—';
  const initial    = (ud.username?.[0] || '?').toUpperCase();

  // Stat tiles shown in the identity card
  const statTiles = [
    { label: 'Total Points',  value: ud.points  ?? 0,  color: 'amber',   icon: '⭐' },
    { label: 'Role',          value: (ud.role?.replace(/_/g, ' ') || '—').toUpperCase(), color: 'blue', icon: '🏷️' },
    { label: 'Register No',   value: ud.register_no || '—', color: 'slate',  icon: '🆔' },
    { label: 'Department',    value: deptLabel,           color: 'indigo',  icon: '🏛️' },
    { label: 'Email',         value: ud.email    || '—',  color: 'slate',   icon: '✉️' },
  ];

  const colorMap = {
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  label: 'text-amber-500'  },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   label: 'text-blue-400'   },
    slate:  { bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-700',  label: 'text-slate-400'  },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', label: 'text-indigo-400' },
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 antialiased">

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">My Account</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">View and manage your profile information</p>
          </div>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Alerts ────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl px-4 py-3">
          ✅ {success}
        </div>
      )}

      {/* ── Identity Hero ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 -left-8 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row gap-5 sm:items-center">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur border-2 border-white/25 flex items-center justify-center text-white text-2xl font-black overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                : initial}
            </div>
            {editMode && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-bold text-blue-200 hover:text-white hover:underline transition">
                  Change photo
                </button>
              </>
            )}
          </div>

          {/* Name + headline */}
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-black capitalize leading-tight">{ud.username || '—'}</p>
            {profile.headline
              ? <p className="text-blue-200 text-sm font-semibold mt-1">{profile.headline}</p>
              : <p className="text-blue-300/60 text-sm italic mt-1">No headline set</p>}
            <p className="text-blue-200/80 text-xs mt-2">{ud.email || '—'}</p>
          </div>
        </div>

        {/* Stat tiles row */}
        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Register No',  value: ud.register_no || '—',  icon: '🆔' },
            { label: 'Role',         value: (ud.role?.replace(/_/g, ' ') || '—').toUpperCase(), icon: '🏷️' },
            { label: 'Total Points', value: `${ud.points ?? 0} pts`, icon: '⭐' },
            { label: 'Department',   value: deptLabel,                icon: '🏛️' },
            { label: 'Experience',   value: profile.experience_years ? `${profile.experience_years} yrs` : '—', icon: '📅' },
          ].map(t => (
            <div key={t.label} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-2.5">
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-0.5">{t.icon} {t.label}</p>
              <p className="text-sm font-black text-white truncate">{t.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Profile Details Card ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Profile Details</h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Additional profile information visible on your portfolio</p>
        </div>

        {!editMode ? (
          <div className="p-6 space-y-5 text-sm">

            {/* Headline */}
            <div className="flex gap-3">
              <span className="text-base mt-0.5 flex-shrink-0">📌</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Headline</p>
                <p className="text-slate-700 font-semibold">{profile.headline || <span className="text-slate-300 italic">Not set</span>}</p>
              </div>
            </div>

            {/* Bio */}
            <div className="flex gap-3">
              <span className="text-base mt-0.5 flex-shrink-0">📝</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Bio</p>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {profile.bio || <span className="text-slate-300 italic">Not set</span>}
                </p>
              </div>
            </div>

            {/* Grid: Department + Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1">🏛️ Department</p>
                <p className="text-indigo-800 font-bold text-sm">{deptLabel}</p>
                {ud.department && deptLabel !== ud.department && (
                  <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">Code: {ud.department}</p>
                )}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">📅 Experience</p>
                <p className="text-slate-700 font-bold text-sm">
                  {profile.experience_years ? `${profile.experience_years} year${profile.experience_years === 1 ? '' : 's'}` : '—'}
                </p>
              </div>
            </div>

            {/* Read-only identity fields */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Account Information (Read-only)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Full Name',      value: ud.username,                                  icon: '👤' },
                  { label: 'Email',          value: ud.email,                                     icon: '✉️' },
                  { label: 'Register No',    value: ud.register_no,                               icon: '🆔' },
                  { label: 'Role',           value: ud.role?.replace(/_/g, ' ')?.toUpperCase(),   icon: '🏷️' },
                  { label: 'Total Points',   value: ud.points != null ? `${ud.points} pts` : '—', icon: '⭐' },
                ].map(f => (
                  <div key={f.label} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{f.icon} {f.label}</p>
                    <p className="text-sm font-bold text-slate-700 capitalize">{f.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-5">

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Headline</label>
              <input type="text" name="headline" value={form.headline} onChange={handleChange}
                placeholder="e.g., Assistant Professor at MVGR"
                className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Bio</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={4}
                placeholder="A short bio about yourself..."
                className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Department</label>
                <select name="department" value={form.department} onChange={handleChange}
                  className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition font-medium text-slate-700">
                  <option value="">— Select department —</option>
                  {DEPARTMENT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Experience (years)</label>
                <input type="number" name="experience_years" min="0" value={form.experience_years} onChange={handleChange}
                  className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition" />
              </div>
            </div>

            {/* Read-only account info reminder */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Account Info (Not Editable Here)</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                <span>👤 {ud.username || '—'}</span>
                <span>✉️ {ud.email || '—'}</span>
                <span>🆔 {ud.register_no || '—'}</span>
                <span>🏷️ {ud.role?.replace(/_/g, ' ')?.toUpperCase() || '—'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={handleCancel} disabled={saving}
                className="px-4 py-2 border border-slate-200 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2 transition">
                {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}