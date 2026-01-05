import React, { useState, useEffect } from 'react';
import { Wifi, Cloud, CheckCircle2, XCircle, RefreshCw, Activity } from 'lucide-react';

export default function DeviceStatus() {
    const [deviceOnline, setDeviceOnline] = useState(true);
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
    const [ping, setPing] = useState(45);

    const refreshStatus = () => {
        setLastSync(new Date().toLocaleTimeString());
        setPing(Math.floor(Math.random() * 50) + 30);
    };

    useEffect(() => {
        const interval = setInterval(refreshStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.875rem', marginBottom: '0.25rem' }}>Device Status</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Connection health and diagnostics</p>
                </div>
                <button className="btn btn-outline" onClick={refreshStatus} style={{ borderRadius: '2rem' }}>
                    <RefreshCw size={18} /> Refresh Status
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>

                {/* ESP32 Status */}
                <div className="card" style={{ height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>ESP32 Controller</h3>
                        <div style={{
                            background: deviceOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            padding: '0.5rem',
                            borderRadius: '0.5rem'
                        }}>
                            <Wifi size={24} color={deviceOnline ? 'var(--success)' : 'var(--danger)'} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Status</span>
                            <span style={{ fontWeight: 600, color: deviceOnline ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {deviceOnline ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                {deviceOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Device IP</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>192.168.1.105</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Signal</span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--success)' }}>-65 dBm (Strong)</span>
                        </div>
                    </div>
                </div>

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
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Firebase Auth</span>
                            <span style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.9rem' }}>Active</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Firestore</span>
                            <span style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.9rem' }}>Syncing</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Last Heartbeat</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{lastSync}</span>
                        </div>
                    </div>
                </div>

                {/* Diagnostics */}
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
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: ping < 50 ? 'var(--success)' : 'var(--warning)' }}>{ping}ms</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Uptime</span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>14d 6h 22m</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Firmware</span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>v2.4.1 stable</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
