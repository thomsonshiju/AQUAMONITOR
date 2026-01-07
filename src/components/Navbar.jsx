import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Droplets, LayoutDashboard, Settings, User, Activity, BarChart3, ShieldCheck, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
    const [isDark, setIsDark] = useState(false);
    const { logout, user } = useAuth();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.setAttribute('data-theme', !isDark ? 'dark' : 'light');
    };

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const navItems = isAdmin ? [
        { to: '/admin', icon: ShieldCheck, label: 'Admin' }
    ] : [
        { to: '/', icon: LayoutDashboard, label: 'Home' },
        { to: '/status', icon: Activity, label: 'Status' },
        { to: '/automation', icon: Settings, label: 'Settings' },
        { to: '/analytics', icon: BarChart3, label: 'Data' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    // Top Brand Bar (Visible on both)
    const BrandBar = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                color: 'white',
                display: 'flex'
            }}>
                <Droplets size={24} />
            </div>
            {!isMobile && (
                <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    AquaMonitor
                </h1>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop Navbar / Admin Mobile Top Bar */}
            <nav className="card" style={{
                margin: isMobile ? '0.5rem' : '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1.25rem',
                position: 'sticky',
                top: isMobile ? '0.5rem' : '1rem',
                zIndex: 100,
                borderRadius: isMobile ? '1rem' : '1rem'
            }}>
                <BrandBar />

                {!isMobile && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
                                style={({ isActive }) => ({
                                    border: isActive ? 'none' : '1px solid transparent',
                                    background: isActive ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    padding: '0.6rem 1rem',
                                    transition: 'all 0.3s ease'
                                })}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!isAdmin && !isMobile && <NotificationCenter />}
                    {isAdmin && isMobile && <NotificationCenter />}
                    <button className="btn btn-outline" onClick={toggleTheme} style={{ padding: '0.5rem' }}>
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button className="btn btn-outline" onClick={logout} style={{ padding: '0.5rem', color: 'var(--danger)' }}>
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            {/* Mobile Bottom Navigation (Only for Users) */}
            {isMobile && !isAdmin && (
                <div style={{
                    position: 'fixed',
                    bottom: '1rem',
                    left: '1rem',
                    right: '1rem',
                    background: 'var(--bg-card)',
                    borderRadius: '1.25rem',
                    padding: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid var(--border-color)',
                    zIndex: 1000,
                    backdropFilter: 'blur(10px)'
                }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            style={({ isActive }) => ({
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                textDecoration: 'none',
                                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                transition: 'all 0.3s ease'
                            })}
                        >
                            <item.icon size={22} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            )}
        </>
    );
}
