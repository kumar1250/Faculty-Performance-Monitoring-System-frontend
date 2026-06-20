import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // If no custom token is found in browser storage, force user back to login
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  // Only render children layout if token exists
  return token ? children : null;
}