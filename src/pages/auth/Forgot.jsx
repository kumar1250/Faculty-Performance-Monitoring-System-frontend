import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';

export default function Forgot() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const res = await API.post('/accounts/user/forgot-password/', { email }); // [cite: 66]
      setMessage(res.data.message);
      setStep(2);
    } catch (err) { setError(err.response?.data?.error || 'Submission failed.'); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('/accounts/user/verify-otp/', { email, otp }); // [cite: 66]
      setResetToken(res.data.reset_token);
      setMessage('OTP verified! Provide a new secure password entry.');
      setStep(3);
    } catch (err) { setError(err.response?.data?.error || 'Invalid code.'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('/accounts/user/reset-password/', { reset_token: resetToken, new_password: newPassword }); // [cite: 66]
      setMessage(res.data.message);
      setStep(4);
    } catch (err) { setError(err.response?.data?.error || 'Token expired.'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 max-w-md w-full shadow-sm">
        
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
        </div>

        <h3 className="text-xl font-black text-slate-900 text-center tracking-tight mb-1">Credential Security Manager</h3>
        
        {/* Step Counter Indicator */}
        {step < 4 && (
          <div className="flex justify-center items-center gap-1.5 my-4">
            {[1, 2, 3].map((s) => (
              <span key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'}`}></span>
            ))}
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs font-semibold mb-4">{error}</div>}
        {message && <div className="bg-green-50 border border-green-100 text-green-700 p-3 rounded-xl text-xs font-semibold mb-4">{message}</div>}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <p className="text-slate-500 text-xs text-center">Provide your registered institutional email profile address to handle authorization verification steps.</p>
            <input type="email" placeholder="name@college.edu" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition">Dispatch OTP Token</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-slate-500 text-xs text-center">Type the 6-digit identification value dispatched across your personal institutional mail folder.</p>
            <input type="text" placeholder="000000" required value={otp} onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center tracking-widest font-black text-2xl px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition">Confirm Verification Security</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-slate-500 text-xs text-center">Assemble an authenticated password profile hash value.</p>
            <input type="password" placeholder="New secure account password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            <button type="submit" className="w-full bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition">Overwrite Password Hash</button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center space-y-4 pt-2">
            <p className="text-slate-500 text-sm">Credential modifications successfully logged down to production schemas.</p>
            <Link to="/login" className="block w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition">Proceed back to Login</Link>
          </div>
        )}

        {step !== 4 && (
          <div className="mt-6 text-center">
            <Link to="/login" className="text-xs text-slate-400 hover:text-slate-600 transition">Return back to sign in screen</Link>
          </div>
        )}

      </div>
    </div>
  );
}