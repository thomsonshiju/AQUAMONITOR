import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Bell, Shield, Send, CheckCircle, Info, AlertCircle, AlertTriangle, Trash2, MessageCircle, Mail, Clock } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

function DigitalClock() {
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'rgba(var(--bg-card-rgb), 0.5)',
            padding: '0.6rem 1.25rem',
            borderRadius: '1.25rem',
            border: '1px solid var(--border-color)',
            backdropFilter: 'blur(10px)',
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '0.4rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Clock size={18} />
            </div>
            <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
                    {formatTime(time)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {formatDate(time)}
                </div>
            </div>
        </div>
    );
}


// Broadcast Notification Panel Component
function BroadcastNotificationPanel({
    users,
    notificationData,
    setNotificationData,
    selectedUserIds,
    setSelectedUserIds
}) {
    const [sending, setSending] = React.useState(false);
    const [successMessage, setSuccessMessage] = React.useState('');
    const [sendEmail, setSendEmail] = React.useState(false);

    const handleSendNotification = async (e) => {
        e.preventDefault();

        if (!notificationData.title || !notificationData.message) {
            alert('Please fill in both title and message');
            return;
        }

        if (notificationData.targetType === 'selected' && selectedUserIds.length === 0) {
            alert('Please select at least one user');
            return;
        }

        setSending(true);
        setSuccessMessage('');

        try {
            // Determine target users
            const targets = notificationData.targetType === 'selected'
                ? selectedUserIds
                : users.map(u => u.id);

            // Send to Firestore (create a notification doc for each user)
            const notificationsRef = collection(db, "notifications");

            const promises = targets.map(userId => {
                return addDoc(notificationsRef, {
                    userId: userId,
                    title: notificationData.title,
                    message: notificationData.message,
                    type: notificationData.type,
                    read: false,
                    createdAt: new Date()
                });
            });

            await Promise.all(promises);

            // Send Emails if selected
            if (sendEmail) {
                const targetUsers = users.filter(u => targets.includes(u.id));
                console.log(`Attempting to send emails to ${targetUsers.length} users`);

                const getTypeStyles = (type) => {
                    const themes = {
                        success: { color: '#10b981', label: 'SUCCESS', icon: '✅' },
                        warning: { color: '#f59e0b', label: 'WARNING', icon: '⚠️' },
                        error: { color: '#ef4444', label: 'CRITICAL', icon: '🚨' },
                        info: { color: '#0ea5e9', label: 'INFORMATION', icon: 'ℹ️' }
                    };
                    return themes[type] || themes.info;
                };

                const style = getTypeStyles(notificationData.type);

                let successCount = 0;
                let failCount = 0;
                let lastError = '';

                const emailPromises = targetUsers.map(async user => {
                    if (!user.email) {
                        console.warn(`User ${user.name} has no email, skipping.`);
                        return;
                    }
                    try {
                        console.log(`Sending email to ${user.email}...`);
                        const customApiUrl = import.meta.env.VITE_API_URL;

                        // If we are in production (HTTPS) but trying to hit localhost (HTTP), it will always fail.
                        // Throw a more informative error.
                        if (window.location.protocol === 'https:' && (!customApiUrl || customApiUrl.includes('localhost'))) {
                            throw new Error('Your frontend is on HTTPS but trying to contact a local HTTP backend (localhost). Please deploy your backend and set VITE_API_URL, or use the Firebase Function provided!');
                        }

                        const apiUrl = customApiUrl || 'https://aquamonitor-backend-bhdbbydhb5e9euan.eastasia-01.azurewebsites.net';
                        const response = await fetch(`${apiUrl}/api/send-email`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: user.email,
                                subject: `${style.icon} [${style.label}] ${notificationData.title}`,
                                html: `
                                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; color: #1e293b; background-color: #f8fafc; min-height: 100%;">
                                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                                        <!-- Decorative Header -->
                                        <div style="background: ${style.color}; height: 8px;"></div>
                                        
                                        <div style="padding: 32px;">
                                            <div style="display: flex; align-items: center; margin-bottom: 24px;">
                                                <span style="background: ${style.color}15; color: ${style.color}; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 800; letter-spacing: 0.05em; display: inline-block;">
                                                    ${style.label}
                                                </span>
                                            </div>
                                            
                                            <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.2;">
                                                ${notificationData.title}
                                            </h2>
                                            
                                            <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; border-left: 4px solid ${style.color};">
                                                <p style="font-size: 16px; line-height: 1.6; margin: 0; color: #334155;">
                                                    ${notificationData.message}
                                                </p>
                                            </div>
                                            
                                            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                                                <p style="font-size: 14px; color: #64748b; margin: 0;">
                                                    Best regards,<br>
                                                    <strong>AquaMonitor Systems</strong>
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                                            <p style="color: #94a3b8; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 0.02em;">
                                                This is a secure system broadcast. No action is required unless specified.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            `
                            })
                        });

                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            throw new Error(errorData.details || errorData.error || `Server Error: ${response.status}`);
                        }

                        console.log(`Email sent successfully to ${user.email}`);
                        successCount++;
                    } catch (err) {
                        console.error(`Failed to send email to ${user.email}:`, err);
                        lastError = err.message;
                        failCount++;
                    }
                });

                await Promise.all(emailPromises);

                if (failCount > 0) {
                    alert(`Email sending complete.\nSuccess: ${successCount}\nFailed: ${failCount}\n\nLast Error: ${lastError}`);
                }
            }

            setSuccessMessage(`✅ Notification sent to ${targets.length} user(s) successfully!`);

            // Reset form
            setNotificationData({
                title: '',
                message: '',
                type: 'info',
                targetType: 'all'
            });
            setSendEmail(false);
            setSelectedUserIds([]);

            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(''), 5000);

        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Error sending notification');
        } finally {
            setSending(false);
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const selectAllUsers = () => {
        setSelectedUserIds(users.map(u => u.id));
    };

    const deselectAllUsers = () => {
        setSelectedUserIds([]);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={18} />;
            case 'warning': return <AlertTriangle size={18} />;
            case 'error': return <AlertCircle size={18} />;
            default: return <Info size={18} />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'success': return '#2ecc71';
            case 'warning': return '#f39c12';
            case 'error': return '#e74c3c';
            default: return '#3498db';
        }
    };

    return (
        <form onSubmit={handleSendNotification} id="broadcast-panel">
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Success Message Banner */}
                {successMessage && (
                    <div style={{
                        padding: '1rem 1.25rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '1rem',
                        color: '#059669',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
                    }}>
                        <div style={{
                            background: '#10b981',
                            color: 'white',
                            borderRadius: '50%',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)'
                        }}>
                            <CheckCircle size={16} strokeWidth={3} />
                        </div>
                        {successMessage.replace('✅ ', '')}
                    </div>
                )}

                {/* Title Input */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Notification Title
                    </label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., System Maintenance Alert"
                        value={notificationData.title}
                        onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                        required
                    />
                </div>

                {/* Message Input */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Message
                    </label>
                    <textarea
                        className="input-field"
                        placeholder="Enter your message here..."
                        rows="4"
                        value={notificationData.message}
                        onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                        required
                        style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                </div>

                {/* Type Selection */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Notification Type
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                        {['info', 'success', 'warning', 'error'].map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setNotificationData({ ...notificationData, type })}
                                style={{
                                    padding: '0.75rem',
                                    border: `2px solid ${notificationData.type === type ? getTypeColor(type) : 'var(--border-color)'}`,
                                    background: notificationData.type === type ? `${getTypeColor(type)}15` : 'transparent',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 500,
                                    color: notificationData.type === type ? getTypeColor(type) : 'var(--text-secondary)',
                                    transition: 'all 0.2s ease',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {getTypeIcon(type)}
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Target Selection */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Send To
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => setNotificationData({ ...notificationData, targetType: 'all' })}
                            className={notificationData.targetType === 'all' ? 'btn btn-primary' : 'btn btn-outline'}
                            style={{ flex: 1 }}
                        >
                            All Users ({users.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setNotificationData({ ...notificationData, targetType: 'selected' })}
                            className={notificationData.targetType === 'selected' ? 'btn btn-primary' : 'btn btn-outline'}
                            style={{ flex: 1 }}
                        >
                            Selected Users ({selectedUserIds.length})
                        </button>
                    </div>

                    {/* User Selection */}
                    {notificationData.targetType === 'selected' && (
                        <div style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={selectAllUsers}
                                    className="btn btn-outline"
                                    style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
                                >
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    onClick={deselectAllUsers}
                                    className="btn btn-outline"
                                    style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
                                >
                                    Deselect All
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {users.map(user => (
                                    <label
                                        key={user.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem',
                                            background: selectedUserIds.includes(user.id) ? 'var(--primary-light)' : 'transparent',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUserIds.includes(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500 }}>{user.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                        </div>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '0.5rem',
                                            background: user.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                            color: user.role === 'admin' ? 'var(--secondary)' : 'var(--text-muted)',
                                            fontSize: '0.75rem',
                                            fontWeight: 500
                                        }}>
                                            {user.role}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview */}
                {(notificationData.title || notificationData.message) && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Preview
                        </label>
                        <div style={{
                            padding: '1rem',
                            background: 'var(--bg-body)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${getTypeColor(notificationData.type)}, ${getTypeColor(notificationData.type)}dd)`,
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {getTypeIcon(notificationData.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                        {notificationData.title || 'Notification Title'}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        {notificationData.message || 'Your message will appear here...'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                        Just now
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                )}

                {/* Email Option */}
                <div>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: 'var(--bg-body)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        border: sendEmail ? '1px solid var(--primary)' : '1px solid var(--border-color)'
                    }}>
                        <input
                            type="checkbox"
                            checked={sendEmail}
                            onChange={(e) => setSendEmail(e.target.checked)}
                            style={{ width: '1.2rem', height: '1.2rem' }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={18} color={sendEmail ? 'var(--primary)' : 'var(--text-muted)'} />
                            <span style={{ fontWeight: 500 }}>Send as Email</span>
                        </div>
                    </label>
                </div>

                {/* Send Button */}
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sending}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.875rem 1.5rem',
                        fontSize: '1rem',
                        opacity: sending ? 0.6 : 1
                    }}
                >
                    <Send size={20} />
                    {sending ? 'Sending...' : `Send Notification${notificationData.targetType === 'all' ? ' to All Users' : ` to ${selectedUserIds.length} User(s)`}`}
                </button>
            </div>
        </form >
    );
}

export default function Admin() {
    const [showAddModal, setShowAddModal] = React.useState(false);
    const { user, allUsers, addUser, deleteUser } = useAuth();
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper to open modal with specific role pre-selected
    const openAddModal = (role = 'user') => {
        setNewUserFormatted(prev => ({ ...prev, role }));
        setShowAddModal(true);
    };

    // Broadcast State (Lifted)
    const [notificationData, setNotificationData] = React.useState({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all' // 'all' or 'selected'
    });
    const [selectedUserIds, setSelectedUserIds] = React.useState([]);

    // Pagination State (Regular Users)
    const [currentPage, setCurrentPage] = React.useState(1);
    const [entriesPerPage] = React.useState(3);

    // Pagination State (Admins)
    const [adminPage, setAdminPage] = React.useState(1);
    const [adminsPerPage] = React.useState(1);

    // Use real users from context
    const users = allUsers;

    // Pagination Logic
    const indexOfLastUser = currentPage * entriesPerPage;
    const indexOfFirstUser = indexOfLastUser - entriesPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(users.length / entriesPerPage);

    const [newUserFormatted, setNewUserFormatted] = React.useState({
        name: '', email: '', phone: '', password: '', role: 'user'
    });
    const [newUserErrors, setNewUserErrors] = React.useState({});

    const validateNewUserField = (name, value) => {
        let error = '';
        if (name === 'phone' && value) {
            if (!/^[6-9]\d{9}$/.test(value)) {
                error = 'Invalid 10-digit number (starts with 6-9)';
            } else if (/(\d)\1{5,}/.test(value)) {
                error = 'Too many repeating digits';
            } else if (allUsers.some(u => u.phone === value)) {
                error = 'Phone number already in use';
            }
        }
        if (name === 'name' && !value.trim()) {
            error = 'Name is required';
        }
        if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = 'Invalid email address';
        }

        setNewUserErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    };

    const handleNewUserChange = (name, value) => {
        setNewUserFormatted(prev => ({ ...prev, [name]: value }));
        validateNewUserField(name, value);
    };

    const handleAddUser = async (e) => {
        e.preventDefault();

        // Final check before submission
        const isNameValid = validateNewUserField('name', newUserFormatted.name);
        const isEmailValid = validateNewUserField('email', newUserFormatted.email);
        const isPhoneValid = validateNewUserField('phone', newUserFormatted.phone);

        if (!isNameValid || !isEmailValid || !isPhoneValid || Object.values(newUserErrors).some(err => err)) {
            alert("Please fix the validation errors before submitting.");
            return;
        }

        const res = await addUser(newUserFormatted);
        if (res.success) {
            setShowAddModal(false);
            setNewUserFormatted({ name: '', email: '', phone: '', password: '', role: 'user' });
            setNewUserErrors({});
            alert("User added successfully!");
        } else {
            alert("Failed to add user: " + res.error);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
            const res = await deleteUser(userId);
            if (res.success) {
                alert("User deleted successfully!");
            } else {
                alert("Failed to delete user: " + (res.error || 'Unknown error'));
            }
        }
    };

    // Handler for messaging a specific user
    const handleMessageUser = (userId) => {
        setNotificationData(prev => ({ ...prev, targetType: 'selected' }));
        setSelectedUserIds([userId]);
        const panel = document.getElementById('broadcast-panel');
        if (panel) {
            panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const titleInput = panel.querySelector('input[type="text"]');
            if (titleInput) titleInput.focus();
        }
    };

    return (
        <div className="fade-in" style={{ paddingBottom: isMobile ? '4rem' : '2rem' }}>
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255, 255, 255, 0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, backdropFilter: 'blur(8px)',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div className="card" style={{
                        width: isMobile ? '90%' : '450px',
                        padding: '2.5rem',
                        borderRadius: '2rem',
                        background: '#ffffff',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                            {newUserFormatted.role === 'admin' ? 'Create New Administrator' : 'Create New System User'}
                        </h3>
                        <form onSubmit={handleAddUser} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Name</label>
                                <input className="input-field" required
                                    value={newUserFormatted.name}
                                    onChange={e => handleNewUserChange('name', e.target.value)}
                                    style={{ border: newUserErrors.name ? '2px solid var(--danger)' : '' }}
                                />
                                {newUserErrors.name && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{newUserErrors.name}</div>}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Email</label>
                                <input className="input-field" type="email" required
                                    value={newUserFormatted.email}
                                    onChange={e => handleNewUserChange('email', e.target.value)}
                                    style={{ border: newUserErrors.email ? '2px solid var(--danger)' : '' }}
                                />
                                {newUserErrors.email && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{newUserErrors.email}</div>}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Phone (Optional)</label>
                                <input className="input-field" type="tel"
                                    placeholder="10 digit number"
                                    maxLength="10"
                                    onKeyPress={(e) => {
                                        if (!/[0-9]/.test(e.key)) e.preventDefault();
                                    }}
                                    value={newUserFormatted.phone}
                                    onChange={e => handleNewUserChange('phone', e.target.value)}
                                    style={{ border: newUserErrors.phone ? '2px solid var(--danger)' : '' }}
                                />
                                {newUserErrors.phone && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{newUserErrors.phone}</div>}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Password</label>
                                <input className="input-field" type="password" required
                                    value={newUserFormatted.password}
                                    onChange={e => handleNewUserChange('password', e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                    Create {newUserFormatted.role === 'admin' ? 'Admin' : 'User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.875rem', marginBottom: '0.25rem' }}>Admin Console</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>System orchestration and user management</p>
                </div>
                <DigitalClock />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr',
                gap: '1.5rem',
                alignItems: 'stretch'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
                    {/* Admin Profile Summary */}
                    <div className="card" style={{
                        background: 'rgba(var(--bg-card-rgb), 0.5)',
                        borderColor: 'var(--secondary)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '1rem',
                                    background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                    color: 'white', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem'
                                }}>
                                    {user?.name?.charAt(0)}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.email}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)', fontWeight: 700, fontSize: '0.8rem' }}>
                                    <Shield size={14} /> ADMIN
                                </div>
                                <div style={{ color: 'var(--success)', fontSize: '0.75rem', fontWeight: 500 }}>Session Live</div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Users Table */}
                    <div className="card" style={{
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'rgba(var(--bg-card-rgb), 0.6)',
                        borderLeft: '4px solid #f59e0b' // Vibrant Amber instead of black
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, fontSize: '1.1rem' }}>
                                <Shield size={20} color="#f59e0b" /> Administrator Management
                            </h3>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                    {users.filter(u => u.role === 'admin').length} Admins
                                </span>
                                <button className="btn btn-primary" onClick={() => openAddModal('admin')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '0.75rem', background: '#f59e0b' }}>
                                    Add Admin
                                </button>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto', margin: '0 -1.25rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(var(--bg-card-rgb), 0.2)' }}>
                                        <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Admin</th>
                                        <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role</th>
                                        <th style={{ padding: '1rem 1.25rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => u.role === 'admin')
                                        .slice((adminPage - 1) * adminsPerPage, adminPage * adminsPerPage)
                                        .map((u) => (
                                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}>
                                                <td style={{ padding: '1rem 1.25rem' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{u.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                                </td>
                                                <td style={{ padding: '1rem 1.25rem' }}>
                                                    <span style={{
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '0.5rem',
                                                        background: 'rgba(99, 102, 241, 0.1)',
                                                        color: 'var(--secondary)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                        <button className="btn btn-outline" onClick={() => handleMessageUser(u.id)} style={{ padding: '0.4rem', borderRadius: '0.75rem' }}>
                                                            <MessageCircle size={16} />
                                                        </button>
                                                        <button className="btn btn-outline" onClick={() => handleDeleteUser(u.id, u.name)} style={{ padding: '0.4rem', borderRadius: '0.75rem', color: 'var(--danger)' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination for Admins */}
                        {users.filter(u => u.role === 'admin').length > adminsPerPage && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {adminPage} of {Math.ceil(users.filter(u => u.role === 'admin').length / adminsPerPage)}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        disabled={adminPage === 1}
                                        onClick={() => setAdminPage(p => p - 1)}
                                        className="btn btn-outline"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                    >Prev</button>
                                    <button
                                        disabled={adminPage === Math.ceil(users.filter(u => u.role === 'admin').length / adminsPerPage)}
                                        onClick={() => setAdminPage(p => p + 1)}
                                        className="btn btn-outline"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                    >Next</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Regular Users Table */}
                    <div className="card" style={{
                        flex: 1,
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: isMobile ? '500px' : 'auto',
                        borderLeft: '4px solid var(--primary)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, fontSize: '1.1rem' }}>
                                <Users size={20} color="var(--primary)" /> System User Management
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                    {users.filter(u => u.role !== 'admin').length} Users
                                </span>
                                <button className="btn btn-primary" onClick={() => openAddModal('user')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '1rem' }}>
                                    Add New User
                                </button>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto', margin: '0 -1.25rem', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(var(--bg-card-rgb), 0.2)' }}>
                                        <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User</th>
                                        <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '1rem 1.25rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => u.role !== 'admin').slice(indexOfFirstUser, indexOfLastUser).map((u) => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}>
                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '0.5rem',
                                                    background: 'rgba(148, 163, 184, 0.1)',
                                                    color: 'var(--text-muted)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-outline" onClick={() => handleMessageUser(u.id)} style={{ padding: '0.4rem', borderRadius: '0.75rem' }}>
                                                        <MessageCircle size={16} />
                                                    </button>
                                                    <button className="btn btn-outline" onClick={() => handleDeleteUser(u.id, u.name)} style={{ padding: '0.4rem', borderRadius: '0.75rem', color: 'var(--danger)' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination for regular users */}
                        {users.filter(u => u.role !== 'admin').length > entriesPerPage && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {currentPage} of {Math.ceil(users.filter(u => u.role !== 'admin').length / entriesPerPage)}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="btn btn-outline"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                    >Prev</button>
                                    <button
                                        disabled={currentPage === Math.ceil(users.filter(u => u.role !== 'admin').length / entriesPerPage)}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="btn btn-outline"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                    >Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Broadcast Column */}
                <div className="card" style={{
                    position: isMobile ? 'static' : 'sticky',
                    top: '5rem',
                    height: '100%',
                    minHeight: isMobile ? '600px' : 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem' }}>
                        <Bell size={20} /> System Broadcast
                    </h3>
                    <BroadcastNotificationPanel
                        users={users}
                        notificationData={notificationData}
                        setNotificationData={setNotificationData}
                        selectedUserIds={selectedUserIds}
                        setSelectedUserIds={setSelectedUserIds}
                    />
                </div>
            </div>
        </div>
    );
}
