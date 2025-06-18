
import { AuthProvider, useAuth } from './components/AuthContext';
import { AuthForm } from './components/AuthForm';
import { DashboardTabs } from './components/DashboardTabs';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated ? <DashboardTabs /> : <AuthForm />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
