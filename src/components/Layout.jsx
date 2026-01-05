import React from 'react';
import Navbar from './Navbar';
import PhoneUpdateModal from './PhoneUpdateModal';
import { Outlet } from 'react-router-dom';

export default function Layout() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <PhoneUpdateModal />
            <Navbar />
            <main className="container" style={{ flex: 1, paddingBottom: '2rem' }}>
                <Outlet />
            </main>
            <footer style={{
                textAlign: 'center',
                padding: '1.5rem',
                color: 'var(--text-muted)',
                fontSize: '0.875rem'
            }}>
                © {new Date().getFullYear()} AquaMonitor. All rights reserved.
            </footer>
        </div>
    );
}
