import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';

// Roles that oversee the whole institution rather than one department.
// For these, department is locked to 'ALL' instead of being user-selectable.
const INSTITUTION_WIDE_ROLES = ['principal', 'dean'];

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    register_no: '',
    email: '',
    password: '',
    department: '',
    role: 'faculty', // [cite: 66]
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isInstitutionWide = INSTITUTION_WIDE_ROLES.includes(formData.role);

  // When switching to Principal/Dean, auto-lock department to 'ALL'.
  // When switching away from those roles, clear it so the person has to
  // pick an actual department again (an old 'ALL' value shouldn't carry
  // over to a department-scoped role like HOD or Faculty).
  useEffect(() => {
    if (isInstitutionWide) {
      setFormData(prev => ({ ...prev, department: 'ALL' }));
    } else {
      setFormData(prev => (prev.department === 'ALL' ? { ...prev, department: '' } : prev));
    }
  }, [isInstitutionWide]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/accounts/user/register/', formData); // [cite: 66]
      alert('Account onboarding successful!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Registration pipeline broke.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 max-w-md w-full shadow-sm">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Onboard Faculty Account</h2>
          <p className="text-slate-500 text-sm mt-1">Register to start submitting appraisal points</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-xs font-semibold max-h-24 overflow-y-auto">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Username</label>
            <input type="text" name="username" required value={formData.username} onChange={handleChange}
              className="w-full text-sm px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="rajasree" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Register Number</label>
            <input type="text" name="register_no" required value={formData.register_no} onChange={handleChange}
              className="w-full text-sm px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="REG12345" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Institutional Email</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange}
              className="w-full text-sm px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="name@college.edu" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange}
              className="w-full text-sm px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="••••••••" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Campus Role Group
            </label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
              className="w-full text-sm px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
            >
              <option value="faculty">Faculty Member</option> {/* [cite: 66] */}
              <option value="department_incharge">Department In-Charge</option> {/* [cite: 66] */}
              <option value="committee_coordinator">Committee Coordinator</option> {/* [cite: 66] */}
              <option value="hod">Head of Department (HOD)</option> {/* [cite: 66] */}
              <option value="dean">Dean</option> {/* [cite: 66] */}
              <option value="principal">Principal</option> {/* [cite: 66] */}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Department
            </label>
            {isInstitutionWide ? (
              <>
                {/* Locked display for institution-wide roles — not a real <select>,
                    so there's nothing to pick and nothing that can desync from
                    the auto-set 'ALL' value above. */}
                <div className="w-full text-sm px-4 py-2.5 border border-slate-200 bg-slate-100 rounded-xl font-medium text-slate-500 flex items-center justify-between">
                  <span>All Departments</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auto-assigned</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {formData.role === 'principal' ? 'Principal' : 'Dean'} accounts oversee every department, so this is set automatically.
                </p>
              </>
            ) : (
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full text-sm px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
              >
                <option value="">Select Department</option>
                <option value="CSE">Computer Science and Engineering</option>
                <option value="CSE-ELITE">Computer Science and Engineering (ELITE)</option>
                <option value="ECE">Electronics and Communication Engineering</option>
                <option value="EEE">Electrical and Electronics Engineering</option>
                <option value="MECH">Mechanical Engineering</option>
                <option value="CIVIL">Civil Engineering</option>
              </select>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Creating Profile...' : 'Complete Onboarding'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold transition">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}