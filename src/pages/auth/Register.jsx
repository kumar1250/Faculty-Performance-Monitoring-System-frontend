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
  const [showPassword, setShowPassword] = useState(false);

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
            <input type="text" name="username" autoComplete="off" autoComplete="new-password" required value={formData.username} onChange={handleChange}
              className="w-full text-sm px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="rajasree" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Register Number</label>
            <input type="text" name="register_no" autoComplete="off" required value={formData.register_no} onChange={handleChange}
              className="w-full text-sm px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="REG12345" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Institutional Email</label>
            <input type="email" name="email" autoComplete="off" required value={formData.email} onChange={handleChange}
              className="w-full text-sm px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="name@college.edu" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                autoComplete="new-password"
                required 
                value={formData.password} 
                autoComplete="off"
                onChange={handleChange}
                className="w-full text-sm px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                placeholder="••••••••" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
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