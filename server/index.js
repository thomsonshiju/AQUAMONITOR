import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Get all users (Admin only)
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, email, phone, role, picture FROM users');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Login / Register (Combined for simplicity in this demo)
app.post('/api/auth/login', async (req, res) => {
    const { email, password, name, picture, google_id } = req.body;

    try {
        // 1. Check if user exists
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        let user = users[0];

        if (user) {
            // User exists
            // In real app: verify password hash here
            // If google login, we might update google_id if missing
            if (google_id && !user.google_id) {
                await pool.query('UPDATE users SET google_id = ?, picture = ? WHERE id = ?', [google_id, picture, user.id]);
                user.google_id = google_id;
                user.picture = picture;
            }
            // For standard login, check password (plaintext for this demo, USE BCRYPT IN PROD)
            else if (password && user.password !== password) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            res.json(user);
        } else {
            // User does not exist -> Create new user (Auto-register)
            // Determine role
            const role = email.includes('admin') ? 'admin' : 'user';

            const [result] = await pool.query(
                'INSERT INTO users (name, email, password, phone, role, picture, google_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name || 'User', email, password || null, null, role, picture || null, google_id || null]
            );

            const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            res.json(newUser[0]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create User (Admin Manual Add)
app.post('/api/users', async (req, res) => {
    const { name, email, password, phone, role } = req.body;

    // Default password if not provided? Or require it. Let's require it for now.
    // In a real app, you'd hash this password.

    try {
        // Check if user exists
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, phone, role || 'user']
        );

        const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        res.status(201).json(newUser[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update User (e.g. Phone Number)
app.put('/api/users/:email', async (req, res) => {
    const { email } = req.params;
    const { phone, name } = req.body;

    try {
        await pool.query('UPDATE users SET phone = COALESCE(?, phone), name = COALESCE(?, name) WHERE email = ?', [phone, name, email]);
        const [updatedUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        res.json(updatedUser[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete User (Admin only)
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // First delete all notifications for this user
        await pool.query('DELETE FROM notifications WHERE user_id = ?', [id]);

        // Then delete the user
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});
// ============ NOTIFICATION ENDPOINTS ============

// Get all notifications for a user
app.get('/api/notifications/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [notifications] = await pool.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get unread notification count
app.get('/api/notifications/:userId/unread-count', async (req, res) => {
    const { userId } = req.params;

    try {
        const [result] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        res.json({ count: result[0].count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create a new notification
app.post('/api/notifications', async (req, res) => {
    const { user_id, title, message, type } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [user_id, title, message, type || 'info']
        );

        const [newNotification] = await pool.query(
            'SELECT * FROM notifications WHERE id = ?',
            [result.insertId]
        );
        res.status(201).json(newNotification[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
        const [updated] = await pool.query('SELECT * FROM notifications WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Mark all notifications as read for a user
app.put('/api/notifications/:userId/read-all', async (req, res) => {
    const { userId } = req.params;

    try {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete a notification
app.delete('/api/notifications/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM notifications WHERE id = ?', [id]);
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete all notifications for a user
app.delete('/api/notifications/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
        res.json({ success: true, message: 'All notifications deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Broadcast notification to all users or specific users
app.post('/api/notifications/broadcast', async (req, res) => {
    const { title, message, type, user_ids } = req.body;

    try {
        let targetUsers = [];

        if (user_ids && user_ids.length > 0) {
            // Send to specific users
            targetUsers = user_ids;
        } else {
            // Send to all users
            const [users] = await pool.query('SELECT id FROM users');
            targetUsers = users.map(u => u.id);
        }

        // Insert notifications for all target users
        const values = targetUsers.map(userId => [userId, title, message, type || 'info']);

        if (values.length > 0) {
            await pool.query(
                'INSERT INTO notifications (user_id, title, message, type) VALUES ?',
                [values]
            );
        }

        res.json({
            success: true,
            message: `Notification sent to ${targetUsers.length} user(s)`,
            count: targetUsers.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get("/", (req, res) => {
    res.send("AquaMonitor Backend is Running ✅");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:3000`);
});
