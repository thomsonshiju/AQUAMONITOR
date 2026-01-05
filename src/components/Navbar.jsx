import React from 'react';
import { NavLink } from 'react-router-dom';
import { Droplets, LayoutDashboard, Settings, User, Activity, BarChart3, ShieldCheck, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
    const [isDark, setIsDark] = React.useState(false);
    const { logout, user } = useAuth();

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.setAttribute('data-theme', !isDark ? 'dark' : 'light');
    };

    // Navigation items based on user role
    let navItems = [];

    if (user?.role?.toLowerCase() === 'admin') {
        // Admin users only see Admin Panel
        navItems = [
            { to: '/admin', icon: ShieldCheck, label: 'Admin Panel' }
        ];
    } else {
        // Regular users see all other navigation items
        navItems = [
            { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/status', icon: Activity, label: 'Status' },
            { to: '/automation', icon: Settings, label: 'Automation' },
            { to: '/analytics', icon: BarChart3, label: 'Analytics' },
            { to: '/profile', icon: User, label: 'Profile' },
        ];
    }

    return (
        <nav className="card" style={{
            margin: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1.5rem',
            position: 'sticky',
            top: '1rem',
            zIndex: 100
        }}>
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
                <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    AquaMonitor
                </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
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
                                transition: 'all 0.3s ease',
                                position: 'relative'
                            })}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={18} />
                                    <span className="nav-label">{item.label}</span>
                                    {isActive && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '4px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '12px',
                                            height: '2px',
                                            background: 'rgba(255, 255, 255, 0.8)',
                                            borderRadius: '2px'
                                        }} />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>

                <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {user?.role?.toLowerCase() !== 'admin' && <NotificationCenter />}
                    <button className="btn btn-outline" onClick={toggleTheme} style={{ padding: '0.5rem' }} title="Toggle Theme">
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button className="btn btn-outline" onClick={logout} style={{ padding: '0.5rem' }} title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
