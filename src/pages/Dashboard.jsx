import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WaterTank from '../components/WaterTank';
import { Power, AlertCircle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
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

    const { settings, loading: settingsLoading } = useAutomation();

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
        // Fallback to HiveMQ Public Broker since CloudAMQP WebSockets are not enabled.
        const url = `ws://broker.hivemq.com:8000/mqtt`;

        console.log(`Connecting to MQTT at ${url}`);

        const client = mqtt.connect(url, {
            clientId: `dashboard_client_${Math.random().toString(16).slice(2, 8)}`,
            keepalive: 60,
            reconnectPeriod: 2000,
            // username/password removed for public broker
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
                    setWaterLevel(data.level);
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
        if (mqttClient && mqttClient.connected) {
            const nextState = isMotorOn ? 'OFF' : 'ON';
            mqttClient.publish('aquamonitor/motor/command', nextState);
            // We don't set state here; we wait for the tank to report back via telemetry
        }
    };

    const [isUpdating, setIsUpdating] = useState(false);

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
                    <div style={{ height: '100%', position: 'relative' }}>
                        {!hasReceivedData && systemStatus === 'Online' && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 20,
                                background: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '1rem',
                                borderRadius: '1rem',
                                textAlign: 'center',
                                width: '80%'
                            }}>
                                <Loader2 size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
                                <div style={{ fontSize: '0.9rem' }}>Waiting for ESP32 data...</div>
                            </div>
                        )}
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
                                <span style={{ fontWeight: 700, color: 'var(--primary)', textTransform: 'capitalize' }}>
                                    {settings?.mode || 'Automatic'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Scheduled Time</span>
                                <span style={{ fontWeight: 700 }}>
                                    {settings?.scheduleEnabled ? `${settings.startTime} - ${settings.endTime}` : 'Disabled'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Alerts & Status */}
                    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Live Notifications</h3>

                        {/* Live Notifications from Context */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                            {notifications.slice(0, 3).map(notif => (
                                <div key={notif.id} style={{
                                    padding: '0.75rem',
                                    background: 'var(--bg-body)',
                                    borderLeft: `4px solid ${notif.type === 'error' ? 'var(--danger)' :
                                        notif.type === 'warning' ? 'var(--warning)' :
                                            notif.type === 'success' ? 'var(--success)' : 'var(--primary)'
                                        }`,
                                    borderRadius: '0.5rem',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{notif.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{notif.message}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.4rem', textAlign: 'right' }}>
                                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {waterLevel < (settings?.minLevel || 20) && (
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
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                        {settings?.mode === 'auto' ? `Auto-fill starting at ${settings.minLevel}%` : 'Manual start recommended.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {waterLevel > (settings?.maxLevel - 10 || 80) && waterLevel < (settings?.maxLevel || 90) && (
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
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Auto-stop will trigger at {settings?.maxLevel || 90}%.</div>
                                </div>
                            </div>
                        )}

                        {waterLevel >= (settings?.minLevel || 20) && waterLevel <= (settings?.maxLevel - 10 || 80) && (
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
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{sensors.temp}°C</div>
                                </div>
                                <div style={{ background: 'var(--bg-body)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Turbidity</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{sensors.turbidity} NTU</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}
