import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { supabase } from '@/integrations/supabase/client';

interface FirebaseAuthContextType {
  firebaseUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userRole: 'farmer' | 'buyer' | null;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'farmer' | 'buyer' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // Fetch role from Supabase profiles
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.uid)
          .single();
        
        if (data) {
          setUserRole(data.role as 'farmer' | 'buyer');
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await auth.signOut();
    setUserRole(null);
  };

  return (
    <FirebaseAuthContext.Provider value={{ firebaseUser, loading, signOut, userRole }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return context;
}
