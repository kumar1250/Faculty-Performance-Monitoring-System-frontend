import { useEffect, useState, useRef } from 'react';
import API from '../api/axios';

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);   // raw API response
  const [imageFile, setImageFile] = useState(null);
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
      const res = await API.get('/accounts/profiles/me/');
      setProfile(res.data);
      setForm({
        headline: res.data.headline || '',
        bio: res.data.bio || '',
        department: res.data.department || '',
        experience_years: res.data.experience_years ?? '',
      });
    } catch (err) {
      console.error(err);
      setError('Could not load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

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
      headline: profile.headline || '',
      bio: profile.bio || '',
      department: profile.department || '',
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
      fd.append('headline', form.headline);
      fd.append('bio', form.bio);
      fd.append('department', form.department);
      fd.append('experience_years', form.experience_years || 0);
      if (imageFile) fd.append('profile_image', imageFile);

      // Let the browser set the multipart boundary itself —
      // the axios instance default Content-Type (application/json)
      // must be cleared, not overridden, for file uploads to work.
      await API.put('/accounts/profiles/update/', fd, {
        headers: { 'Content-Type': undefined },
      });

      setSuccess('Profile updated successfully.');
      setEditMode(false);
      setImageFile(null);
      setImagePreview(null);
      await loadProfile();
    }  catch (err) {
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
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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

  const user = profile.username || {}; // backend nests core User fields under "username"
  const avatarUrl = imagePreview || profile.profile_image_url;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 antialiased">

      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-xl font-black text-slate-900">My Account</h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl px-4 py-3">
          {success}
        </div>
      )}

      {/* Avatar + identity card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row gap-6 sm:items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              (user.username?.[0] || '?').toUpperCase()
            )}
          </div>
          {editMode && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Change photo
              </button>
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-slate-900 capitalize">{user.username}</p>
          <p className="text-sm font-semibold text-slate-500">{user.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full">
              {user.role?.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200 px-2 py-1 rounded-full">
              Reg No: {user.register_no}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">
              {user.points ?? 0} pts
            </span>
          </div>
        </div>
      </div>

      {/* Details card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
          Profile Details
        </h3>

        {!editMode ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Headline</p>
              <p className="text-slate-700 font-semibold">{profile.headline || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bio</p>
              <p className="text-slate-700 whitespace-pre-wrap">{profile.bio || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Department</p>
                <p className="text-slate-700 font-semibold">{profile.department || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Experience</p>
                <p className="text-slate-700 font-semibold">
                  {profile.experience_years ? `${profile.experience_years} yrs` : '—'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Headline
              </label>
              <input
                type="text"
                name="headline"
                value={form.headline}
                onChange={handleChange}
                placeholder="e.g., Assistant Professor at MVGR"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Bio
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                placeholder="A short bio about yourself..."
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="e.g., CSE"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Experience (years)
                </label>
                <input
                  type="number"
                  name="experience_years"
                  min="0"
                  value={form.experience_years}
                  onChange={handleChange}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 border border-slate-200 text-sm font-semibold text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
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