import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type Role = 'player' | 'club' | 'admin';

interface AuthContextType {
  role: Role | null;
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, role: Role, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let userDocRef = doc(db, 'players', firebaseUser.uid);
          let userDoc = await getDoc(userDocRef);
          let currentRole: Role = 'player';
          
          if (!userDoc.exists()) {
            userDocRef = doc(db, 'clubs', firebaseUser.uid);
            userDoc = await getDoc(userDocRef);
            currentRole = 'club';
          }
          
          if (userDoc.exists()) {
            setRole(currentRole);
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() });
            setIsAuthenticated(true);
          } else {
            // Check for admin or fallback
            // In a real app, admins might have claims, but for now we fallback
            setRole('admin');
            setIsAuthenticated(true);
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          // Fallback if firestore rules prevent read or it fails
          setIsAuthenticated(true);
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        }
      } else {
        setRole(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string, selectedRole: Role, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const collection = selectedRole === 'club' ? 'clubs' : 'players';
    
    await setDoc(doc(db, collection, userCredential.user.uid), {
      name,
      email,
      role: selectedRole,
      createdAt: new Date().toISOString()
    });
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ role, isAuthenticated, user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
