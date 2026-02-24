import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { getFirestore, getDocs, collection } from 'firebase/firestore';
import { app } from './utils/firebase';
import LoginPage from './components/LoginPage';
import MainLayout from './components/MainLayout';
import SetupPage from './components/SetupPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    const checkUsers = async () => {
      try {
        const db = getFirestore(app);
        const snapshot = await getDocs(collection(db, 'users'));
        if (snapshot.empty) {
          setNeedsSetup(true);
        }
      } catch (error) {
        console.error('Error checking users:', error);
      }
      setCheckingSetup(false);
    };

    checkUsers();
  }, []);

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  if (needsSetup) {
    return <SetupPage />;
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }
  
  if (!user) {
    return <LoginPage />;
  }
  
  return <MainLayout />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
