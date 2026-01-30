import React, { useState, useEffect } from 'react';
import { Sliders, Clock, Save, Loader2 } from 'lucide-react';
import { useAutomation } from '../context/AutomationContext';

export default function Automation() {
    const { settings, updateSettings, loading } = useAutomation();

    const [minLevel, setMinLevel] = useState(20);
    const [maxLevel, setMaxLevel] = useState(90);
    const [mode, setMode] = useState('auto');
    const [scheduleEnabled, setScheduleEnabled] = useState(true);
    const [startTime, setStartTime] = useState('06:00');
    const [endTime, setEndTime] = useState('18:00');

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Sync local state when settings load
    useEffect(() => {
        if (settings) {
            setMinLevel(settings.minLevel);
            setMaxLevel(settings.maxLevel);
            setMode(settings.mode);
            setScheduleEnabled(settings.scheduleEnabled);
            setStartTime(settings.startTime);
            setEndTime(settings.endTime);
        }
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage({ text: '', type: '' });

        const result = await updateSettings({
            minLevel,
            maxLevel,
            mode,
            scheduleEnabled,
            startTime,
            endTime
        });

        setIsSaving(false);
        if (result.success) {
            setMessage({ text: 'Settings saved successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } else {
            setMessage({ text: 'Failed to save settings: ' + result.error, type: 'error' });
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
                <Loader2 size={40} className="spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.875rem' }}>Automation Settings</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Configure motor automation rules</p>
                </div>
                {message.text && (
                    <div className="fade-in" style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                        border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                        fontWeight: 600
                    }}>
                        {message.text}
                    </div>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr',
                gap: '2rem',
                alignItems: 'start'
            }}>
                {/* Left Column: Core Controls */}
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {/* Operation Mode */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sliders size={20} /> Operation Mode
                        </h3>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                className={`btn ${mode === 'auto' ? 'btn-primary' : 'btn-outline'}`}
                                style={{ flex: 1, padding: '0.75rem' }}
                                onClick={() => setMode('auto')}
                            >
                                Automatic
                            </button>
                            <button
                                className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-outline'}`}
                                style={{ flex: 1, padding: '0.75rem' }}
                                onClick={() => setMode('manual')}
                            >
                                Manual Only
                            </button>
                        </div>

                        <div style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '0.5rem', fontSize: '0.875rem', lineHeight: '1.6', border: '1px solid var(--border-color)' }}>
                            {mode === 'auto'
                                ? '✨ System will manage the pump automatically based on water levels.'
                                : '🛠️ High-level safety limits apply, but motor start/stop is manual.'}
                        </div>
                    </div>

                    {/* Thresholds */}
                    {mode === 'auto' && (
                        <div className="card fade-in">
                            <h3 style={{ marginBottom: '1.5rem' }}>Water Level Thresholds</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: 500 }}>Min (ON)</span>
                                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{minLevel}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={minLevel}
                                        onChange={(e) => setMinLevel(parseInt(e.target.value))}
                                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Motor starts at this level</p>
                                </div>

                                <div style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: 500 }}>Max (OFF)</span>
                                        <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{maxLevel}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="51"
                                        max="100"
                                        value={maxLevel}
                                        onChange={(e) => setMaxLevel(parseInt(e.target.value))}
                                        style={{ width: '100%', accentColor: 'var(--secondary)' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Motor stops at this level</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Schedule & Constraints */}
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {/* Schedule */}
                    {mode === 'auto' && (
                        <div className="card fade-in" style={{ height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={20} /> Schedule
                                </h3>
                                <label className="switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={scheduleEnabled}
                                        onChange={() => setScheduleEnabled(!scheduleEnabled)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: scheduleEnabled ? 'var(--primary)' : 'var(--text-muted)' }}>
                                        {scheduleEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </label>
                            </div>

                            <div style={{ opacity: scheduleEnabled ? 1 : 0.5, pointerEvents: scheduleEnabled ? 'auto' : 'none', transition: 'all 0.3s ease' }}>
                                <div style={{ display: 'grid', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Start Time</label>
                                        <input
                                            type="time"
                                            className="input-field"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            style={{ background: 'var(--bg-body)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>End Time</label>
                                        <input
                                            type="time"
                                            className="input-field"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            style={{ background: 'var(--bg-body)' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '0.5rem', border: '1px dashed var(--secondary)' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: '1.5', margin: 0 }}>
                                        Motor automation will only be active during these hours to prevent noise at night or early morning.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{ minWidth: '160px' }}
                >
                    {isSaving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                    <span style={{ marginLeft: '8px' }}>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                </button>
            </div>
        </div>
    );
}
