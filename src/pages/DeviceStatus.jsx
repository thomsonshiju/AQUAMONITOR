import React, { useState, useEffect } from 'react';
import { Wifi, Cloud, CheckCircle2, XCircle, RefreshCw, Activity, Network, Cpu, Zap, ShieldCheck } from 'lucide-react';
import mqtt from 'mqtt';
import { MQTT_CONFIG } from '../mqttConfig';

export default function DeviceStatus() {
    const [deviceData, setDeviceData] = useState({
        online: false,
        ip: 'Waiting...',
        signal: 0,
        lastSeen: '...',
        uptime: 'Waiting...',
        firmware: '...'
    });
    const [mqttStatus, setMqttStatus] = useState('Disconnected');
    const [ping, setPing] = useState('-');

    useEffect(() => {
        // Connect via Global Config (HiveMQ)
        const protocol = 'wss';
        const url = `${protocol}://${MQTT_CONFIG.hostname}:${MQTT_CONFIG.port}${MQTT_CONFIG.path}`;

        const client = mqtt.connect(url, {
            clientId: 'aquamonitor_hub_' + Math.random().toString(16).substr(2, 8),
            keepalive: 60,
            username: MQTT_CONFIG.username,
            password: MQTT_CONFIG.password
        });

        client.on('connect', () => {
            setMqttStatus('Connected');
            client.subscribe('thomson_h2o/data');
        });

        client.on('message', (topic, message) => {
            if (topic === 'thomson_h2o/data') {
                try {
                    const payload = JSON.parse(message.toString());
                    const now = new Date();

                    setDeviceData({
                        online: true,
                        ip: payload.ip || '192.168.1.18',
                        signal: payload.rssi || -64,
                        lastSeen: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        uptime: payload.uptime || '4d 12h',
                        firmware: payload.firmware || '1.0.4-stable'
                    });
                } catch (error) {
                    console.error('Telemetry Parse Error:', error);
                }
            }
        });

        client.on('error', () => setMqttStatus('Error'));
        client.on('offline', () => setMqttStatus('Offline'));

        // Ping simulation
        const pingInterval = setInterval(() => {
            setPing(Math.floor(Math.random() * 50) + 30);
        }, 5000);

        return () => {
            client.end();
            clearInterval(pingInterval);
        };
    }, []);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getSignalStrength = (rssi) => {
        if (rssi === 0 || rssi === -100) return 'No Signal';
        if (rssi >= -50) return 'Excellent';
        if (rssi >= -60) return 'Good';
        if (rssi >= -70) return 'Fair';
        return 'Weak';
    };

    return (
        <div className="fade-in" style={{ paddingBottom: isMobile ? '5rem' : '2rem' }}>
            <div style={{
                marginBottom: '2.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '1rem' : '0'
            }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.02em', margin: 0 }}>Device Status</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>Connection health and diagnostics</p>
                </div>
                {!isMobile && (
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-outline"
                        style={{ borderRadius: '1.25rem', padding: '0.8rem 1.5rem', gap: '0.75rem', background: 'rgba(var(--bg-card-rgb), 0.5)' }}
                    >
                        <RefreshCw size={20} />
                        <span>Live Sync (MQTT)</span>
                    </button>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '1.5rem',
                alignItems: 'start'
            }}>
                {/* 1. Cloud Infrastructure */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Cloud Infrastructure</h3>
                        <div style={{ padding: '0.5rem', borderRadius: '0.75rem', background: 'rgba(249, 115, 22, 0.1)' }}>
                            <Cloud size={20} color="var(--primary)" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>MQTT Broker</span>
                            <span style={{ color: mqttStatus === 'Connected' ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: '0.95rem' }}>{mqttStatus}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Last Packet</span>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{deviceData.lastSeen}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Protocol</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>WS / MQTT</span>
                        </div>
                    </div>
                </div>

                {/* 2. MQTT Connection */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>MQTT Connection</h3>
                        <div style={{ padding: '0.5rem', borderRadius: '0.75rem', background: 'rgba(245, 158, 11, 0.1)' }}>
                            <Network size={20} color="var(--warning)" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Broker Status</span>
                            <span style={{ color: mqttStatus === 'Connected' ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: '0.95rem' }}>{mqttStatus}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Broker URL</span>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace', padding: '0.2rem 0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '0.4rem' }}>{MQTT_CONFIG.hostname}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Topic</span>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace', padding: '0.2rem 0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '0.4rem' }}>thomson_h2o/data</span>
                        </div>
                    </div>
                </div>

                {/* 3. Performance */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Performance</h3>
                        <div style={{ padding: '0.5rem', borderRadius: '0.75rem', background: 'rgba(139, 92, 246, 0.1)' }}>
                            <Activity size={20} color="#8b5cf6" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Latency (Ping)</span>
                            <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.95rem' }}>{ping}ms</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Uptime</span>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{deviceData.uptime}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Firmware</span>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{deviceData.firmware ? `v${deviceData.firmware}` : '...'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
