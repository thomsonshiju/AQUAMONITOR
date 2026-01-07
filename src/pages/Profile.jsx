import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    const { user, updateUser, changePassword } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordDataChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            // Update profile info
            await updateUser(formData);

            // Update password if being changed
            if (isChangingPassword) {
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                    setError('Passwords do not match');
                    return;
                }
                if (passwordData.newPassword.length < 6) {
                    setError('Password must be at least 6 characters');
                    return;
                }

                const result = await changePassword(passwordData.newPassword);
                if (!result.success) {
                    setError(result.error);
                    return;
                }
                setIsChangingPassword(false);
                setPasswordData({ newPassword: '', confirmPassword: '' });
            }

            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError('Failed to update profile');
        }
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: window.innerWidth < 768 ? '1.5rem' : '1.875rem', marginBottom: '0.25rem' }}>Account Profile</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage your identification and security settings</p>
                </div>
            </div>

            <form onSubmit={handleSave}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : 'minmax(350px, 1fr) 1.2fr',
                    gap: '1.5rem',
                    alignItems: 'start'
                }}>

                    {/* Left Column: Personal Info */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.5rem',
                                fontWeight: 800
                            }}>
                                {formData.name.charAt(0)}
                            </div>
                            <div>
                                <h3 style={{ margin: 0 }}>{formData.name}</h3>
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>{user?.role === 'admin' ? 'Administrator' : 'System User'}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div>
                                <label className="label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <User size={16} /> Full Name
                                </label>
                                <input type="text" className="input-field" name="name" value={formData.name} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <Mail size={16} /> Email Address
                                </label>
                                <input type="email" className="input-field" name="email" value={formData.email} onChange={handleChange} disabled style={{ opacity: 0.7, background: 'var(--bg-body)' }} />
                            </div>

                            <div>
                                <label className="label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <Phone size={16} /> Phone Number
                                </label>
                                <input type="tel" className="input-field" name="phone" value={formData.phone} onChange={handleChange} placeholder="Update contact number" />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Security & Actions */}
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Security Settings</h3>
                                {!isChangingPassword && (
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                        onClick={() => setIsChangingPassword(true)}
                                    >
                                        <Lock size={16} /> Update Password
                                    </button>
                                )}
                            </div>

                            {isChangingPassword ? (
                                <div className="fade-in" style={{ display: 'grid', gap: '1.25rem', background: 'var(--bg-body)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700 }}>New Password</span>
                                        <button
                                            type="button"
                                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem' }}
                                            onClick={() => setIsChangingPassword(false)}
                                        >
                                            Cancel Update
                                        </button>
                                    </div>

                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            className="input-field"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordDataChange}
                                            placeholder="Min. 6 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                        >
                                            {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    <div>
                                        <label className="label" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Confirm New Password</label>
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            className="input-field"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordDataChange}
                                            placeholder="Repeat password"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ width: '100%', marginTop: '0.5rem', background: 'var(--primary)', height: '48px', fontSize: '1rem' }}
                                    >
                                        Confirm Password Update
                                    </button>
                                </div>
                            ) : (
                                <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-body)', borderRadius: '1rem', border: '1px dashed var(--border-color)' }}>
                                    <Lock size={32} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}> Password was last updated 3 months ago. We recommend regular updates.</p>
                                </div>
                            )}
                        </div>

                        {/* Status Messages & Save */}
                        <div className="card" style={{ background: (message || error) ? 'transparent' : 'var(--bg-card)', border: (message || error) ? 'none' : '1px solid var(--border-color)', boxShadow: (message || error) ? 'none' : 'var(--shadow-md)', padding: (message || error) ? 0 : '1.5rem' }}>
                            {message && (
                                <div className="fade-in" style={{
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    color: 'var(--success)',
                                    padding: '1rem',
                                    borderRadius: '1rem',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    border: '1px solid var(--success)'
                                }}>
                                    <Save size={20} /> <span style={{ fontWeight: 600 }}>{message}</span>
                                </div>
                            )}

                            {error && (
                                <div className="fade-in" style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: 'var(--danger)',
                                    padding: '1rem',
                                    borderRadius: '1rem',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    border: '1px solid var(--danger)'
                                }}>
                                    <AlertCircle size={20} /> <span style={{ fontWeight: 600 }}>{error}</span>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '56px', fontSize: '1.1rem', gap: '0.75rem' }}>
                                <Save size={22} /> Save Profile Changes
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
