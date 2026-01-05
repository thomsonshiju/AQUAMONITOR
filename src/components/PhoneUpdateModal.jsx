import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Phone, X } from 'lucide-react';

export default function PhoneUpdateModal() {
    const { user, updateUser } = useAuth();
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');

    // Only show if user is logged in, phone is missing, AND user is not an admin
    if (!user || user.phone || user.role === 'admin') return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Proper validation: Exactly 10 digits
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        // Update user context
        updateUser({ phone });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Phone size={20} className="text-primary" />
                    Update Contact Info
                </h3>

                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    We noticed your phone number is missing. Please add it to complete your profile and receive specific alerts.
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone Number</label>
                        <input
                            type="tel"
                            placeholder="Enter your mobile number"
                            className="input-field"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Save Phone Number
                    </button>
                </form>
            </div>
        </div>
    );
}
