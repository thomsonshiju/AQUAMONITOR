import React from 'react';

export default function WaterTank({ level }) {
    // Level is percentage 0-100
    // Determine color based on level
    let color = 'var(--primary)';
    if (level < 20) color = 'var(--danger)'; // Low
    if (level > 90) color = 'var(--warning)'; // Full warning

    return (
        <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <h3 style={{ marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Live Water Level</h3>

            <div style={{
                width: '200px',
                height: '300px',
                border: '4px solid var(--border-color)',
                borderRadius: '1rem',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--bg-body)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'
            }}>
                {/* Water Fill */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${level}%`,
                    background: `linear-gradient(to top, ${color}, var(--primary-hover))`,
                    transition: 'height 1s ease-in-out, background 0.5s ease',
                    opacity: 0.8
                }}>
                    {/* Wave effect (simple CSS strip) */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '10px',
                        background: 'rgba(255,255,255,0.3)',
                    }}></div>
                </div>

                {/* Percentage Text Overlay */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: level > 50 ? 'white' : 'var(--text-main)',
                    textShadow: level > 50 ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                    zIndex: 10
                }}>
                    {Math.round(level)}%
                </div>

                {/* Markers */}
                <div style={{ position: 'absolute', right: '10px', top: '10%', height: '1px', width: '10px', background: 'var(--text-muted)' }} title="90%"></div>
                <div style={{ position: 'absolute', right: '10px', top: '50%', height: '1px', width: '10px', background: 'var(--text-muted)' }} title="50%"></div>
                <div style={{ position: 'absolute', right: '10px', top: '80%', height: '1px', width: '10px', background: 'var(--text-muted)' }} title="20%"></div>
            </div>

            <div style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                Current Capacity: {Math.round(level * 10)} Liters
            </div>
        </div>
    );
}
