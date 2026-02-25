import React from 'react';

import './PremiumWaterTank.css';

export default function PremiumWaterTank({ level }) {
    // Level is percentage 0-100
    const displayLevel = Math.round(level);

    // Determine color based on level
    let waterColor = '#3b82f6'; // Default Blue
    if (level < 20) waterColor = '#ef4444'; // Red for low
    else if (level > 85) waterColor = '#10b981'; // Green for high/safe

    return (
        <div className="premium-tank-container">
            <div className="glass-tank">
                {/* Tank Highlights */}
                <div className="tank-reflection-left"></div>
                <div className="tank-reflection-right"></div>

                {/* Water Content */}
                <div
                    className="water-mass"
                    style={{
                        height: `${level}%`,
                        backgroundColor: waterColor,
                        boxShadow: `0 0 30px ${waterColor}44`
                    }}
                >
                    {/* Waves */}
                    <div className="wave-container">
                        <svg className="waves" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
                            viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
                            <defs>
                                <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
                            </defs>
                            <g className="parallax">
                                <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.3)" />
                                <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.5)" />
                                <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(255,255,255,0.2)" />
                                <use xlinkHref="#gentle-wave" x="48" y="7" fill={waterColor} />
                            </g>
                        </svg>
                    </div>

                    {/* Ripples/Bubbles effect */}
                    <div className="bubbles">
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                    </div>
                </div>

                {/* Level Markers (Matching the 10 hardware probes) */}
                <div className="level-markers">
                    {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10].map(pct => (
                        <div key={pct} className="marker" style={{ top: `${100 - pct}%` }}>
                            <span>{pct}%</span>
                        </div>
                    ))}
                </div>

                {/* Center Percentage Display */}
                <div className="center-info">
                    <div className="glass-percentage">
                        <span className="number">{displayLevel}</span>
                        <span className="percent">%</span>
                    </div>
                    <div className="label">CAPACITY</div>
                </div>
            </div>

            <div className="tank-stats">
                <div className="stat-item">
                    <span className="stat-label">Active Probes</span>
                    <span className="stat-value" style={{ color: 'var(--primary)' }}>
                        {level > 0 ? Math.round(level / 10) : 0} / 10
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Status</span>
                    <span className="stat-value" style={{ color: level < 20 ? 'var(--danger)' : 'var(--success)' }}>
                        {level < 20 ? 'CRITICAL' : 'OPTIMAL'}
                    </span>
                </div>
            </div>
        </div>
    );
}
