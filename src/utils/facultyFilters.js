import API from '../api/axios';

/**
 * Canonical department choices (mirrors the backend's User.DEPARTMENT_CHOICES).
 * Reused anywhere we need a department filter dropdown (e.g. Approval Inbox
 * for dean/principal).
 */
export const DEPARTMENT_OPTIONS = [
  { value: 'CSE',        label: 'Computer Science and Engineering' },
  { value: 'CSE-ELITE',  label: 'Computer Science and Engineering (ELITE)' },
  { value: 'ECE',        label: 'Electronics and Communication Engineering' },
  { value: 'EEE',        label: 'Electrical and Electronics Engineering' },
  { value: 'MECH',       label: 'Mechanical Engineering' },
  { value: 'CIVIL',      label: 'Civil Engineering' },
];

/**
 * Reusable role-based faculty filter.
 *
 * - HOD  -> only faculty in the same department as the logged-in HOD.
 * - dean / principal / anyone else -> no filtering, full list returned.
 *
 * Expects faculty objects shaped like:
 *   { username, register_no, role, department }
 * and a currentUser object shaped like:
 *   { role, department }
 */
export const filterFacultyByRole = (facultyList, currentUser) => {
  if (!Array.isArray(facultyList)) return [];
  if (!currentUser) return facultyList;

  if ((currentUser.role || '').toLowerCase() === 'hod') {
    return facultyList.filter(
      (faculty) => faculty.department === currentUser.department
    );
  }
  return facultyList;
};

/* ────────────────────────────────────────────────────────────────────────
 * Department lookup helper
 * ────────────────────────────────────────────────────────────────────────
 * The faculty-summary endpoints (search / leaderboard / all-faculty /
 * dashboard) return rows with username, register_no, role, total_points,
 * etc. — but NOT department. To apply filterFacultyByRole() on those rows
 * we need each faculty member's department.
 *
 * /accounts/user/list/ (already used elsewhere in the app, IsAuthenticated
 * only) returns every user's full record, including `department`. We fetch
 * it once, cache it in memory for this session, and use it to enrich rows
 * by register_no before filtering. No backend changes required.
 * ──────────────────────────────────────────────────────────────────────── */

let directoryCache = null;
let directoryPromise = null;

export async function getFacultyDirectory() {
  if (directoryCache) return directoryCache;
  if (directoryPromise) return directoryPromise;

  directoryPromise = API.get('/accounts/user/list/')
    .then((res) => {
      const map = {};
      (res.data || []).forEach((u) => {
        if (u.register_no) map[u.register_no] = u.department;
      });
      directoryCache = map;
      return map;
    })
    .catch(() => ({}))
    .finally(() => {
      directoryPromise = null;
    });

  return directoryPromise;
}

export function clearFacultyDirectoryCache() {
  directoryCache = null;
}

/** Attach `department` to each row (by register_no) using the directory map. */
export function attachDepartments(rows, directoryMap) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    ...row,
    department: row.department ?? directoryMap?.[row.register_no],
  }));
}

/**
 * Convenience one-shot helper: fetch the directory, enrich rows with
 * department, then apply filterFacultyByRole — all in one call.
 */
export async function enrichAndFilterFaculty(rows, currentUser) {
  const directory = await getFacultyDirectory();
  const enriched = attachDepartments(rows, directory);
  return filterFacultyByRole(enriched, currentUser);
}