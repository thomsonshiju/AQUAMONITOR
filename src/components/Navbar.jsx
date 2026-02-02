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
        { to: '/automation', icon: Settings, label: 'Automation' },
        { to: '/analytics', icon: BarChart3, label: 'Data' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    // Top Brand Bar (Visible on both)
    const BrandBar = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
                src="/logo-dashboard.png"
                alt="Logo"
                style={{
                    width: '50px',
                    height: '50px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
            />
            {!isMobile && (
                <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    AquaMonitor
                </h1>
            )}
        </div>
    );

    return (
        <>
            {/* Top Bar - Brand & Actions */}
            <nav className="card" style={{
                margin: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                borderRadius: 0,
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
                background: 'rgba(var(--bg-card-rgb), 0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <BrandBar />

                {/* Desktop Nav Items */}
                {!isMobile && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-outline'}
                                style={({ isActive }) => ({
                                    border: 'none',
                                    background: isActive ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: '1rem'
                                })}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                )}

                {/* Secondary Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {!isAdmin && <NotificationCenter />}

                    <div className="theme-toggle-wrapper hide-mobile">
                        <Moon size={14} className={`theme-icon ${isDark ? 'active' : ''}`} />
                        <label className="theme-switch-slider">
                            <input
                                type="checkbox"
                                checked={!isDark}
                                onChange={toggleTheme}
                            />
                            <span className="theme-switch-thumb"></span>
                        </label>
                        <Sun size={14} className={`theme-icon ${!isDark ? 'active' : ''}`} />
                    </div>

                    <button className="btn btn-outline" onClick={logout} style={{
                        padding: '0.5rem',
                        color: 'var(--danger)',
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '0.75rem'
                    }}>
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            {/* Mobile Bottom Tab Bar (iOS Feel) */}
            {isMobile && (
                <div className="mobile-bottom-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={({ isActive }) => `nav-item-mobile ${isActive ? 'active' : ''}`}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                    <span>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                    {/* Theme Toggle for Mobile inside Bottom Nav or Profile? 
                        Let's keep it simple for now as per iOS standards. 
                    */}
                </div>
            )}
        </>
    );
}
