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
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: '0.5rem'
            }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                        Smart Logic
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.9rem' : '1.05rem', margin: '0.25rem 0 0 0' }}>
                        Orchestrate your automated pumping parameters
                    </p>
                </div>

                {message.text ? (
                    <div className="fade-in" style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                        border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        fontWeight: 700,
                        fontSize: '0.85rem'
                    }}>
                        {message.text}
                    </div>
                ) : !isMobile && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800 }}>ORCHESTRATION</div>
                            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{mode === 'auto' ? 'AI DRIVEN' : 'MANUAL OVERRIDE'}</div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: isMobile ? '1rem' : '1.5rem'
            }}>
                {/* Mode & Thresholds (Main Panel) */}
                <div style={{ display: 'grid', gap: isMobile ? '1rem' : '1.5rem' }}>
                    {/* Operation Mode */}
                    <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '0.75rem' }}>
                                    <Sliders size={22} color="var(--primary)" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Operating Protocol</h3>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                            {['auto', 'manual'].map((m) => (
                                <button
                                    key={m}
                                    className={`btn ${mode === m ? 'btn-primary' : 'btn-outline'}`}
                                    style={{
                                        flex: 1,
                                        padding: '1.25rem',
                                        borderRadius: '1.25rem',
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

                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '1.35rem' }}>{mode === 'auto' ? '✨' : '🛠️'}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                {mode === 'auto'
                                    ? 'The system will autonomously manage fluid dynamics based on defined thresholds.'
                                    : 'Manual override engaged. Hardware limits remain active for safety.'}
                            </div>
                        </div>
                    </div>

                    {/* Level Thresholds */}
                    {mode === 'auto' && (
                        <div className="card fade-in" style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
                            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem' }}>Trigger Thresholds</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ padding: '1.25rem', background: 'rgba(var(--bg-card-rgb), 0.4)', borderRadius: '1.25rem', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Minimum Activation</span>
                                        <span style={{ fontWeight: 900, fontSize: '1.35rem', color: 'var(--primary)' }}>{minLevel}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={minLevel}
                                        onChange={(e) => setMinLevel(parseInt(e.target.value))}
                                        style={{ width: '100%', height: '8px', borderRadius: '4px', accentColor: 'var(--primary)' }}
                                    />
                                    <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        Motor will START when level drops to {minLevel}%
                                    </div>
                                </div>

                                <div style={{ padding: '1.25rem', background: 'rgba(var(--bg-card-rgb), 0.4)', borderRadius: '1.25rem', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Maximum Cut-off</span>
                                        <span style={{ fontWeight: 900, fontSize: '1.35rem', color: 'var(--secondary)' }}>{maxLevel}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="51"
                                        max="100"
                                        value={maxLevel}
                                        onChange={(e) => setMaxLevel(parseInt(e.target.value))}
                                        style={{ width: '100%', height: '8px', borderRadius: '4px', accentColor: 'var(--secondary)' }}
                                    />
                                    <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        Motor will STOP when level reaches {maxLevel}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card fade-in" style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            width: '100%',
                            padding: '1.25rem',
                            borderRadius: '1.25rem',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            boxShadow: '0 10px 25px var(--primary-glow)'
                        }}
                    >
                        {isSaving ? <Loader2 size={22} className="spin" /> : <Save size={22} />}
                        <span style={{ marginLeft: '10px' }}>{isSaving ? 'Synchronizing...' : 'Apply Logic'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
