import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Auth({ mode = 'login' }) {
    const [isLogin, setIsLogin] = useState(mode === 'login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // SignUp specific state
    const [formData, setFormData] = useState({
        name: '',
        confirmPassword: ''
    });
    const [isAdminFill, setIsAdminFill] = useState(false);

    const { login, signup, resetPassword, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Update flip state if URL changes
    useEffect(() => {
        setIsLogin(location.pathname === '/login');
        setError('');
    }, [location.pathname]);

    // Handle redirection once user is authenticated
    useEffect(() => {
        if (user) {
            if (user.role?.toLowerCase() === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [user, navigate]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const success = await login(email, password);
            if (!success) {
                setError('Invalid credentials. Please try again.');
                setLoading(false);
            }
        } catch (err) {
            setError('Login failed due to server error.');
            setLoading(false);
        }
    };

    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await signup(email, password, formData.name);
        } catch (err) {
            setError(err.message || 'Failed to create account.');
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        try {
            setError('');
            setLoading(true);
            const success = await login('google-auth-trigger');
            if (!success) {
                setError('Google Auth failed to sync with database.');
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            setError('Google Auth failed');
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address to reset password.');
            return;
        }
        try {
            setLoading(true);
            const res = await resetPassword(email);
            setLoading(false);
            if (res.success) {
                alert('Password reset link has been sent to your email.');
            } else {
                setError(res.error || 'Failed to send reset email.');
            }
        } catch (err) {
            setLoading(false);
            setError('An error occurred.');
        }
    };

    const toggleMode = (e, targetLogin) => {
        e.preventDefault();
        setIsLogin(targetLogin);
        navigate(targetLogin ? '/login' : '/signup', { replace: true });
    };

    const handleAdminToggle = (e) => {
        const checked = e.target.checked;
        setIsAdminFill(checked);
        if (checked) {
            setEmail('manager@aquamonitor.com');
            setPassword('manager123');
        } else {
            setEmail('');
            setPassword('');
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card-container">
                <div className={`auth-card-inner ${!isLogin ? 'flipped' : ''}`}>

                    {/* LOGIN FRONT SIDE */}
                    <div className="auth-card-front">
                        <div className="auth-glass-panel">
                            {/* Header */}
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <img
                                    src="/logo-dashboard.png"
                                    alt="AquaMonitor Logo"
                                    style={{
                                        width: '110px',
                                        height: 'auto',
                                        marginBottom: '1rem',
                                        display: 'inline-block'
                                    }}
                                />
                                <h1 className="auth-title">AquaMonitor</h1>
                                <p className="auth-subtitle">Welcome back</p>
                            </div>

                            {isLogin && error && (
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div className="auth-input-group">
                                    <label className="auth-label">Email</label>
                                    <input
                                        type="email"
                                        className="auth-input"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="auth-input-group">
                                    <label className="auth-label">Password</label>
                                    <input
                                        type="password"
                                        className="auth-input"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="admin-toggle-container" style={{ margin: 0, padding: '0.4rem 0.75rem', background: 'transparent', border: 'none' }}>
                                        <span className="admin-toggle-label" style={{ marginRight: '0.5rem', opacity: 0.7 }}>Fill Admin?</span>
                                        <label className="switch">
                                            <input type="checkbox" checked={isAdminFill} onChange={handleAdminToggle} />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <button type="button" onClick={handleForgotPassword} className="auth-link" style={{ fontSize: '0.85rem' }}>
                                        Forgot Password?
                                    </button>
                                </div>

                                <button type="submit" disabled={loading} className="auth-btn-primary">
                                    {loading ? 'Signing in...' : 'Login'}
                                </button>

                                <button type="button" onClick={handleGoogleAuth} className="auth-btn-google">
                                    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                    Continue with Google
                                </button>
                            </form>

                            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                    Don't have an account?{' '}
                                    <button onClick={(e) => toggleMode(e, false)} className="auth-link">
                                        Sign Up
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SIGNUP BACK SIDE */}
                    <div className="auth-card-back">
                        <div className="auth-glass-panel">
                            {/* Header */}
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <h1 className="auth-title">Create Account</h1>
                                <p className="auth-subtitle">Join AquaMonitor today</p>
                            </div>

                            {!isLogin && error && (
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', padding: '0.8rem', borderRadius: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="auth-input-group">
                                    <label className="auth-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="auth-input"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="auth-input-group">
                                    <label className="auth-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="auth-input"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="auth-input-group">
                                    <label className="auth-label">Password</label>
                                    <input
                                        type="password"
                                        className="auth-input"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="auth-input-group">
                                    <label className="auth-label">Confirm Password</label>
                                    <input
                                        type="password"
                                        className="auth-input"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>

                                <button type="submit" disabled={loading} className="auth-btn-primary">
                                    {loading ? 'Creating Account...' : 'Sign Up'}
                                </button>

                                <button type="button" onClick={handleGoogleAuth} className="auth-btn-google">
                                    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                    Continue with Google
                                </button>
                            </form>

                            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                    Already have an account?{' '}
                                    <button onClick={(e) => toggleMode(e, true)} className="auth-link">
                                        Login here
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
