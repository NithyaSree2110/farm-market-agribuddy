import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { supabase } from '@/integrations/supabase/client';

// Admin phone number - DEV ONLY
const ADMIN_PHONE = '+919381179867';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userRole: 'farmer' | 'buyer' | 'admin' | null;
  setUserRole: (role: 'farmer' | 'buyer' | 'admin') => Promise<void>;
  needsRoleSelection: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRoleState] = useState<'farmer' | 'buyer' | 'admin' | null>(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check if admin phone
        if (firebaseUser.phoneNumber === ADMIN_PHONE) {
          setUserRoleState('admin');
          setNeedsRoleSelection(false);
          // Upsert admin profile
          await supabase.from('profiles').upsert({
            id: firebaseUser.uid,
            phone: firebaseUser.phoneNumber,
            role: 'admin' as const,
          }, { onConflict: 'id' });
        } else {
          // Fetch role from Supabase profiles
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', firebaseUser.uid)
            .single();
          
          if (data?.role) {
            setUserRoleState(data.role as 'farmer' | 'buyer' | 'admin');
            setNeedsRoleSelection(false);
          } else {
            // New user, needs role selection
            setNeedsRoleSelection(true);
            setUserRoleState(null);
          }
        }
      } else {
        setUserRoleState(null);
        setNeedsRoleSelection(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setUserRole = async (role: 'farmer' | 'buyer' | 'admin') => {
    if (!user) return;
    
    const { error } = await supabase.from('profiles').upsert({
      id: user.uid,
      phone: user.phoneNumber,
      role: role,
    }, { onConflict: 'id' });
    
    if (!error) {
      setUserRoleState(role);
      setNeedsRoleSelection(false);
    }
  };

  const signOut = async () => {
    if (auth) {
      await auth.signOut();
    }
    setUserRoleState(null);
    setNeedsRoleSelection(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, userRole, setUserRole, needsRoleSelection }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
