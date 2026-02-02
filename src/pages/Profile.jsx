import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    const { user, updateUser, changePassword } = useAuth();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
        return () => window.removeEventListener('resize', handleResize);
    }, [user]);

    const validateField = (name, value) => {
        let error = '';
        if (name === 'name') {
            if (!value.trim()) error = 'Full name is required';
            else if (value.trim().length < 3) error = 'Name must be at least 3 characters';
        }
        if (name === 'phone') {
            if (value && !/^\d{10}$/.test(value)) error = 'Phone number must be 10 digits';
        }
        if (name === 'newPassword') {
            if (value.length > 0 && value.length < 6) error = 'Min. 6 characters';
        }
        if (name === 'confirmPassword') {
            if (value !== passwordData.newPassword) error = 'Passwords mismatch';
        }

        setFieldErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        validateField(name, value);
    };

    const handlePasswordDataChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });
        validateField(name, value);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setMessage('');

        const isNameValid = validateField('name', formData.name);
        const isPhoneValid = validateField('phone', formData.phone);
        let isPassValid = true;

        if (isChangingPassword) {
            isPassValid = validateField('newPassword', passwordData.newPassword) &&
                validateField('confirmPassword', passwordData.confirmPassword);
        }

        if (!isNameValid || !isPhoneValid || !isPassValid) {
            setError('Please correct errors');
            return;
        }

        setIsSubmitting(true);
        try {
            await updateUser({ name: formData.name.trim(), phone: formData.phone.trim() });
            if (isChangingPassword) {
                const result = await changePassword(passwordData.newPassword);
                if (!result.success) throw new Error(result.error);
                setIsChangingPassword(false);
                setPasswordData({ newPassword: '', confirmPassword: '' });
            }
            setMessage('Profile updated!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.message || 'Update failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fade-in" style={{ paddingBottom: isMobile ? '5rem' : '2rem' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                    Account Profile
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>
                    Manage your personal security and visual identity
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)',
                gap: isMobile ? '1.5rem' : '2.5rem',
                alignItems: 'start'
            }}>
                {/* Visual Identity Column */}
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 5', display: 'grid', gap: '2rem' }}>
                    <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3.5rem',
                            fontWeight: 950,
                            margin: '0 auto 2rem',
                            boxShadow: '0 20px 40px rgba(var(--primary-rgb), 0.3)',
                            border: '4px solid rgba(var(--bg-card-rgb), 0.5)'
                        }}>
                            {formData.name.charAt(0) || user?.email?.charAt(0)}
                        </div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>{formData.name}</h2>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 1rem',
                            borderRadius: '2rem',
                            background: 'rgba(var(--primary-rgb), 0.1)',
                            color: 'var(--primary)',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            textTransform: 'uppercase'
                        }}>
                            <ShieldCheck size={16} />
                            {user?.role || 'User'} Access
                        </div>
                    </div>

                    <div className="card" style={{ padding: '2rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem' }}>Security Overview</h3>
                        <div style={{ background: 'rgba(var(--bg-card-rgb), 0.3)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                            <Lock size={32} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                                Multi-layer encryption is protecting your session and data integrity.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Configuration Workstation */}
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 7', display: 'grid', gap: '2rem' }}>
                    <div className="card" style={{ padding: isMobile ? '1.5rem' : '2.5rem' }}>
                        <h3 style={{ margin: '0 0 2rem', fontSize: '1.3rem' }}>Information Central</h3>

                        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem', fontWeight: 800 }}>LEGAL FULL NAME</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        className="input-field"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        style={{ padding: '1rem 1rem 1rem 3.5rem', borderRadius: '1.25rem', fontSize: '1rem', border: fieldErrors.name ? '2px solid var(--danger)' : '' }}
                                    />
                                </div>
                                {fieldErrors.name && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>{fieldErrors.name}</div>}
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem', fontWeight: 800 }}>COMMUNICATION ENDPOINT</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="email" className="input-field" value={formData.email} disabled style={{ padding: '1rem 1rem 1rem 3.5rem', borderRadius: '1.25rem', opacity: 0.5, background: 'var(--bg-body)' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem', fontWeight: 800 }}>FIRMWARE PHONE LINK</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="tel"
                                        className="input-field"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        style={{ padding: '1rem 1rem 1rem 3.5rem', borderRadius: '1.25rem', fontSize: '1rem', border: fieldErrors.phone ? '2px solid var(--danger)' : '' }}
                                    />
                                </div>
                                {fieldErrors.phone && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>{fieldErrors.phone}</div>}
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <h4 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Password Management</h4>
                                {isChangingPassword ? (
                                    <div className="fade-in" style={{ display: 'grid', gap: '1rem' }}>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showPasswords ? "text" : "password"}
                                                className="input-field"
                                                name="newPassword"
                                                placeholder="Modern Password"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordDataChange}
                                                style={{ padding: '0.8rem 1.25rem', borderRadius: '1rem' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(!showPasswords)}
                                                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                            >
                                                {showPasswords ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            className="input-field"
                                            name="confirmPassword"
                                            placeholder="Validate Password"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordDataChange}
                                            style={{ padding: '0.8rem 1.25rem', borderRadius: '1rem' }}
                                        />
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: '1rem' }} onClick={() => setIsChangingPassword(false)}>Discard</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button type="button" className="btn btn-outline" style={{ width: '100%', borderRadius: '1.25rem', padding: '1rem' }} onClick={() => setIsChangingPassword(true)}>
                                        Initiate Password Rotation
                                    </button>
                                )}
                            </div>

                            <div style={{ marginTop: '2rem' }}>
                                {message && <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '1rem', marginBottom: '1rem', textAlign: 'center', fontWeight: 700 }}>{message}</div>}
                                {error && <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '1rem', marginBottom: '1rem', textAlign: 'center', fontWeight: 700 }}>{error}</div>}

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmitting}
                                    style={{ width: '100%', padding: '1.25rem', borderRadius: '1.5rem', fontSize: '1.1rem', fontWeight: 800, boxShadow: '0 10px 25px var(--primary-glow)' }}
                                >
                                    {isSubmitting ? 'Synchronizing Profile...' : 'Finalize & Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
