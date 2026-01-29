import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../firebaseConfig';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, updatePassword as firebaseUpdatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper to sync user data with Firestore
    const syncUser = async (currentUser) => {
        if (!currentUser) return null;

        // 1. Calculate the base role immediately based on email
        let determinedRole = 'user';
        if (currentUser.email === 'admin@aquamonitor.com' ||
            currentUser.email === 'thomsonshiju@gmail.com' ||
            currentUser.email === 'manager@aquamonitor.com') {
            determinedRole = 'admin';
        }

        console.log("AuthContext: Starting sync for", currentUser.email, "Expected role:", determinedRole);

        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userDocRef);

            let userData;
            if (userSnap.exists()) {
                userData = userSnap.data();
                console.log("AuthContext: Found matching Firestore record for", currentUser.email);

                // Keep Admin status synchronized
                if (determinedRole === 'admin' && userData.role !== 'admin') {
                    console.log("AuthContext: Correcting record to Admin role...");
                    await updateDoc(userDocRef, { role: 'admin' });
                    userData.role = 'admin';
                }
            } else {
                console.log("AuthContext: No Firestore record found, creating NEW record for", currentUser.email);
                userData = {
                    email: currentUser.email,
                    name: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
                    photoURL: currentUser.photoURL || '',
                    role: determinedRole,
                    createdAt: serverTimestamp() // Use Firestore Server Timestamp
                };

                try {
                    await setDoc(userDocRef, userData);
                    console.log("AuthContext: Created new Firestore user record");
                } catch (writeError) {
                    console.error("AuthContext: Firestore write FAILED.", writeError);
                    if (writeError.code === 'permission-denied') {
                        alert("Firebase Permission Error: Your Security Rules are blocking user creation. Please allow 'write' access to the 'users' collection in the Firebase Console.");
                    }
                    throw writeError;
                }
            }

            const serializableUser = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL || '',
                emailVerified: currentUser.emailVerified,
                ...userData,
                role: userData?.role || determinedRole
            };

            setUser(serializableUser);
            return serializableUser;
        } catch (error) {
            console.error("AuthContext: General sync error", error);
            const fallbackUser = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                role: determinedRole
            };
            setUser(fallbackUser);
            return fallbackUser;
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

    // Load all users from Firestore (Only for Admin)
    useEffect(() => {
        // Only load strict "all users" list if user is admin
        // This prevents regular users from loading all users and avoids conflict errors during self-updates
        if (!user || user.role?.toLowerCase() !== 'admin') {
            setAllUsers([]);
            return;
        }

        const usersCollection = collection(db, "users");
        console.log("AuthContext: Starting user list listener...");

        // Real-time listener for users collection
        const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
            console.log(`AuthContext: Received user list snapshot. Count: ${snapshot.docs.length}`);
            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAllUsers(usersList);
        }, (error) => {
            console.error("AuthContext: Users list listener error:", error);
            if (error.code === 'permission-denied') {
                alert("ACCESS DENIED: Your Firebase account does not have permission to read the User List. \n\nTo fix this:\n1. Go to Firebase Console > Firestore > Rules\n2. Ensure admins can read the 'users' collection.");
            }
        });

        return () => unsubscribe();
    }, [user?.uid, user?.role]);

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
                    if ((emailOrData === 'admin@aquamonitor.com' && password === 'admin123') ||
                        (emailOrData === 'manager@aquamonitor.com' && password === 'manager123')) {
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
        if (!user || !user.uid) return { success: false, error: 'No user' };

        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, data);

            // Update local state immediately
            setUser(prev => ({ ...prev, ...data }));
            return { success: true };
        } catch (error) {
            console.error("Update error:", error);
            return { success: false, error: error.message };
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
            console.log("AuthContext: Deleting user profile and data from Firestore", userId);

            const batch = writeBatch(db);

            // 1. Delete user's notifications
            const notificationsRef = collection(db, "notifications");
            const q = query(notificationsRef, where("userId", "==", userId));
            const snapshot = await getDocs(q);

            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // 2. Delete user profile
            const userRef = doc(db, "users", userId);
            batch.delete(userRef);

            // Commit both operations
            await batch.commit();

            return { success: true };
        } catch (error) {
            console.error("Delete user error:", error);
            return { success: false, error: error.message };
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
