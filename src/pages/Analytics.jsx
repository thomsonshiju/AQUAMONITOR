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
    { time: '20:00', level: 90 }, // Light motor ran
    { time: '23:59', level: 88 },
];

export default function Analytics() {
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="fade-in" style={{ paddingBottom: isMobile ? '5rem' : '2rem' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                    Data Analytics
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>
                    Historical consumption and reservoir level trends
                </p>
            </div>

            {/* Premium Insight Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)',
                gap: isMobile ? '1.25rem' : '2rem',
                marginBottom: '2rem'
            }}>
                {/* 1. Weekly Consumption Trend (Large Panel) */}
                <div className="card" style={{
                    gridColumn: isMobile ? 'span 1' : 'span 12',
                    padding: isMobile ? '1.25rem' : '2.5rem'
                }}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '2.5rem', gap: isMobile ? '1.5rem' : '0' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Consumption Velocity</h3>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Daily volume processed in Liters (Last 7 Days)</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                            <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>PEAK DAY</div>
                                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>SATURDAY (800L)</div>
                            </div>
                            <div style={{ textAlign: isMobile ? 'left' : 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>PERIOD AVG</div>
                                <div style={{ fontWeight: 700 }}>521L / day</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ height: isMobile ? '280px' : '400px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                                <YAxis stroke="var(--text-muted)" axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(var(--bg-card-rgb), 0.95)',
                                        borderRadius: '1.25rem',
                                        border: '1px solid var(--border-color)',
                                        boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                                        backdropFilter: 'blur(20px)',
                                        padding: '1rem'
                                    }}
                                    cursor={{ fill: 'rgba(var(--primary-rgb), 0.05)' }}
                                />
                                <Bar dataKey="usage" fill="var(--primary)" radius={[8, 8, 0, 0]} barSize={isMobile ? 30 : 50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Level Dynamics (Side by Side on Desktop) */}
                <div className="card" style={{
                    gridColumn: isMobile ? 'span 1' : 'span 8',
                    padding: isMobile ? '1.25rem' : '2.5rem'
                }}>
                    <h3 style={{ margin: '0 0 2rem', fontSize: '1.25rem' }}>Reservoir Level Dynamics (%)</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis dataKey="time" stroke="var(--text-muted)" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                                <YAxis stroke="var(--text-muted)" domain={[0, 100]} axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(var(--bg-card-rgb), 0.95)',
                                        borderRadius: '1.25rem',
                                        border: '1px solid var(--border-color)',
                                        padding: '1rem'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="level"
                                    stroke="var(--secondary)"
                                    strokeWidth={4}
                                    dot={{ fill: 'var(--secondary)', r: 6, strokeWidth: 3, stroke: 'var(--bg-card)' }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Operational KPIs (Stacked Beside Charts on Desktop) */}
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 4', display: 'grid', gap: '1.5rem', height: '100%' }}>
                    {[
                        { label: 'Overall Efficiency', value: '94.2%', note: 'Resource utilization', color: 'var(--success)' },
                        { label: 'Critical Thresholds', value: '2 Events', note: 'Low level alerts triggered', color: 'var(--warning)' },
                        { label: 'Estimated M-1', value: '13.5k L', note: 'Projected monthly volume', color: 'var(--text-main)' }
                    ].map((kpi, i) => (
                        <div key={i} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{kpi.label}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{kpi.note}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
