import React, { useState } from 'react';
import { Sliders, Clock, Save } from 'lucide-react';

export default function Automation() {
    const [minLevel, setMinLevel] = useState(20);
    const [maxLevel, setMaxLevel] = useState(90);
    const [mode, setMode] = useState('auto'); // auto or manual
    const [scheduleEnabled, setScheduleEnabled] = useState(true);
    const [startTime, setStartTime] = useState('06:00');
    const [endTime, setEndTime] = useState('18:00');

    const handleSave = () => {
        alert('Settings saved successfully!');
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.875rem' }}>Automation Settings</h2>
                <p style={{ color: 'var(--text-muted)' }}>Configure motor automation rules</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

                {/* Operation Mode */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sliders size={20} /> Operation Mode
                    </h3>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <button
                            className={`btn ${mode === 'auto' ? 'btn-primary' : 'btn-outline'}`}
                            style={{ flex: 1 }}
                            onClick={() => setMode('auto')}
                        >
                            Automatic
                        </button>
                        <button
                            className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-outline'}`}
                            style={{ flex: 1 }}
                            onClick={() => setMode('manual')}
                        >
                            Manual Only
                        </button>
                    </div>

                    <div style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '0.5rem', fontSize: '0.875rem', lineHeight: '1.6' }}>
                        {mode === 'auto'
                            ? 'In Automatic mode, the motor turns ON when water level is below minimum threshold and OFF when it exceeds maximum threshold.'
                            : 'In Manual mode, the motor runs ONLY when you manually turn it ON via dashboard or physical switch.'}
                    </div>
                </div>

                {/* Thresholds */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Water Level Thresholds</h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Minimum Level (Motor ON)</span>
                            <span style={{ fontWeight: 600 }}>{minLevel}%</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            value={minLevel}
                            onChange={(e) => setMinLevel(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--primary)' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Maximum Level (Motor OFF)</span>
                            <span style={{ fontWeight: 600 }}>{maxLevel}%</span>
                        </label>
                        <input
                            type="range"
                            min="51"
                            max="100"
                            value={maxLevel}
                            onChange={(e) => setMaxLevel(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--primary)' }}
                        />
                    </div>
                </div>

                {/* Schedule */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={20} /> Schedule
                        </h3>
                        <label className="switch">
                            <input type="checkbox" checked={scheduleEnabled} onChange={() => setScheduleEnabled(!scheduleEnabled)} />
                            <span style={{ fontSize: '0.875rem', cursor: 'pointer' }}>{scheduleEnabled ? 'Enabled' : 'Disabled'}</span>
                        </label>
                    </div>

                    <div style={{ opacity: scheduleEnabled ? 1 : 0.5, pointerEvents: scheduleEnabled ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Start Time</label>
                                <input
                                    type="time"
                                    className="input-field"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="label">End Time</label>
                                <input
                                    type="time"
                                    className="input-field"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Motor automation will only be active during these hours to prevent noise at night.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSave}>
                    <Save size={18} /> Save Settings
                </button>
            </div>
        </div>
    );
}
