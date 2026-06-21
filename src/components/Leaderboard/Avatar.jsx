import { useState, useEffect } from 'react';

// Stable, per-person colored avatar derived from their name/register_no, so
// the same person looks the same everywhere. Falls back to colored initials
// if there's no profile photo yet, or if the photo URL fails to load
// (presigned S3 URLs expire after an hour and can go stale mid-session).
const AVATAR_PALETTE = [
  ['#6366f1', '#4f46e5'], // indigo
  ['#10b981', '#059669'], // emerald
  ['#f59e0b', '#d97706'], // amber
  ['#ef4444', '#dc2626'], // red
  ['#0ea5e9', '#0284c7'], // sky
  ['#8b5cf6', '#7c3aed'], // violet
  ['#ec4899', '#db2777'], // pink
  ['#14b8a6', '#0d9488'], // teal
  ['#f97316', '#ea580c'], // orange
  ['#84cc16', '#65a30d'], // lime
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // 32-bit int
  }
  return Math.abs(hash);
}

function getAvatarColors(seed) {
  const idx = hashString(seed || '?') % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// seed: stable & unique per person (register_no is ideal, falls back to name)
// photoUrl: presigned S3 url from the backend's profile_image_url field
export default function Avatar({ name, seed, photoUrl, size = 'w-10 h-10', textSize = 'text-sm' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [from, to] = getAvatarColors(seed || name || '?');

  // Reset imgFailed if the photoUrl changes
  useEffect(() => {
      setImgFailed(false);
    }, [photoUrl]);

    if (photoUrl && !imgFailed) {
      return (
        <img
          src={photoUrl}
          alt={name || 'Profile'}
          // If it fails, mark as failed
          onError={() => setImgFailed(true)}
          className={`${size} rounded-full object-cover flex-shrink-0 bg-slate-100`}
        />
      );
    }

    // Fallback to initials
    return (
      <div
        className={`${size} rounded-full flex items-center justify-center text-white ${textSize} font-black flex-shrink-0`}
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {getInitials(name)}
      </div>
    );
  }