import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await API.post('/accounts/user/login/', { username, password });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid register number or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 antialiased font-sans">
      
      {/* Centralized Core Container */}
      <div className="w-full max-w-[440px]">
        
        {/* App Mini-Branding Wrapper */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-xl text-lg font-black tracking-tight shadow-sm mb-2">
            FP
          </div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">PerformanceHub</h1>
          <p className="text-xs text-slate-500 mt-0.5">Faculty Performance Management System</p>
        </div>

        {/* Core Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1">Please enter your institutional account credentials.</p>
          </div>

          {/* Interactive Error Alert Banner */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs font-medium flex items-start gap-2 mb-4 animate-in fade-in duration-200">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Input: Register Number / Email */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                Register Number or Email
              </label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                placeholder="e.g., REG12345" 
                className="w-full text-sm px-4 py-2.5 border border-slate-200 bg-slate-50/30 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all disabled:opacity-50"
              />
            </div>

            {/* Input: Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition focus:outline-none"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="space-y-1">
            <div className="flex justify-between items-center">
            </div>
            
            {/* Wrapper for Input and Toggle */}
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••" 
                className="w-full text-sm px-4 py-2.5 border border-slate-200 bg-slate-50/30 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {/* Simple SVG Eye Icon */}
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
            </div>

            {/* Submit Action Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 pt-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin">
                  </div>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>

          </form>

          {/* Bottom Card Footer Navigation */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            New to PerformanceHub?{' '}
            <Link 
              to="/register" 
              className="text-blue-600 hover:text-blue-700 font-bold transition underline underline-offset-4"
            >
              Create an account
            </Link>
          </div>

        </div>

        {/* Global Institutional copyright footer */}
        <div className="text-center text-[11px] text-slate-400 mt-8 tracking-wide">
          &copy; {new Date().getFullYear()} Faculty Performance Management System.<br />All corporate rights reserved.
        </div>

      </div>
    </div>
  );
}