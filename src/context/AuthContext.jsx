import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../firebaseConfig';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, updatePassword as firebaseUpdatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, getDocs } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper to sync user data with Firestore
    const syncUser = async (currentUser) => {
        if (!currentUser) return null;

        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userDocRef);

            let role = 'user';
            if (currentUser.email === 'admin@aquamonitor.com') {
                role = 'admin';
            }

            let userData;
            if (userSnap.exists()) {
                userData = userSnap.data();
                if (currentUser.email === 'admin@aquamonitor.com' && userData.role !== 'admin') {
                    await updateDoc(userDocRef, { role: 'admin' });
                    userData.role = 'admin';
                }
            } else {
                userData = {
                    email: currentUser.email,
                    name: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
                    photoURL: currentUser.photoURL || '',
                    role: role,
                    createdAt: new Date()
                };
                await setDoc(userDocRef, userData);
            }

            const fullUser = { ...currentUser, ...userData };
            setUser(fullUser);
            return fullUser;
        } catch (error) {
            console.error("Error syncing user:", error);
            // Fallback to basic auth user info if firestore fails
            setUser(currentUser);
            return currentUser;
        }
    };

    // Listen to Firebase Auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    await syncUser(currentUser);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Auth state change error:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Load all users from Firestore (for Admin)
    useEffect(() => {
        if (!user) {
            setAllUsers([]);
            return;
        }

        const usersCollection = collection(db, "users");

        // Real-time listener for users collection
        const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAllUsers(usersList);
        }, (error) => {
            console.error("Users list listener error:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const login = async (emailOrData, password) => {
        try {
            if (emailOrData === 'google-auth-trigger') {
                const result = await signInWithPopup(auth, googleProvider);
                await syncUser(result.user);
                return true;
            }
            else {
                try {
                    const result = await signInWithEmailAndPassword(auth, emailOrData, password);
                    await syncUser(result.user);
                    return true;
                } catch (signInError) {
                    if (emailOrData === 'admin@aquamonitor.com' && password === 'admin123') {
                        try {
                            const userCredential = await createUserWithEmailAndPassword(auth, emailOrData, password);
                            const userData = {
                                name: 'Admin',
                                email: emailOrData,
                                role: 'admin',
                                createdAt: new Date()
                            };
                            await setDoc(doc(db, "users", userCredential.user.uid), userData);
                            setUser({ ...userCredential.user, ...userData });
                            return true;
                        } catch (createError) {
                            console.error("Failed to auto-create admin:", createError);
                            return false;
                        }
                    }
                    throw signInError;
                }
            }
        } catch (error) {
            console.error("Login error:", error);
            return false;
        }
    };

    const signup = async (email, password, name) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userData = {
                name: name,
                email: email,
                role: 'user',
                createdAt: new Date()
            };

            // Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), userData);

            // Explicitly set user state to avoid race condition on navigate
            setUser({ ...user, ...userData });

            return true;
        } catch (error) {
            console.error("Signup error:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const updateUser = async (data) => {
        if (!user || !user.uid) return;

        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, data);

            // Update local state immediately
            setUser(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    const addUser = async (userData) => {
        try {
            // Note: Creating a user in Auth via secondary app is complex client-side.
            // For simple admin dashboard, we might just add to Firestore or need a cloud function.
            // Here we just add to Firestore for record keeping if that's the intention,
            // but they won't have Auth login credentials unless created via Auth API.
            // For valid Auth, typically Admin SDK is used.
            // Simulating 'adding' by just creating a doc for now.

            // Generate a placeholder ID or use email as ID if desired
            await setDoc(doc(collection(db, "users")), {
                ...userData,
                createdAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error("Add user error:", error);
            return { success: false, error: error.message };
        }
    };

    const deleteUser = async (userId) => {
        try {
            await deleteDoc(doc(db, "users", userId));
            return { success: true };
        } catch (error) {
            console.error("Delete user error:", error);
            return { success: false, error: "Network error" };
        }
    };

    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            console.error("Reset password error:", error);
            return { success: false, error: error.message };
        }
    };

    const changePassword = async (newPassword) => {
        try {
            await firebaseUpdatePassword(auth.currentUser, newPassword);
            return { success: true };
        } catch (error) {
            console.error("Change password error:", error);
            return { success: false, error: error.message };
        }
    };

    return (
        <AuthContext.Provider value={{ user, allUsers, login, signup, logout, resetPassword, updateUser, changePassword, addUser, deleteUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
export const useAuth = () => useContext(AuthContext);
