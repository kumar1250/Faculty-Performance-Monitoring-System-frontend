// ─────────────────────────────────────────────────────────────────────────
// Central registry of every faculty-activity module's REST endpoints.
//
// These paths are verified against the Django backend's urls.py / views.py
// (router prefix + @action url_path for each ViewSet). Keeping them in one
// place means every screen that needs to fetch/create/update/delete/view
// a module's records agrees on the same URLs.
// ─────────────────────────────────────────────────────────────────────────

export const MODULE_ENDPOINTS = {
  'Book Publications': {
    base: '/book/book-publications',
    userList: (registerNo) => `/book/book-publications/user/${registerNo}`,
    fileUrl: (id) => `/book/book-publications/${id}/file/`,
    hasFile: true,
  },
  'Certificate Courses Done': {
    base: '/course/course',
    userList: (registerNo) => `/course/course/usercourses/${registerNo}`,
    fileUrl: (id) => `/course/course/${id}/file/`,
    hasFile: true,
  },
  'Conference Publications': {
    base: '/conference/publications',
    userList: (registerNo) => `/conference/publications/userpublications/${registerNo}`,
    fileUrl: (id) => `/conference/publications/${id}/file/`,
    hasFile: true,
  },
  'Consultancy': {
    base: '/consultancy',
    userList: (registerNo) => `/consultancy/user-consultancies/${registerNo}`,
    fileUrl: (id) => `/consultancy/${id}/file/`,
    hasFile: true,
  },
  'FDPs Attended': {
    base: '/fdps-attend/fdp',
    userList: (registerNo) => `/fdps-attend/fdp/user/${registerNo}`,
    fileUrl: (id) => `/fdps-attend/fdp/${id}/file/`,
    hasFile: true,
  },
  'FDPs Organized': {
    base: '/fdpsor/fdpso',
    userList: (registerNo) => `/fdpsor/fdpso/userfdps/${registerNo}`,
    fileUrl: (id) => `/fdpsor/fdpso/${id}/file/`,
    hasFile: true,
  },
  'Funded Projects': {
    base: '/funded/funded-projects',
    userList: (registerNo) => `/funded/funded-projects/user/${registerNo}`,
    hasFile: false,
  },
  'Journal Publications': {
    base: '/journal/journalpublication',
    userList: (registerNo) => `/journal/journalpublication/user/${registerNo}`,
    fileUrl: (id) => `/journal/journalpublication/${id}/file/`,
    hasFile: true,
  },
  'Learning Material': {
    base: '/learning/learning-material',
    userList: (registerNo) => `/learning/learning-material/usercontributions/${registerNo}`,
    hasFile: false,
  },
  'Memberships with Professional Bodies': {
    base: '/professional-membership/professional',
    userList: (registerNo) => `/professional-membership/professional/usermemberships/${registerNo}`,
    fileUrl: (id) => `/professional-membership/professional/${id}/file/`,
    hasFile: true,
  },
  'Patents': {
    base: '/patents',
    userList: (registerNo) => `/patents/userpatents/${registerNo}`,
    fileUrl: (id) => `/patents/${id}/file/`,
    hasFile: true,
  },
  'Research Guidance': {
    base: '/research/research',
    userList: (registerNo) => `/research/research/user-guidance/${registerNo}`,
    hasFile: false,
  },
  'Sessions & Delivering Talks/Lectures': {
    base: '/session/chairing',
    userList: (registerNo) => `/session/chairing/usersessions/${registerNo}`,
    fileUrl: (id) => `/session/chairing/${id}/file/`,
    hasFile: true,
  },
  'Student Counselling / Mentoring': {
    base: '/counselling/counselling',
    userList: (registerNo) => `/counselling/counselling/usercontributions/${registerNo}`,
    hasFile: false,
  },
  'Student Project Works': {
    base: '/project/studentproject',
    userList: (registerNo) => `/project/studentproject/user/${registerNo}`,
    fileUrl: (id) => `/project/studentproject/${id}/file/`,
    hasFile: true,
  },
  'Theory Courses Handled': {
    base: '/feedback/student-feedback',
    userList: (registerNo) => `/feedback/student-feedback/user/${registerNo}`,
    hasFile: false,
  },
};

// Returns the list of records for a given module label + register_no,
// or an empty array if the module is unrecognized / the request fails.
export async function fetchModuleRecords(API, moduleLabel, registerNo) {
  const entry = MODULE_ENDPOINTS[moduleLabel];
  if (!entry || !registerNo) return [];
  try {
    const res = await API.get(entry.userList(registerNo));
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

// Resolves a working, temporary signed S3 URL for a record's uploaded file.
//
// The raw `certificate_file` value embedded in list/detail API responses is
// an unsigned S3 URL and will 403 (AccessDenied) if opened directly, because
// the bucket is private. Each module instead exposes a dedicated
// GET /<module>/<id>/file/ action that returns a short-lived presigned URL
// (`{ certificate_url: "..." }`) which actually grants access. This helper
// calls that endpoint and returns the working URL, or null on failure.
export async function fetchPresignedFileUrl(API, moduleLabel, recordId) {
  const entry = MODULE_ENDPOINTS[moduleLabel];
  if (!entry || !entry.hasFile || !entry.fileUrl || !recordId) {
    console.warn('fetchPresignedFileUrl: no file endpoint configured for module', moduleLabel);
    return null;
  }
  try {
    const res = await API.get(entry.fileUrl(recordId));
    return res.data?.certificate_url || null;
  } catch (err) {
    console.error('fetchPresignedFileUrl failed for', moduleLabel, recordId, err?.response?.status, err?.response?.data || err.message);
    return null;
  }
}