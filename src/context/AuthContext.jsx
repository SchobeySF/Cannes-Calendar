import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const INITIAL_USERS = [
    { username: 'admin', password: '123', name: 'Admin', role: 'admin', color: '#E6E6FA' }, // Lavender
    { username: 'brother', password: '123', name: 'Brother', role: 'user', color: '#87CEEB' }, // Sky Blue
    { username: 'parents', password: '123', name: 'Parents', role: 'user', color: '#F4A460' }, // Sandy Brown
    { username: 'me', password: '123', name: 'Me', role: 'user', color: '#98FB98' }, // Pale Green
    { username: 'friend', password: '123', name: 'Family Friend', role: 'user', color: '#FFB6C1' } // Light Pink
];

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        // Load users from local storage or seed
        const storedUsers = localStorage.getItem('cannes_users_db');
        if (storedUsers) {
            setAllUsers(JSON.parse(storedUsers));
        } else {
            setAllUsers(INITIAL_USERS);
            localStorage.setItem('cannes_users_db', JSON.stringify(INITIAL_USERS));
        }

        // Check local storage for existing session
        const storedUser = localStorage.getItem('cannes_user');
        if (storedUser) {
            setIsAuthenticated(true);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (username, password) => {
        // Refresh users from DB to ensure we have latest data (e.g. if password changed)
        const currentUsers = JSON.parse(localStorage.getItem('cannes_users_db') || '[]');
        const foundUser = currentUsers.find(u => u.username === username && u.password === password);

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

    // Admin Methods
    const addUser = (newUser) => {
        // Assign a random pastel color if not provided
        const defaultColors = ['#E6E6FA', '#87CEEB', '#F4A460', '#98FB98', '#FFB6C1', '#DDA0DD', '#F0E68C'];
        const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];

        const updatedUsers = [...allUsers, { ...newUser, role: 'user', color: randomColor }];
        setAllUsers(updatedUsers);
        localStorage.setItem('cannes_users_db', JSON.stringify(updatedUsers));
    };

    const updateUser = (username, updates) => {
        const updatedUsers = allUsers.map(u =>
            u.username === username ? { ...u, ...updates } : u
        );
        setAllUsers(updatedUsers);
        localStorage.setItem('cannes_users_db', JSON.stringify(updatedUsers));

        // If updating current user, update session too
        if (user && user.username === username) {
            const updatedCurrentUser = { ...user, ...updates };
            setUser(updatedCurrentUser);
            localStorage.setItem('cannes_user', JSON.stringify(updatedCurrentUser));
        }
    };

    const deleteUser = (usernameToDelete) => {
        const updatedUsers = allUsers.filter(u => u.username !== usernameToDelete);
        setAllUsers(updatedUsers);
        localStorage.setItem('cannes_users_db', JSON.stringify(updatedUsers));
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            login,
            logout,
            allUsers,
            addUser,
            updateUser,
            deleteUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};
