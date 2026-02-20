import React from 'react';
import Navbar from './Navbar';

import { Outlet } from 'react-router-dom';

export default function Layout() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-body)'
        }}>
            <Navbar />
            <main className="container page-content" style={{ flex: 1 }}>
                <Outlet />
            </main>
            <footer className="hide-mobile" style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                borderTop: '1px solid var(--border-color)',
                marginTop: '2rem'
            }}>
                © {new Date().getFullYear()} AquaMonitor. All rights reserved.
            </footer>
        </div>
    );
}
