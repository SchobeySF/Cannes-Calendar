import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const MOCK_USERS = [
    { username: 'brother', password: '123', name: 'Brother' },
    { username: 'parents', password: '123', name: 'Parents' },
    { username: 'me', password: '123', name: 'Me' },
    { username: 'friend', password: '123', name: 'Family Friend' }
];

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('cannes_user');
        if (storedUser) {
            setIsAuthenticated(true);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (username, password) => {
        const foundUser = MOCK_USERS.find(u => u.username === username && u.password === password);

        if (foundUser) {
            setIsAuthenticated(true);
            setUser(foundUser);
            localStorage.setItem('cannes_user', JSON.stringify(foundUser));
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('cannes_user');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
