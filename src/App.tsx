import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import MainLayout from './components/MainLayout';

function AppContent() {
  const { user } = useAuth();
  
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
