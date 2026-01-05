import React, { useState, useEffect } from 'react';
import WaterTank from '../components/WaterTank';
import { Power, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function Dashboard() {
    const [waterLevel, setWaterLevel] = useState(45);
    const [isMotorOn, setIsMotorOn] = useState(false);
    const [systemStatus, setSystemStatus] = useState('Online');
    const { createNotification } = useNotifications();
    const [lastNotificationLevel, setLastNotificationLevel] = useState(45);

    // Simulation effect
    useEffect(() => {
        const interval = setInterval(() => {
            setWaterLevel(prev => {
                let change = 0;
                if (isMotorOn) {
                    change = 1.5; // Filling up
                } else {
                    change = -0.2; // Slowly draining (usage)
                }

                const newLevel = Math.min(100, Math.max(0, prev + change));

                // Auto shutoff logic
                if (newLevel >= 100 && isMotorOn) {
                    setIsMotorOn(false);
                }

                return newLevel;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isMotorOn]);

    // Automatic notifications disabled - use "Test Notification" button instead
    // Notification effect for water level changes
    // useEffect(() => {
    //     if (waterLevel >= 95 && lastNotificationLevel < 95) {
    //         createNotification('Tank Almost Full', 'Water level has reached 95%. Motor will auto-stop soon.', 'warning');
    //     } else if (waterLevel <= 20 && lastNotificationLevel > 20) {
    //         createNotification('Low Water Level', 'Water level is below 20%. Consider turning on the motor.', 'error');
    //     } else if (waterLevel >= 100 && lastNotificationLevel < 100) {
    //         createNotification('Tank Full', 'Water tank is now full. Motor has been stopped.', 'success');
    //     }
    //     setLastNotificationLevel(waterLevel);
    // }, [waterLevel]);

    // Motor state change notification
    // useEffect(() => {
    //     if (isMotorOn) {
    //         createNotification('Motor Started', 'Water pump is now running.', 'info');
    //     }
    // }, [isMotorOn]);

    const toggleMotor = () => {
        setIsMotorOn(!isMotorOn);
    };

    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = () => {
        setIsUpdating(true);
        // Simulate data fetch
        setTimeout(() => {
            setIsUpdating(false);
            setSystemStatus('Online');
        }, 1500);
    };

    return (
        <div className="fade-in">
            <div>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.875rem', marginBottom: '0.25rem' }}>Dashboard</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Overview of your water management system</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={handleUpdate}
                            className="btn btn-outline"
                            disabled={isUpdating}
                            style={{
                                borderRadius: '2rem',
                                padding: '0.5rem 1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <RefreshCw size={18} className={isUpdating ? 'spin' : ''} />
                            {isUpdating ? 'Updating...' : 'Update Data'}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--border-color)' }}>
                            <span style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: systemStatus === 'Online' ? 'var(--success)' : 'var(--danger)',
                                boxShadow: `0 0 10px ${systemStatus === 'Online' ? 'var(--success)' : 'var(--danger)'}`
                            }}></span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>System {systemStatus}</span>
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(320px, 1.2fr) 1fr 1fr',
                    gap: '1.5rem',
                    alignItems: 'start'
                }}>
                    {/* Column 1: Water Tank Visual */}
                    <div style={{ height: '100%' }}>
                        <WaterTank level={waterLevel} />
                    </div>

                    {/* Column 2: Motor Control */}
                    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Motor Control</h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flex: 1 }}>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', color: isMotorOn ? 'var(--success)' : 'var(--text-main)' }}>
                                    {isMotorOn ? 'Running' : 'Stopped'}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {isMotorOn ? 'Pump is actively filling' : 'Pump is currently idle'}
                                </div>
                            </div>

                            <button
                                onClick={toggleMotor}
                                className={`btn ${isMotorOn ? 'btn-primary' : 'btn-outline'}`}
                                style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '50%',
                                    padding: 0,
                                    border: isMotorOn ? 'none' : '3px solid var(--border-color)',
                                    backgroundColor: isMotorOn ? 'var(--success)' : 'transparent',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isMotorOn ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
                                }}
                            >
                                <Power size={36} color={isMotorOn ? 'white' : 'var(--text-muted)'} />
                            </button>
                        </div>

                        <div style={{ padding: '1.25rem', background: 'var(--bg-body)', borderRadius: '0.75rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Operation Mode</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Automatic</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Scheduled Time</span>
                                <span style={{ fontWeight: 700 }}>06:00 PM</span>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Alerts & Status */}
                    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Live Notifications</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                            {waterLevel < 20 && (
                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    borderLeft: '4px solid var(--danger)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--danger)',
                                    animation: 'pulse 2s infinite'
                                }}>
                                    <AlertCircle size={24} style={{ flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Low water level!</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Motor manual start recommended.</div>
                                    </div>
                                </div>
                            )}

                            {waterLevel > 90 && (
                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: 'rgba(245, 158, 11, 0.08)',
                                    borderLeft: '4px solid var(--warning)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--warning)'
                                }}>
                                    <AlertCircle size={24} style={{ flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Tank almost full</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Auto-stop will trigger soon.</div>
                                    </div>
                                </div>
                            )}

                            {waterLevel >= 20 && waterLevel <= 90 && (
                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: 'rgba(16, 185, 129, 0.08)',
                                    borderLeft: '4px solid var(--success)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--success)'
                                }}>
                                    <CheckCircle2 size={24} style={{ flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>System Normal</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Water level is within safe limits.</div>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div style={{ background: 'var(--bg-body)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Temp</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>24°C</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-body)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Turbidity</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>0.5 NTU</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
