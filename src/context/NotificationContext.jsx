import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, getDocs, serverTimestamp } from 'firebase/firestore';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Listen to Notifications in real-time
    useEffect(() => {
        if (!user || !user.uid) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        setLoading(true);
        const notificationsRef = collection(db, "notifications");
        // We want notifications for this user, ordered by creation time
        // Note: Composite index might be required for complex queries (userId + createdAt)
        // For now, let's just query by userId and sort in memory if needed or use simple query
        const q = query(
            notificationsRef,
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
            }));

            // Client-side sorting because Firestore needs index for ordering with filter
            notifs.sort((a, b) => b.createdAt - a.createdAt);

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
            setLoading(false);
        }, (error) => {
            console.error("Notification listener error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            const notifRef = doc(db, "notifications", notificationId);
            await updateDoc(notifRef, { read: true });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        if (!user?.uid) return;

        try {
            const batch = writeBatch(db);
            notifications.forEach(n => {
                if (!n.read) {
                    const ref = doc(db, "notifications", n.id);
                    batch.update(ref, { read: true });
                }
            });
            await batch.commit();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        try {
            await deleteDoc(doc(db, "notifications", notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Delete all notifications
    const deleteAllNotifications = async () => {
        if (!user?.uid) return;

        try {
            const batch = writeBatch(db);
            notifications.forEach(n => {
                const ref = doc(db, "notifications", n.id);
                batch.delete(ref);
            });
            await batch.commit();
        } catch (error) {
            console.error('Error deleting all notifications:', error);
        }
    };

    // Create notification (for local testing mostly, or simulating system alerts)
    const createNotification = async (title, message, type = 'info') => {
        if (!user?.uid) return;

        try {
            await addDoc(collection(db, "notifications"), {
                userId: user.uid,
                title,
                message,
                type,
                read: false,
                createdAt: serverTimestamp() // Use server timestamp
            });
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    };

    const value = {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        createNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
