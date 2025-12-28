import { createContext, useState, useContext, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

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
    const [impersonatedUser, setImpersonatedUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for users
        const unsubscribe = onSnapshot(collection(db, 'users'), async (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (usersData.length === 0) {
                console.log("No users found in Firestore. Seeding default users...");
                // Seed database if empty
                const batch = writeBatch(db);
                INITIAL_USERS.forEach(user => {
                    const docRef = doc(collection(db, 'users'));
                    batch.set(docRef, user);
                });
                await batch.commit();
                console.log("Seeding complete.");
            } else {
                console.log("Loaded users from Firestore:", usersData.length);
                setAllUsers(usersData);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to users collection:", error);
            setLoading(false);
        });

        // Check local storage for existing session (just to keep user logged in on refresh)
        const storedUser = localStorage.getItem('cannes_user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setIsAuthenticated(true);
            setUser(parsedUser);
        }

        return () => unsubscribe();
    }, []);

    const login = (username, password) => {
        // Check against the real-time synced users list
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
        setImpersonatedUser(null);
        localStorage.removeItem('cannes_user');
    };

    // Impersonation Logic
    const impersonate = (username) => {
        if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) return;

        if (username === user.username) {
            setImpersonatedUser(null);
        } else {
            const targetUser = allUsers.find(u => u.username === username);
            if (targetUser) {
                setImpersonatedUser(targetUser);
            }
        }
    };

    const actingUser = impersonatedUser || user;

    // Admin Methods
    const addUser = async (newUser) => {
        // Assign a random pastel color if not provided
        const defaultColors = ['#E6E6FA', '#87CEEB', '#F4A460', '#98FB98', '#FFB6C1', '#DDA0DD', '#F0E68C'];
        const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];

        await addDoc(collection(db, 'users'), {
            ...newUser,
            ...newUser,
            role: newUser.role || 'user',
            color: newUser.color || randomColor
        });
    };

    const updateUser = async (username, updates) => {
        const userToUpdate = allUsers.find(u => u.username === username);
        if (userToUpdate) {
            const userRef = doc(db, 'users', userToUpdate.id);
            await updateDoc(userRef, updates);

            // If updating current user, update session too
            if (user && user.username === username) {
                const updatedCurrentUser = { ...user, ...updates };
                setUser(updatedCurrentUser);
                localStorage.setItem('cannes_user', JSON.stringify(updatedCurrentUser));
            }
        }
    };

    const deleteUser = async (usernameToDelete) => {
        const userToDelete = allUsers.find(u => u.username === usernameToDelete);
        if (userToDelete) {
            await deleteDoc(doc(db, 'users', userToDelete.id));
        }
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
            deleteUser,
            deleteUser,
            loading,
            impersonate,
            actingUser,
            impersonatedUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};
