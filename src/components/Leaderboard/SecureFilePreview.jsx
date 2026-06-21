import { useState } from 'react';
import API from '../../api/axios';
import { fetchPresignedFileUrl } from '../../api/moduleEndpoints';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

function getExtension(url) {
  if (!url) return '';
  const clean = url.split('?')[0];
  const last = clean.split('.').pop();
  return (last || '').toLowerCase();
}

// The raw file URL embedded in list/detail responses is unsigned and will
// 403/AccessDenied since the S3 bucket is private. This calls the module's
// dedicated /file/ action on click, which returns a short-lived presigned
// URL, and renders it inline (image preview or embedded PDF) instead of
// linking straight to the broken raw URL.
export default function SecureFilePreview({ moduleLabel, recordId, rawUrl }) {
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