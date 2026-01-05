import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const data = [
    { name: 'Mon', usage: 400 },
    { name: 'Tue', usage: 300 },
    { name: 'Wed', usage: 550 },
    { name: 'Thu', usage: 450 },
    { name: 'Fri', usage: 600 },
    { name: 'Sat', usage: 800 },
    { name: 'Sun', usage: 750 },
];

const hourlyData = [
    { time: '00:00', level: 80 },
    { time: '04:00', level: 80 },
    { time: '08:00', level: 60 },
    { time: '12:00', level: 45 },
    { time: '16:00', level: 40 },
    { time: '20:00', level: 90 }, // Pump ran
    { time: '23:59', level: 88 },
];

export default function Analytics() {
    return (
        <div className="fade-in">
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.875rem', marginBottom: '0.25rem' }}>Data Analytics</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Water usage patterns and history</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Daily Avg</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>450L</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Efficiency</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--success)' }}>94%</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* Weekly Usage */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Weekly Consumption (L)</h3>
                    <div style={{ height: '300px', width: '100%', marginBottom: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
                                    cursor={{ fill: 'rgba(14, 165, 233, 0.05)' }}
                                />
                                <Bar dataKey="usage" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Peak Day: <strong style={{ color: 'var(--text-main)' }}>Saturday (800L)</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Trend: <strong style={{ color: 'var(--success)' }}>↓ 12% vs last week</strong></span>
                    </div>
                </div>

                {/* Level Trend */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>24h Level Dynamics (%)</h3>
                    <div style={{ height: '300px', width: '100%', marginBottom: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis dataKey="time" stroke="var(--text-muted)" axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" domain={[0, 100]} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
                                />
                                <Line type="monotone" dataKey="level" stroke="var(--secondary)" strokeWidth={3} dot={{ fill: 'var(--secondary)', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Lowest: <strong style={{ color: 'var(--danger)' }}>40% (16:00)</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Last Pump: <strong style={{ color: 'var(--text-main)' }}>20:00 (Filled to 90%)</strong></span>
                    </div>
                </div>

            </div>
        </div>
    );
}
