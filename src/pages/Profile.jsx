import { useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import API from '../api/axios';
import BookPublications from '../components/Modules/BookPublications';
import CourseCertifications from '../components/Modules/CourseCertifications';
import PublicationModule from '../components/Modules/PublicationModule';
import ConsultancyModule from '../components/Modules/ConsultancyModule';
import FDPsAttendedModule from '../components/Modules/FDPsAttendedModule';
import FDPsOrganizedModule from '../components/Modules/FDPsOrganizedModule';
import FundedProjectsModule from '../components/Modules/FundedProjectsModule';
import JournalPublicationModule from '../components/Modules/JournalPublicationModule';
import LearningMaterialModule from '../components/Modules/LearningMaterialModule';
import ProfessionalMembershipModule from '../components/Modules/ProfessionalMembershipModule';
import PatentModule from '../components/Modules/PatentModule';
import ResearchGuidanceModule from '../components/Modules/ResearchGuidanceModule';
import ChairingSessionModule from '../components/Modules/ChairingSessionModule';
import StudentCounsellingModule from '../components/Modules/StudentCounsellingModule';
import StudentProjectModule from '../components/Modules/StudentProjectModule';
import StudentFeedbackModule from '../components/Modules/StudentFeedbackModule';

export default function Profile() {
  const { registerNo } = useParams();
  const isReadOnly = !!registerNo;
  const [loading, setLoading] = useState(true);
  const [currentRegisterNo, setCurrentRegisterNo] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [viewerRole, setViewerRole] = useState('');   // role of the logged-in viewer
  const [profile, setProfile] = useState(null); // avatar, headline, bio, department, experience
  
  const [books, setBooks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [publications, setPublications] = useState([]);
  const [consultancies, setConsultancies] = useState([]);
  const [fdps, setFdps] = useState([]);
  const [fdpsOrganized, setFdpsOrganized] = useState([]);
  const [fundedProjects, setFundedProjects] = useState([]);
  const [journals, setJournals] = useState([]);
  const [learningMaterials, setLearningMaterials] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [patents, setPatents] = useState([]);
  const [guidanceRecords, setGuidanceRecords] = useState([]);
  const [chairedSessions, setChairedSessions] = useState([]);
  const [counsellingRecords, setCounsellingRecords] = useState([]);
  const [studentProjects, setStudentProjects] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  const loadProfileData = useCallback(async () => {
    try {
      let targetNo = registerNo;
      let targetUserId = null;
      let myRole = '';
      if (!targetNo) {
        const detailRes = await API.get('/accounts/user/details/');
        targetNo = detailRes.data.register_no;
        targetUserId = detailRes.data.id;
        myRole = detailRes.data.role?.toLowerCase() || '';
        setCurrentRegisterNo(targetNo);
        setCurrentUserId(targetUserId);
        setViewerRole(myRole);
      } else {
        setCurrentRegisterNo(targetNo);
        // Still need the viewer's own id/role when browsing someone else's
        // profile — canModifyRecord() in StudentFeedbackModule compares
        // record.created_by against this viewer's own id.
        try {
          const meRes = await API.get('/accounts/user/details/');
          myRole = meRes.data.role?.toLowerCase() || '';
          setViewerRole(myRole);
          setCurrentUserId(meRes.data.id);
        } catch { /* silently ignore */ }
      }

      // Profile header (avatar/headline/bio/department/experience) is fetched
      // separately and allowed to fail silently so a missing profile never
      // blocks the rest of the portfolio from loading.
      // - own portfolio  -> /accounts/profiles/me/
      // - someone else's -> /accounts/profiles/by-register/<registerNo>/
      const profileUrl = isReadOnly
        ? `/accounts/profiles/by-register/${targetNo}/`
        : '/accounts/profiles/me/';
      API.get(profileUrl)
        .then(res => setProfile(res.data))
        .catch(() => setProfile(null));

      // Final Path Alignment with Django Routers (Removing trailing slashes to match regex)
      // Student feedback: HOD viewing their OWN profile sees the entries
      // *they personally uploaded* (across every faculty member) instead
      // of records scoped to their own register number.
      const isOwnProfile = !isReadOnly;
      const feedbackRequest = (isOwnProfile && myRole === 'hod')
        ? API.get('/feedback/student-feedback/my-uploads/').catch(() => ({ data: [] }))
        : API.get(`/feedback/student-feedback/user/${targetNo}`).catch(() => ({ data: [] }));

      const [
        booksRes, coursesRes, pubRes, consRes, 
        fdpRes, fdpOrgRes, fundedRes, journalRes, 
        learningRes, memberRes, patentRes, guidanceRes, 
        sessionRes, counselRes, studentRes, feedbackRes
      ] = await Promise.all([
        API.get(`/book/book-publications/user/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/course/course/usercourses/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/conference/publications/userpublications/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/consultancy/user-consultancies/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/fdps-attend/fdp/user/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/fdpsor/fdpso/userfdps/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/funded/funded-projects/user/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/journal/journalpublication/user/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/learning/learning-material/usercontributions/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/professional-membership/professional/usermemberships/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/patents/userpatents/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/research/research/user-guidance/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/session/chairing/usersessions/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/counselling/counselling/usercontributions/${targetNo}`).catch(() => ({ data: [] })),
        API.get(`/project/studentproject/user/${targetNo}`).catch(() => ({ data: [] })),
        feedbackRequest
      ]);

      setBooks(booksRes.data || []);
      setCourses(coursesRes.data || []);
      setPublications(pubRes.data || []);
      setConsultancies(consRes.data || []);
      setFdps(fdpRes.data || []);
      setFdpsOrganized(fdpOrgRes.data || []);
      setFundedProjects(fundedRes.data || []);
      setJournals(journalRes.data || []);
      setLearningMaterials(learningRes.data || []);
      setMemberships(memberRes.data || []);
      setPatents(patentRes.data || []);
      setGuidanceRecords(guidanceRes.data || []);
      setChairedSessions(sessionRes.data || []);
      setCounsellingRecords(counselRes.data || []);
      setStudentProjects(studentRes.data || []);
      setFeedbacks(feedbackRes.data || []);
    } catch (err) {
      console.error('Data sync error:', err);
    } finally {
      setLoading(false);
    }
  }, [registerNo]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto antialiased p-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <h2 className="text-xl font-black text-slate-900">{isReadOnly ? `Portfolio: ${registerNo}` : 'My Portfolio'}</h2>
      </div>

      {/* Profile header: avatar, headline, department, experience, bio */}
      {profile && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row gap-5 sm:items-start">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black overflow-hidden flex-shrink-0">
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt={profile.username?.username || 'Profile'}
                className="w-full h-full object-cover" />
            ) : (
              (profile.username?.username?.[0] || currentRegisterNo?.[0] || '?').toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            {profile.username?.username && (
              <p className="text-lg font-black text-slate-900 capitalize">{profile.username.username}</p>
            )}
            {profile.headline && (
              <p className="text-sm font-bold text-slate-700 mt-0.5">{profile.headline}</p>
            )}
            {(profile.department || profile.experience_years) && (
              <p className="text-xs font-semibold text-slate-500 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {profile.department && <span>🏛️ {profile.department}</span>}
                {profile.experience_years ? (
                  <span>📅 {profile.experience_years} {profile.experience_years === 1 ? 'year' : 'years'} experience</span>
                ) : null}
              </p>
            )}
            {profile.bio && (
              <p className="text-sm text-slate-600 mt-3 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            )}
            {!profile.headline && !profile.bio && !profile.department && !profile.experience_years && (
              <p className="text-sm text-slate-400 italic mt-1">
                {isReadOnly ? 'No profile details added yet.' : "You haven't added profile details yet — head to My Account to fill them in."}
              </p>
            )}
          </div>
        </div>
      )}

      <BookPublications records={books} isReadOnly={isReadOnly} currentRegisterNo={currentRegisterNo} onRefresh={loadProfileData} />
      <StudentProjectModule records={studentProjects} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      {/* Student Feedback is visible to the HOD (on any profile) or to the faculty on their own profile. */}
      {/* HOD: full edit access. Faculty on own profile: view-only. Principal/Dean: hidden entirely. Others: hidden. */}
      {(viewerRole === 'hod' || (!isReadOnly && !['principal', 'dean'].includes(viewerRole))) && (
        <StudentFeedbackModule
          records={feedbacks}
          isReadOnly={viewerRole !== 'hod'}
          currentUserId={currentUserId}
          onRefresh={loadProfileData}
          facultyName={profile?.username?.username || currentRegisterNo}
          viewerRole={viewerRole}
        />
      )}
      <StudentCounsellingModule records={counsellingRecords} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <ChairingSessionModule records={chairedSessions} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <ResearchGuidanceModule records={guidanceRecords} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <PatentModule records={patents} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <ProfessionalMembershipModule records={memberships} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <LearningMaterialModule records={learningMaterials} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <JournalPublicationModule records={journals} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <PublicationModule records={publications} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <FundedProjectsModule records={fundedProjects} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <ConsultancyModule records={consultancies} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <FDPsOrganizedModule records={fdpsOrganized} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <FDPsAttendedModule records={fdps} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <CourseCertifications records={courses} isReadOnly={isReadOnly} currentRegisterNo={currentRegisterNo} onRefresh={loadProfileData} />
    </div>
  );
}