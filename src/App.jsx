import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import CalendarPage from './components/CalendarPage';

const AppContent = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="app">
            {isAuthenticated ? <CalendarPage /> : <LoginPage />}
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
