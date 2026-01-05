import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import ParticlesCustom from '../components/ParticlesCustom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, resetPassword, user } = useAuth();
    const navigate = useNavigate();

    // Handle redirection once user is authenticated
    React.useEffect(() => {
        if (user) {
            if (user.role === 'admin' || user.email?.includes('admin')) {
                navigate('/admin', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await login(email, password);
            if (!success) {
                setError('Invalid credentials. Please try again.');
                setLoading(false);
            }
            // Navigation handled by useEffect
        } catch (err) {
            setError('Login failed due to server error.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await login('google-auth-trigger');
            // Navigation handled by useEffect
        } catch (error) {
            console.error(error);
            setError('Google Login failed');
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
            console.error(err);
            setError('An error occurred.');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', // Deep Sea Gradient
            fontFamily: "'Inter', sans-serif",
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <ParticlesCustom />

            <div style={{
                width: '100%',
                maxWidth: '430px',
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(20px)',
                padding: '2.5rem',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{
                        fontSize: '2.75rem',
                        fontWeight: '800',
                        color: '#FFFFFF',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.025em'
                    }}>
                        AquaMonitor
                    </h1>
                    <p style={{
                        color: '#9CA3AF',
                        fontSize: '1rem',
                        fontWeight: '500'
                    }}>
                        Smart Water Management
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#F87171',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        textAlign: 'center',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Email Field */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ color: '#E5E7EB', fontSize: '0.925rem', fontWeight: '600' }}>Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '0.75rem',
                                color: '#FFFFFF',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                            onBlur={(e) => e.target.style.borderColor = '#374151'}
                        />
                    </div>

                    {/* Password Field */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ color: '#E5E7EB', fontSize: '0.925rem', fontWeight: '600' }}>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '0.75rem',
                                color: '#FFFFFF',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                            onBlur={(e) => e.target.style.borderColor = '#374151'}
                        />
                    </div>

                    {/* Forgot Password */}
                    <div style={{ textAlign: 'right' }}>
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#3B82F6',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                textDecoration: 'none',
                                padding: 0
                            }}
                            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '0.5rem',
                            opacity: loading ? 0.7 : 1,
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#1D4ED8')}
                        onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#2563EB')}
                    >
                        {loading ? 'Signing in...' : 'Login'}
                    </button>

                    {/* Google Login Button */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: '#FFFFFF',
                            color: '#111827',
                            border: 'none',
                            borderRadius: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#FFFFFF'}
                    >

                        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign in with Google
                    </button>
                </form>

                {/* Footer */}
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p style={{ color: '#9CA3AF', fontSize: '0.925rem' }}>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{ color: '#3B82F6', fontWeight: '600', textDecoration: 'none' }}>
                            Sign Up
                        </Link>
                    </p>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #374151' }}>
                        <button
                            onClick={() => {
                                setEmail('admin@aquamonitor.com');
                                setPassword('admin123');
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#6B7280',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'color 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                width: '100%'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#9CA3AF'}
                            onMouseOut={(e) => e.target.style.color = '#6B7280'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            Admin Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
