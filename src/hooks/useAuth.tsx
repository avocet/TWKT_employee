import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserFromFirestore = async (firebaseUser: any): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        return { ...userDoc.data(), id: firebaseUser.uid } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await fetchUserFromFirestore(firebaseUser);
        if (userData) {
          setUser(userData);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      let email = username.trim();
      
      const { getDocs, collection } = await import('firebase/firestore');
      
      // Get all accounts and find matching name
      const snapshot = await getDocs(collection(db, 'accounts'));
      
      let found = null;
      for (const d of snapshot.docs) {
        const data = d.data();
        if (data.name === username || d.id === username) {
          found = data;
          break;
        }
      }
      
      if (found && found.email) {
        email = found.email;
      } else {
        alert('帳號不存在，請確認帳號正確');
        return { success: false, error: '找不到此使用者，請確認帳號正確' };
      }
      
      // If email still doesn't have @, it's invalid
      if (!email || !email.includes('@')) {
        alert('Email 無效: ' + email);
        return { success: false, error: '找不到此使用者，請確認帳號正確' };
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Store credentials for re-login after creating new users
      sessionStorage.setItem('adminEmail', email);
      sessionStorage.setItem('adminPassword', password);
      
      // Check if user exists in Firestore, if not create it
      let userData = await fetchUserFromFirestore(userCredential.user);
      
      if (!userData) {
        // Create user data in Firestore
        const { setDoc, doc } = await import('firebase/firestore');
        const newUser: User = {
          id: userCredential.user.uid,
          username: email.replace('@twkt.com', ''),
          password: '',
          email: email,
          name: userCredential.user.displayName || email.split('@')[0],
          role: 'employee',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          department: '技術部'
        };
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userDocRef, newUser);
        userData = newUser;
      }
      
      setUser(userData);
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-email' || error.message?.includes('invalid-email')) {
        return { success: false, error: '無效的電子郵件格式' };
      } else if (error.code === 'auth/user-not-found') {
        return { success: false, error: '此帳號尚未註冊' };
      } else if (error.code === 'auth/invalid-credential' || error.message?.includes('invalid-credential')) {
        return { success: false, error: '帳號或密碼錯誤，請重新確認' };
      } else if (error.code === 'auth/wrong-password') {
        return { success: false, error: '密碼錯誤' };
      } else if (error.code === 'auth/too-many-requests') {
        return { success: false, error: '登入次數過多，請稍後再試' };
      }
      return { success: false, error: '登入失敗：' + (error.message || error.code) };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    sessionStorage.removeItem('adminEmail');
    sessionStorage.removeItem('adminPassword');
  };

  const updateUser = async (updatedUser: User): Promise<boolean> => {
    if (!auth.currentUser) return false;
    
    try {
      const updateData: Record<string, any> = {};

      if (updatedUser.name) {
        updateData.name = updatedUser.name;
      }
      if (updatedUser.department) {
        updateData.department = updatedUser.department;
      }
      if (updatedUser.employmentType) {
        updateData.employmentType = updatedUser.employmentType;
      }
      if (updatedUser.avatar) {
        updateData.avatar = updatedUser.avatar;
      }
      if (updatedUser.email) {
        updateData.email = updatedUser.email;
      }
      if (updatedUser.signedContractAt) {
        updateData.signedContractAt = updatedUser.signedContractAt;
      }
      if (updatedUser.contractStartDate) {
        updateData.contractStartDate = updatedUser.contractStartDate;
      }

      console.log('Updating user with data:', updateData);
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
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

export async function getUsers(): Promise<User[]> {
  const { getDocs, collection } = await import('firebase/firestore');
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

export async function saveUser(user: User): Promise<void> {
  const { setDoc, doc } = await import('firebase/firestore');
  await setDoc(doc(db, 'users', user.id), user);
}
