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
      if (!targetNo) {
        const detailRes = await API.get('/accounts/user/details/');
        targetNo = detailRes.data.register_no;
        setCurrentRegisterNo(targetNo);
        setCurrentUserId(detailRes.data.id); 
      } else {
        setCurrentRegisterNo(targetNo);
      }

      // Final Path Alignment with Django Routers (Removing trailing slashes to match regex)
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
        API.get(`/feedback/student-feedback/user/${targetNo}`).catch(() => ({ data: [] }))
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
      <BookPublications records={books} isReadOnly={isReadOnly} currentRegisterNo={currentRegisterNo} onRefresh={loadProfileData} />
      <StudentProjectModule records={studentProjects} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
      <StudentFeedbackModule records={feedbacks} isReadOnly={isReadOnly} currentUserId={currentUserId} onRefresh={loadProfileData} />
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