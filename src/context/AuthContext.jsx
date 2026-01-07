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

        console.log("AuthContext: Starting sync for", currentUser.email);

        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userDocRef);

            let role = 'user';
            // Hardcoded admin check
            if (currentUser.email === 'admin@aquamonitor.com' || currentUser.email === 'thomsonshiju@gmail.com') {
                role = 'admin';
            }

            let userData;
            if (userSnap.exists()) {
                userData = userSnap.data();
                console.log("AuthContext: Found existing Firestore doc", userData);
                // Ensure specified emails always have admin role
                if ((currentUser.email === 'admin@aquamonitor.com' || currentUser.email === 'thomsonshiju@gmail.com') && userData.role !== 'admin') {
                    console.log("AuthContext: Elevating to admin...");
                    await updateDoc(userDocRef, { role: 'admin' });
                    userData.role = 'admin';
                }
            } else {
                console.log("AuthContext: No Firestore doc found, creating one...");
                userData = {
                    email: currentUser.email,
                    name: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
                    photoURL: '', // Do not take Gmail profile image
                    role: role,
                    createdAt: new Date()
                };
                try {
                    await setDoc(userDocRef, userData);
                    console.log("AuthContext: Created new Firestore user record");
                } catch (writeErr) {
                    console.error("AuthContext: Firestore write FAILED. Check rules.", writeErr);
                    throw writeErr;
                }
            }

            const serializableUser = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: '', // Explicitly clear to avoid taking Gmail image
                emailVerified: currentUser.emailVerified,
                ...userData
            };

            console.log("AuthContext: Sync success, role is:", serializableUser.role);
            setUser(serializableUser);
            return serializableUser;
        } catch (error) {
            console.error("AuthContext: Sync error", error);
            const basicUser = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                role: 'user'
            };
            setUser(basicUser);
            return basicUser;
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
                console.log("START GOOGLE LOGIN");
                const result = await signInWithPopup(auth, googleProvider);
                console.log("SUCCESS:", result.user.email);
                await syncUser(result.user);
                return true;
            }
            else {
                try {
                    const result = await signInWithEmailAndPassword(auth, emailOrData, password);
                    await syncUser(result.user);
                    return true;
                } catch (signInError) {
                    console.log("ERROR:", signInError.code, signInError.message);
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
            console.log("ERROR:", error.code, error.message);
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
            console.log("AuthContext: Admin adding new user to BOTH Auth and Firestore", userData.email);

            // 1. Create the user in Firebase Authentication
            // Note: Normal createUserWithEmailAndPassword signs the current user out.
            // We use a secondary Firebase app instance to avoid this.
            const { initializeApp, deleteApp, getApp } = await import('firebase/app');
            const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');

            let secondaryApp;
            try {
                secondaryApp = initializeApp(auth.app.options, "SecondaryAdminApp");
            } catch (err) {
                secondaryApp = getApp("SecondaryAdminApp");
            }

            const secondaryAuth = getAuth(secondaryApp);

            try {
                const userCredential = await createUserWithEmailAndPassword(
                    secondaryAuth,
                    userData.email,
                    userData.password || "DefaultPassword123!" // Ensure a password exists
                );

                const newUid = userCredential.user.uid;
                console.log("AuthContext: Auth account created successfully", newUid);

                // 2. Create the Firestore profile
                const firestoreData = {
                    email: userData.email,
                    name: userData.name,
                    phone: userData.phone || '',
                    role: userData.role || 'user',
                    createdAt: new Date()
                };

                await setDoc(doc(db, "users", newUid), firestoreData);
                console.log("AuthContext: Firestore profile created successfully");

                // Clean up secondary app to avoid memory leaks/conflicts
                await deleteApp(secondaryApp);

                return { success: true };
            } catch (authError) {
                console.error("AuthContext: Error creating Auth account", authError);
                return { success: false, error: authError.message };
            }
        } catch (error) {
            console.error("Add user error:", error);
            return { success: false, error: error.message };
        }
    };

    const deleteUser = async (userId) => {
        try {
            console.log("AuthContext: Deleting user profile from Firestore", userId);
            // Note: Deleting from Auth usually requires Admin SDK/Cloud Functions.
            // We'll delete the Firestore record which hides them from the app.
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
