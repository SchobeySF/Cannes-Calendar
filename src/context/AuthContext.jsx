import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const INITIAL_USERS = [
    { username: 'admin', password: '123', name: 'Admin', role: 'admin' },
    { username: 'brother', password: '123', name: 'Brother', role: 'user' },
    { username: 'parents', password: '123', name: 'Parents', role: 'user' },
    { username: 'me', password: '123', name: 'Me', role: 'user' },
    { username: 'friend', password: '123', name: 'Family Friend', role: 'user' }
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
        const foundUser = allUsers.find(u => u.username === username && u.password === password);

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
        const updatedUsers = [...allUsers, { ...newUser, role: 'user' }];
        setAllUsers(updatedUsers);
        localStorage.setItem('cannes_users_db', JSON.stringify(updatedUsers));
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
            deleteUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};
