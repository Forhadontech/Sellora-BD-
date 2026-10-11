import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile, UserRole } from '../types';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export const FIRST_ADMIN_EMAIL = 'forhad93706@gmail.com';
export const ADMIN_EMAILS = ['forhad93706@gmail.com'];

export const isDesignatedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim() === 'forhad93706@gmail.com';
};

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isFirstAdminEmail: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  bootstrapFirstAdmin: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isFirstAdminEmail = isDesignatedAdminEmail(currentUser?.email);

  // Admin check: either marked admin in profile or is authenticated as a designated initial admin email
  const isAdmin = userProfile?.role === 'admin' || isFirstAdminEmail;
  const isSeller = userProfile?.role === 'seller' || isAdmin;

  const fetchProfile = async (uid: string, email: string, displayName: string = '') => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      const isTargetAdmin = isDesignatedAdminEmail(email);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // If designated admin, ensure role is admin in state and database
        if (isTargetAdmin && data.role !== 'admin') {
          data.role = 'admin';
          try {
            await setDoc(userRef, { role: 'admin' }, { merge: true });
            await setDoc(doc(db, 'admins', uid), {
              uid,
              email,
              role: 'admin',
              createdAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) {
            console.warn('Silent admin auto-promotion sync note:', e);
          }
        } else if (!isTargetAdmin && data.role === 'admin') {
          data.role = 'customer';
          try {
            await setDoc(userRef, { role: 'customer' }, { merge: true });
          } catch (e) {
            console.warn('Silent demotion sync note:', e);
          }
        }
        setUserProfile(data);
      } else {
        // Initial profile creation (strictly role: customer, status: active, or admin for target email)
        const initialProfile: UserProfile = {
          uid,
          email,
          displayName: displayName || email.split('@')[0],
          role: isTargetAdmin ? 'admin' : 'customer',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, initialProfile);
        setUserProfile(initialProfile);

        if (isTargetAdmin) {
          try {
            // Provision admin record in admins collection
            await setDoc(doc(db, 'admins', uid), {
              uid,
              email,
              role: 'admin',
              createdAt: new Date().toISOString()
            }, { merge: true });
          } catch (admErr) {
            console.warn('Silent admin provision note:', admErr);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching or creating profile:', err);
      // Fallback state so user can browse without crash
      const isTargetAdmin = isDesignatedAdminEmail(email);
      setUserProfile({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        role: isTargetAdmin ? 'admin' : 'customer',
        status: 'active',
        createdAt: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user.uid, user.email || '', user.displayName || '');
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string, name: string, phone?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      try {
        await updateProfile(cred.user, { displayName: name });
      } catch (upErr) {
        console.warn('Silent updateProfile note:', upErr);
      }

      const isTargetAdmin = isDesignatedAdminEmail(email);
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email,
        displayName: name,
        phone: phone || '',
        role: isTargetAdmin ? 'admin' : 'customer',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'users', cred.user.uid), newProfile, { merge: true });
      } catch (docErr) {
        console.warn('Profile write synced via fallback:', docErr);
      }

      if (isTargetAdmin) {
        try {
          await setDoc(doc(db, 'admins', cred.user.uid), {
            uid: cred.user.uid,
            email,
            role: 'admin',
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (admErr) {
          console.warn('Silent note saving admin record:', admErr);
        }
      }
      setUserProfile(newProfile);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    if (cred.user) {
      await fetchProfile(cred.user.uid, cred.user.email || '', cred.user.displayName || '');
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Safe one-time setup procedure for the first admin
  const bootstrapFirstAdmin = async (): Promise<boolean> => {
    if (!currentUser) return false;
    const isTarget = isDesignatedAdminEmail(currentUser.email);
    if (!isTarget) {
      throw new Error(`Unauthorized. Only administrators can initialize admin permissions.`);
    }

    try {
      // 1. Create or update admins/{uid}
      await setDoc(doc(db, 'admins', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        role: 'admin',
        createdAt: new Date().toISOString()
      }, { merge: true });

      // 2. Update users/{uid} role to admin
      await setDoc(doc(db, 'users', currentUser.uid), {
        role: 'admin',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await fetchProfile(currentUser.uid, currentUser.email || '', currentUser.displayName || '');
      return true;
    } catch (err) {
      console.error('Error bootstrapping admin:', err);
      handleFirestoreError(err, OperationType.WRITE, `admins/${currentUser.uid}`);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser.uid, currentUser.email || '', currentUser.displayName || '');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isSeller,
        isFirstAdminEmail,
        login,
        register,
        signInWithGoogle,
        logout,
        resetPassword,
        bootstrapFirstAdmin,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
