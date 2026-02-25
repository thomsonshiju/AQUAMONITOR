import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PremiumWaterTank from '../components/PremiumWaterTank';
import { Power, AlertCircle, CheckCircle2, RefreshCw, Loader2, Lock, Unlock } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAutomation } from '../context/AutomationContext';
import mqtt from 'mqtt';
import { MQTT_CONFIG } from '../mqttConfig';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect admins to Admin Dashboard
    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin', { replace: true });
        }
    }, [user, navigate]);

    const { settings, updateSettings, loading: settingsLoading } = useAutomation();

    if (user?.role?.toLowerCase() === 'admin') return null;
    const [waterLevel, setWaterLevel] = useState(0);
    const [hasReceivedData, setHasReceivedData] = useState(false);
    const [isMotorOn, setIsMotorOn] = useState(false);
    const [sensors, setSensors] = useState({ temp: 24, turbidity: 0.5 });
    const [systemStatus, setSystemStatus] = useState('Offline');
    const { notifications, createNotification } = useNotifications();
    const [lastNotificationLevel, setLastNotificationLevel] = useState(45);

    // MQTT Client for live data
    const [mqttClient, setMqttClient] = useState(null);

    useEffect(() => {
        // Force Secure WebSockets (WSS) and Port 8884 for HiveMQ
        const protocol = 'wss';
        const port = 8884;
        const url = `${protocol}://${MQTT_CONFIG.hostname}:${port}${MQTT_CONFIG.path}`;

        console.log(`Dashboard connecting to MQTT at ${url}`);

        const client = mqtt.connect(url, {
            clientId: `dashboard_client_${Math.random().toString(16).slice(2, 8)}`,
            keepalive: 60,
            reconnectPeriod: 2000,
            username: MQTT_CONFIG.username,
            password: MQTT_CONFIG.password,
            clean: true,
        });

        client.on('connect', () => {
            if (client.disconnecting) return;
            console.log("MQTT connected in Dashboard");
            setSystemStatus('Online');

            // Subscribe using the correct topic format
            client.subscribe('thomson_h2o/data', (err) => {
                if (err) console.error("Subscription error:", err);
            });
            setMqttClient(client);
        });

        client.on('error', (err) => {
            console.error("MQTT Connection Error:", err);
            setSystemStatus('Error');
            createNotification('Connection Error', `MQTT Error: ${err.message}`, 'error');
        });

        client.on('offline', () => {
            console.log("MQTT client offline");
            setSystemStatus('Offline');
        });

        client.on('message', (topic, message) => {
            if (topic === 'thomson_h2o/data') {
                try {
                    const data = JSON.parse(message.toString());

                    // Level is sent directly from firmware contact probes
                    if (data.level !== undefined && data.level !== null) {
                        setWaterLevel(Math.round(data.level));
                    }

                    setHasReceivedData(true);
                    setIsMotorOn(data.motor === "ON");
                    setSensors({
                        temp: data.temp || 24,
                        turbidity: (data.turbidity / 1000).toFixed(1) // Example conversion
                    });
                    setSystemStatus('Online');
                } catch (e) {
                    console.error("Error parsing MQTT data", e);
                }
            }
        });

        client.on('close', () => setSystemStatus('Offline'));

        return () => client.end();
    }, []);

    // Automation Logic
    useEffect(() => {
        if (!settings || settings.mode !== 'auto') return;

        // Check schedule if enabled
        if (settings.scheduleEnabled) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            if (currentTime < settings.startTime || currentTime > settings.endTime) {
                // Outside schedule, if motor is on, maybe turn it off? 
                // Or just don't auto-start it. For now, let's keep it simple.
                return;
            }
        }

        // Auto ON logic
        if (waterLevel <= settings.minLevel && !isMotorOn) {
            // Only publish command if MQTT client is available and connected
            if (mqttClient && mqttClient.connected) {
                mqttClient.publish('aquamonitor/motor/command', 'ON');
                createNotification('Auto Motor Start', `Water level dropped below ${settings.minLevel}%. Motor started automatically.`, 'info');
            }
        }

        // Auto OFF logic
        if (waterLevel >= settings.maxLevel && isMotorOn) {
            // Only publish command if MQTT client is available and connected
            if (mqttClient && mqttClient.connected) {
                mqttClient.publish('aquamonitor/motor/command', 'OFF');
                createNotification('Auto Motor Stop', `Water tank reached ${settings.maxLevel}%. Motor stopped automatically.`, 'success');
            }
        }
    }, [waterLevel, settings, isMotorOn, mqttClient]);

    const toggleMotor = () => {
        if (settings?.mode === 'auto') {
            createNotification('Control Locked', 'Switch to Manual Mode to operate the motor directly.', 'warning');
            return;
        }

        if (mqttClient && mqttClient.connected) {
            const nextState = isMotorOn ? 'OFF' : 'ON';
            mqttClient.publish('aquamonitor/motor/command', nextState);
        }
    };

    const [isUpdating, setIsUpdating] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleUpdate = () => {
        setIsUpdating(true);
        // Simulate data fetch
        setTimeout(() => {
            setIsUpdating(false);
            // System status is now managed by MQTT connection
            // setSystemStatus('Online'); 
        }, 1500);
    };



    if (settingsLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
                <Loader2 size={40} className="spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ paddingBottom: isMobile ? '5rem' : '2rem' }}>
            {/* Page Header */}
            <div style={{
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? '1rem' : '0'
            }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                        {isMobile ? 'Dashboard' : 'System Overview'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>
                        Live telemetry from AquaMonitor Node-01
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: isMobile ? '100%' : 'auto' }}>
                    {!isMobile && (
                        <div style={{ textAlign: 'right', paddingRight: '1.5rem', borderRight: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>CURRENT STATE</div>
                            <div style={{ fontWeight: 700, color: isMotorOn ? 'var(--success)' : 'var(--text-main)' }}>{isMotorOn ? 'Active Pumping' : 'Standby Mode'}</div>
                        </div>
                    )}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.6rem 1.25rem',
                        borderRadius: '2rem', border: '1px solid var(--border-color)',
                        flex: isMobile ? 1 : 'none', justifyContent: 'center',
                        backdropFilter: 'blur(10px)', background: 'rgba(var(--bg-card-rgb), 0.2)'
                    }}>
                        <span style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            backgroundColor: systemStatus === 'Online' ? 'var(--success)' : 'var(--danger)',
                            boxShadow: `0 0 12px ${systemStatus === 'Online' ? 'var(--success)' : 'var(--danger)'}`
                        }}></span>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{systemStatus} Hub</span>
                    </div>
                    {isMobile && (
                        <button onClick={handleUpdate} className="btn btn-outline" style={{ borderRadius: '2rem', padding: '0.6rem' }}>
                            <RefreshCw size={18} className={isUpdating ? 'spin' : ''} />
                        </button>
                    )}
                </div>
            </div>



            {/* Main Content Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr 1fr',
                gap: isMobile ? '1.25rem' : '2rem',
                alignItems: 'start'
            }}>
                {/* Visualizer Column */}
                <div style={{ position: 'relative' }}>
                    <div className="card" style={{ padding: isMobile ? '1rem' : '2.5rem', minHeight: isMobile ? 'auto' : '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Storage Reservoir</h3>
                            <button onClick={handleUpdate} className="btn btn-outline hide-mobile" style={{ borderRadius: '1rem', padding: '0.5rem 1rem' }}>
                                <RefreshCw size={14} className={isUpdating ? 'spin' : ''} />
                                <span style={{ fontSize: '0.8rem' }}>Sync Level</span>
                            </button>
                        </div>
                        <div style={{ transform: isMobile ? 'scale(0.9)' : 'scale(1.1)', transformOrigin: 'center' }}>
                            <PremiumWaterTank
                                level={waterLevel}
                            />
                        </div>
                    </div>
                </div>

                {/* Automation Column */}
                <div style={{ display: 'grid', gap: isMobile ? '1.25rem' : '2rem' }}>
                    <div className="card" style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Motor Hub</h3>
                            <div style={{
                                padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                background: isMotorOn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(var(--text-muted-rgb), 0.1)',
                                color: isMotorOn ? 'var(--success)' : 'var(--text-muted)',
                                fontSize: '0.75rem', fontWeight: 800
                            }}>
                                {isMotorOn ? 'ACTIVE' : 'IDLE'}
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <button
                                onClick={toggleMotor}
                                style={{
                                    width: isMobile ? '80px' : '120px',
                                    height: isMobile ? '80px' : '120px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: settings?.mode === 'auto' ? 'var(--bg-body)' : (isMotorOn ? 'linear-gradient(135deg, var(--success), #059669)' : 'linear-gradient(135deg, var(--danger), #dc2626)'),
                                    boxShadow: settings?.mode === 'auto' ? 'none' : (isMotorOn ? '0 15px 35px rgba(16, 185, 129, 0.4)' : '0 15px 35px rgba(220, 38, 38, 0.4)'),
                                    cursor: settings?.mode === 'auto' ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto',
                                    opacity: settings?.mode === 'auto' ? 0.6 : 1,
                                    position: 'relative'
                                }}
                            >
                                {settings?.mode === 'auto' ? (
                                    <Lock size={isMobile ? 32 : 48} color="var(--text-muted)" />
                                ) : (
                                    <Power size={isMobile ? 32 : 48} color="white" />
                                )}
                                {settings?.mode === 'auto' && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-10px',
                                        background: 'var(--danger)',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontSize: '0.6rem',
                                        fontWeight: 800
                                    }}>LOCKED</div>
                                )}
                            </button>
                            <div style={{ marginTop: '1.5rem', fontWeight: 800, fontSize: '1.1rem' }}>
                                {isMotorOn ? 'Turn OFF' : 'Turn ON'}
                            </div>
                        </div>

                        <div style={{ padding: '1.25rem', background: 'var(--bg-body)', borderRadius: '1.25rem', display: 'grid', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Auto-Mode</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{settings?.mode?.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem' }}>System Health</h3>
                        {waterLevel < settings?.minLevel ? (
                            <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '1rem', color: 'var(--danger)' }}>
                                <AlertCircle size={20} />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Critical Low Level</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '1rem', color: 'var(--success)' }}>
                                <CheckCircle2 size={20} />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>All Systems Nominal</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Environment Column */}
                <div className="card" style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
                    <h3 style={{ margin: '0 0 2rem', fontSize: '1.2rem' }}>Sensor Telemetry</h3>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ padding: '2rem 1.5rem', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '1.5rem', textAlign: 'center', border: '1px solid rgba(var(--primary-rgb), 0.1)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '0.1em' }}>SYSTEM REAL-TIME HUB</div>
                            <div style={{ fontSize: '3.5rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.5rem', opacity: 0.8 }}>
                                {currentTime.toLocaleTimeString([], { second: '2-digit' })}s
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                            </div>

                            {/* Subtle pulse element */}
                            <div style={{
                                position: 'absolute', top: '10px', right: '10px', width: '6px', height: '6px',
                                borderRadius: '50%', background: 'var(--primary)',
                                animation: 'pulse 2s infinite'
                            }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
