import React, { useState, useEffect } from 'react';
import { Wifi, Cloud, CheckCircle2, XCircle, RefreshCw, Activity, Network } from 'lucide-react';
import mqtt from 'mqtt';

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
        // Connect to MQTT Broker via WebSockets
        const client = mqtt.connect('ws://broker.hivemq.com:8000/mqtt', {
            clientId: 'aquamonitor_dashboard_' + Math.random().toString(16).substr(2, 8),
            keepalive: 60
        });

        client.on('connect', () => {
            console.log('Connected to MQTT Broker');
            setMqttStatus('Connected');
            client.subscribe('aquamonitor/data', (err) => {
                if (err) console.error('Subscription error:', err);
                else console.log('Subscribed to aquamonitor/data');
            });
        });

        client.on('message', (topic, message) => {
            try {
                // Expected JSON: { "ip": "192.168.1.5", "rssi": -60, "uptime": "2h 5m", "firmware": "v1.0" }
                const payload = JSON.parse(message.toString());
                const now = new Date();

                setDeviceData({
                    online: true,
                    ip: payload.ip || 'Unknown',
                    signal: payload.rssi || 0,
                    lastSeen: now.toLocaleTimeString(),
                    uptime: payload.uptime || 'Unknown',
                    firmware: payload.firmware || 'Unknown'
                });
            } catch (error) {
                console.error('Failed to parse MQTT message:', error);
            }
        });

        client.on('error', (err) => {
            console.error('MQTT Error:', err);
            setMqttStatus('Error');
        });

        client.on('offline', () => {
            setMqttStatus('Offline');
        });

        // Ping simulation
        const pingInterval = setInterval(() => {
            setPing(Math.floor(Math.random() * 50) + 30);
        }, 5000);

        return () => {
            client.end(); // Close connection on unmount
            clearInterval(pingInterval);
        };
    }, []);

    const getSignalStrength = (rssi) => {
        if (rssi === 0) return 'No Signal';
        if (rssi >= -50) return 'Excellent';
        if (rssi >= -60) return 'Good';
        if (rssi >= -70) return 'Fair';
        return 'Weak';
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.875rem', marginBottom: '0.25rem' }}>Device Status</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Connection health and diagnostics</p>
                </div>
                <button className="btn btn-outline" style={{ borderRadius: '2rem', cursor: 'default' }}>
                    <RefreshCw size={18} className="spin-slow" /> Live Sync (MQTT)
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', overflowX: 'auto' }}>



                {/* Cloud Status */}
                <div className="card" style={{ height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Cloud Infrastructure</h3>
                        <div style={{
                            background: 'rgba(14, 165, 233, 0.1)',
                            padding: '0.5rem',
                            borderRadius: '0.5rem'
                        }}>
                            <Cloud size={24} color="var(--primary)" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>MQTT Broker</span>
                            <span style={{ fontWeight: 600, color: mqttStatus === 'Connected' ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>{mqttStatus}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Last Packet</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{deviceData.lastSeen}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Protocol</span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>WS / MQTT</span>
                        </div>
                    </div>
                </div>

                {/* MQTT Connection */}
                <div className="card" style={{ height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>MQTT Connection</h3>
                        <div style={{
                            background: 'rgba(234, 179, 8, 0.1)',
                            padding: '0.5rem',
                            borderRadius: '0.5rem'
                        }}>
                            <Network size={24} color="#eab308" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Broker Status</span>
                            <span style={{ fontWeight: 600, color: mqttStatus === 'Connected' ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>{mqttStatus}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Broker URL</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>broker.hivemq.com</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Topic</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>aquamonitor/data</span>
                        </div>
                    </div>
                </div>

                {/* Performance */}
                <div className="card" style={{ height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Performance</h3>
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            padding: '0.5rem',
                            borderRadius: '0.5rem'
                        }}>
                            <Activity size={24} color="var(--secondary)" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Latency (Ping)</span>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: parseInt(ping) < 50 ? 'var(--success)' : 'var(--warning)' }}>{ping}ms</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Uptime</span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{deviceData.uptime}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Firmware</span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{deviceData.firmware}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
