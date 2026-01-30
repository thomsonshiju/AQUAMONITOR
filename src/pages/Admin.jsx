import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Bell, Shield, Send, CheckCircle, Info, AlertCircle, AlertTriangle, Trash2, MessageCircle, Mail } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

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
                        const response = await fetch('http://localhost:3000/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: user.email,
                                subject: notificationData.title,
                                html: `
                                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                    <h2 style="color: #0ea5e9;">AquaMonitor Notification</h2>
                                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                                        <h3 style="margin-top: 0;">${notificationData.title}</h3>
                                        <p style="font-size: 16px; line-height: 1.5;">${notificationData.message}</p>
                                    </div>
                                    <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
                                        You received this email because you are a user of AquaMonitor.
                                    </p>
                                </div>
                            `
                            })
                        });

                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            // Try to parse JSON, fallback if response is not JSON
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
                    alert(`Email sending complete.\nSuccess: ${successCount}\nFailed: ${failCount}\n\nLast Error: ${lastError}\n\nMake sure the backend server is running on port 3000 and email credentials are correct.`);
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
                {/* Success Message */}
                {successMessage && (
                    <div style={{
                        padding: '1rem',
                        background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.05))',
                        border: '1px solid rgba(46, 204, 113, 0.3)',
                        borderRadius: '0.5rem',
                        color: '#27ae60',
                        fontWeight: 500
                    }}>
                        {successMessage}
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

    // Broadcast State (Lifted)
    const [notificationData, setNotificationData] = React.useState({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all' // 'all' or 'selected'
    });
    const [selectedUserIds, setSelectedUserIds] = React.useState([]);

    // Pagination State
    const [currentPage, setCurrentPage] = React.useState(1);
    const [entriesPerPage] = React.useState(5);

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

    const handleAddUser = async (e) => {
        e.preventDefault();
        const res = await addUser(newUserFormatted);
        if (res.success) {
            setShowAddModal(false);
            setNewUserFormatted({ name: '', email: '', phone: '', password: '', role: 'user' });
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
        // Set target type to selected and select the specific user
        setNotificationData(prev => ({ ...prev, targetType: 'selected' }));
        setSelectedUserIds([userId]);

        // Scroll to broadcast panel
        const panel = document.getElementById('broadcast-panel');
        if (panel) {
            panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Focus on title input if possible, or just visual focus
            const titleInput = panel.querySelector('input[type="text"]');
            if (titleInput) titleInput.focus();
        }
    };

    return (
        <div className="fade-in">
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 200, backdropFilter: 'blur(4px)'
                }}>
                    <div className="card" style={{ width: '400px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Add New User</h3>
                        <form onSubmit={handleAddUser}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name</label>
                                <input className="input-field" required
                                    value={newUserFormatted.name}
                                    onChange={e => setNewUserFormatted({ ...newUserFormatted, name: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                                <input className="input-field" type="email" required
                                    value={newUserFormatted.email}
                                    onChange={e => setNewUserFormatted({ ...newUserFormatted, email: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Phone</label>
                                <input className="input-field" type="tel"
                                    value={newUserFormatted.phone}
                                    onChange={e => setNewUserFormatted({ ...newUserFormatted, phone: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                                <input className="input-field" type="password" required
                                    value={newUserFormatted.password}
                                    onChange={e => setNewUserFormatted({ ...newUserFormatted, password: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Role</label>
                                <select className="input-field"
                                    value={newUserFormatted.role}
                                    onChange={e => setNewUserFormatted({ ...newUserFormatted, role: e.target.value })}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.875rem' }}>Admin Panel</h2>
                <p style={{ color: 'var(--text-muted)' }}>Authorized personnel only</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr',
                gap: '2rem',
                alignItems: 'stretch' // Ensure columns have equal height
            }}>
                {/* Left Column: Session and Management */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Admin Login Info */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card), rgba(99, 102, 241, 0.05))', borderColor: 'var(--secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{user?.name}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.email}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
                                    <Shield size={16} /> Administrator
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Active Session</div>
                            </div>
                        </div>
                    </div>

                    {/* User Management */}
                    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <Users size={20} /> User Management
                            </h3>
                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>+ Add User</button>
                        </div>

                        <div style={{ overflowX: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '1rem', fontWeight: 600 }}>Name</th>
                                        <th style={{ padding: '1rem', fontWeight: 600 }}>Email</th>
                                        <th style={{ padding: '1rem', fontWeight: 600 }}>Phone</th>
                                        <th style={{ padding: '1rem', fontWeight: 600 }}>Role</th>
                                        <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentUsers.map((user) => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '1rem' }}>{user.name}</td>
                                            <td style={{ padding: '1rem' }}>{user.email}</td>
                                            <td style={{ padding: '1rem' }}>{user.phone || '-'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '1rem',
                                                    background: user.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                                    color: user.role === 'admin' ? 'var(--secondary)' : 'var(--text-muted)',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn btn-outline"
                                                        onClick={() => handleMessageUser(user.id)}
                                                        style={{
                                                            padding: '0.5rem',
                                                            color: 'var(--secondary)',
                                                            borderColor: 'var(--secondary)'
                                                        }}
                                                        title="Message User"
                                                    >
                                                        <MessageCircle size={16} />
                                                    </button>
                                                    <button
                                                        className="btn btn-outline"
                                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                                        style={{
                                                            padding: '0.5rem',
                                                            color: '#e74c3c',
                                                            borderColor: '#e74c3c'
                                                        }}
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {users.length > entriesPerPage && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                >
                                    Previous
                                </button>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    Page <strong>{currentPage}</strong> of {totalPages}
                                </span>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Actions */}
                <div style={{ display: 'grid', gap: '2rem' }}>
                    <div className="card" style={{ height: '100%' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Bell size={20} /> Broadcast
                        </h3>
                        {/* Render panel with props */}
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
        </div>
    );
}
