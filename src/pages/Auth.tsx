import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Redirect to phone auth - no email login
export default function Auth() {
  const navigate = useNavigate();
  const { user, userRole, loading, needsRoleSelection } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && userRole && !needsRoleSelection) {
        // Already logged in, redirect based on role
        switch (userRole) {
          case 'admin':
            navigate('/admin');
            break;
          case 'farmer':
            navigate('/farmer-dashboard');
            break;
          default:
            navigate('/marketplace');
        }
      } else {
        // Not logged in or needs role, go to phone auth
        navigate('/phone-auth');
      }
    }
  }, [user, userRole, loading, needsRoleSelection, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
