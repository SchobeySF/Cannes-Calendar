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
    getDocs
} from 'firebase/firestore';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';
import { db, auth } from '../firebase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [impersonatedUser, setImpersonatedUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);

    // 1. Monitor Firebase Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in, check if they are in our 'users' allowed list
                await checkUserAccess(firebaseUser.email);
            } else {
                // User is signed out
                setUser(null);
                setImpersonatedUser(null);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const checkUserAccess = async (email) => {
        try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                setUser({
                    uid: userDoc.id, // Firestore ID
                    authUid: auth.currentUser.uid,
                    email: email,
                    username: userData.username || email.split('@')[0], // Fallback
                    ...userData
                });
            } else {
                console.warn("User authenticated but not found in allowed users list:", email);
                // Optional: Force logout if strict, or let them stay 'logged in' but with no role (Guest)
                setUser(null);
                await firebaseSignOut(auth);
                alert("Access Denied: Your email is not on the allowed list. Please contact the administrator.");
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    };

    // 2. Monitor All Users (for Admin View)
    // 2. Monitor All Users (for Admin View)
    useEffect(() => {
        if (!user) {
            setAllUsers([]);
            return;
        }

        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Auth Actions
    const signIn = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, error: error.message };
        }
    };

    const signUp = async (email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // After signup, onAuthStateChanged will trigger and checkUserAccess will run
            return { success: true };
        } catch (error) {
            console.error("Signup error:", error);
            return { success: false, error: error.message };
        }
    };

    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            console.error("Password reset error:", error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        await firebaseSignOut(auth);
        setUser(null);
        setImpersonatedUser(null);
    };

    // Impersonation Logic
    const impersonate = (email) => {
        if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) return;

        if (email === user.email) {
            setImpersonatedUser(null);
        } else {
            const targetUser = allUsers.find(u => u.email === email);
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
            email: newUser.email, // Key identifier now
            name: newUser.name,
            role: newUser.role || 'user',
            color: newUser.color || randomColor,
            username: newUser.email.split('@')[0] // Fallback for display
        });
    };

    const updateUser = async (originalEmail, updates) => {
        // Find doc by email (since we passed email as ID in old code, but now we query)
        // Actually, we should pass the ID if possible, but finding by email is safe enough for migration
        const userToUpdate = allUsers.find(u => u.email === originalEmail);
        if (userToUpdate) {
            const userRef = doc(db, 'users', userToUpdate.id);
            await updateDoc(userRef, updates);

            // Update local state if it's me
            if (user && user.email === originalEmail) {
                setUser({ ...user, ...updates });
            }
        }
    };

    const deleteUser = async (emailToDelete) => {
        const userToDelete = allUsers.find(u => u.email === emailToDelete);
        if (userToDelete) {
            await deleteDoc(doc(db, 'users', userToDelete.id));
        }
    };

    // Derived State
    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            signIn,
            signUp,
            resetPassword,
            logout,
            allUsers,
            addUser,
            updateUser,
            deleteUser,
            loading,
            actingUser,
            impersonate,
            impersonatedUser
        }}>
            {!authLoading && children}
        </AuthContext.Provider>
    );
};
