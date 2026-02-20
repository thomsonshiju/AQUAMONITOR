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

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
                <Loader2 size={40} className="spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ paddingBottom: isMobile ? '5rem' : '2rem' }}>
            <div style={{
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                        Smart Logic
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>
                        Orchestrate your automated pumping parameters
                    </p>
                </div>

                {message.text ? (
                    <div className="fade-in" style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '2rem',
                        background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                        border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        fontWeight: 700,
                        fontSize: '0.9rem'
                    }}>
                        {message.text}
                    </div>
                ) : !isMobile && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>ORCHESTRATION</div>
                            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{mode === 'auto' ? 'AI DRIVEN' : 'MANUAL OVERRIDE'}</div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)',
                gap: isMobile ? '1.25rem' : '2rem'
            }}>
                {/* Mode & Thresholds (Main Panel) */}
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 8', display: 'grid', gap: isMobile ? '1.25rem' : '2rem' }}>
                    {/* Operation Mode */}
                    <div className="card" style={{ padding: isMobile ? '1.25rem' : '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '0.75rem' }}>
                                    <Sliders size={24} color="var(--primary)" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Operating Protocol</h3>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            {['auto', 'manual'].map((m) => (
                                <button
                                    key={m}
                                    className={`btn ${mode === m ? 'btn-primary' : 'btn-outline'}`}
                                    style={{
                                        flex: 1,
                                        padding: '1.25rem',
                                        borderRadius: '1.5rem',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        background: mode === m ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                                        border: mode === m ? 'none' : '1px solid var(--border-color)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                    onClick={() => setMode(m)}
                                >
                                    {m === 'auto' ? 'Autonomous AI' : 'Manual Control'}
                                </button>
                            ))}
                        </div>

                        <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.1)', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '1.5rem' }}>{mode === 'auto' ? '✨' : '🛠️'}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                {mode === 'auto'
                                    ? 'The system will autonomously manage fluid dynamics based on defined thresholds.'
                                    : 'Manual override engaged. Hardware limits remain active for safety.'}
                            </div>
                        </div>
                    </div>

                    {/* Level Thresholds */}
                    {mode === 'auto' && (
                        <div className="card fade-in" style={{ padding: isMobile ? '1.25rem' : '2.5rem' }}>
                            <h3 style={{ marginBottom: '2rem', fontSize: '1.25rem' }}>Trigger Thresholds</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                                <div style={{ padding: '1.5rem', background: 'rgba(var(--bg-card-rgb), 0.4)', borderRadius: '1.5rem', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mimum Activation</span>
                                        <span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary)' }}>{minLevel}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={minLevel}
                                        onChange={(e) => setMinLevel(parseInt(e.target.value))}
                                        style={{ width: '100%', height: '8px', borderRadius: '4px', accentColor: 'var(--primary)' }}
                                    />
                                    <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        Pump will START when level drops to {minLevel}%
                                    </div>
                                </div>

                                <div style={{ padding: '1.5rem', background: 'rgba(var(--bg-card-rgb), 0.4)', borderRadius: '1.5rem', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Maximum Cut-off</span>
                                        <span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--secondary)' }}>{maxLevel}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="51"
                                        max="100"
                                        value={maxLevel}
                                        onChange={(e) => setMaxLevel(parseInt(e.target.value))}
                                        style={{ width: '100%', height: '8px', borderRadius: '4px', accentColor: 'var(--secondary)' }}
                                    />
                                    <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        Pump will STOP when level reaches {maxLevel}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Scheduling & Execution (Side Panel) */}
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 4', display: 'grid', gap: isMobile ? '1.25rem' : '2rem' }}>
                    <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.75rem' }}>
                                    <Clock size={24} color="#8b5cf6" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Active Window</h3>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={scheduleEnabled}
                                    onChange={() => setScheduleEnabled(!scheduleEnabled)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        <div style={{
                            opacity: scheduleEnabled ? 1 : 0.4,
                            pointerEvents: scheduleEnabled ? 'auto' : 'none',
                            transition: 'all 0.4s ease',
                            display: 'grid',
                            gap: '1.5rem',
                            flex: 1
                        }}>
                            <div style={{ padding: '1.25rem', background: 'var(--bg-body)', borderRadius: '1.25rem', border: '1px solid var(--border-color)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>START OPS</label>
                                <input
                                    type="time"
                                    className="input-field"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    style={{ fontSize: '1.25rem', fontWeight: 700, border: 'none', background: 'transparent', padding: 0 }}
                                />
                            </div>
                            <div style={{ padding: '1.25rem', background: 'var(--bg-body)', borderRadius: '1.25rem', border: '1px solid var(--border-color)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>CEASE OPS</label>
                                <input
                                    type="time"
                                    className="input-field"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    style={{ fontSize: '1.25rem', fontWeight: 700, border: 'none', background: 'transparent', padding: 0 }}
                                />
                            </div>
                            <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                Automation only runs within this temporal window.
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{
                                width: '100%',
                                padding: '1.25rem',
                                borderRadius: '1.5rem',
                                marginTop: '2rem',
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                boxShadow: '0 10px 25px var(--primary-glow)'
                            }}
                        >
                            {isSaving ? <Loader2 size={24} className="spin" /> : <Save size={24} />}
                            <span style={{ marginLeft: '12px' }}>{isSaving ? 'Synchronizing...' : 'Apply Logic'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
