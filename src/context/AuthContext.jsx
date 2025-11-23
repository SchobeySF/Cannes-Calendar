import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check local storage for existing session
        const storedAuth = localStorage.getItem('cannes_auth');
        if (storedAuth === 'true') {
            setIsAuthenticated(true);
            setUser({ name: 'Family Member' });
        }
    }, []);

    const login = (password) => {
        // Mock password check - in a real app this would be a backend call
        if (password === 'cannes2026' || password === 'admin') {
            setIsAuthenticated(true);
            setUser({ name: 'Family Member' });
            localStorage.setItem('cannes_auth', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('cannes_auth');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
