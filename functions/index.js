import { onRequest } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";
import cors from "cors";

// Initialize CORS middleware
const corsHandler = cors({ origin: true });

// Email Transporter Configuration (Using hardcoded for simplicity as in local server)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "aquamonitor2025@gmail.com",
        pass: "lvot ewmt tbuf fqdx"
    }
});

// Export a secure HTTP function that respects CORS
export const sendEmail = onRequest((req, res) => {
    // Wrap with cors to allow requests from any origin
    corsHandler(req, res, async () => {
        // Only accept POST requests
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { to, subject, html } = req.body;

        if (!to || !subject || !html) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const mailOptions = {
            from: "aquamonitor2025@gmail.com",
            to: to,
            subject: subject,
            html: html
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            res.status(200).json({ success: true, message: 'Email sent successfully', info });
        } catch (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ error: 'Failed to send email', details: error.message });
        }
    });
});
