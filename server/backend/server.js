import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/send-email", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: "Email is required" });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verify transporter configuration
        await transporter.verify();

        const mailOptions = {
            from: `"AquaMonitor" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Welcome to AquaMonitor! 🌊",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #2563EB;">AquaMonitor</h1>
                    </div>
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Registration Successful!</h2>
                        <p style="color: #4b5563; line-height: 1.6;">
                            Hello,
                        </p>
                        <p style="color: #4b5563; line-height: 1.6;">
                            Welcome to <strong>AquaMonitor</strong>. We are thrilled to have you on board! Your account has been successfully created.
                        </p>
                        <p style="color: #4b5563; line-height: 1.6;">
                            You can now log in to the dashboard to monitor your water systems, track usage, and manage your devices with ease.
                        </p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://aquamoniternew.firebaseapp.com/" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                        </div>
                    </div>
                    <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
                        <p>&copy; 2025 AquaMonitor Team. All rights reserved.</p>
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Welcome Email sent successfully to " + email + ":", info.response);
        res.json({ success: true, message: "Welcome email sent successfully", info: info.response });
    } catch (error) {
        console.error("Email processing error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to send email",
            details: error.message
        });
    }
});

// Generic Email Endpoint (used by Admin Panel)
app.post("/api/send-email", async (req, res) => {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({ success: false, error: "Missing required fields (to, subject, html)" });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"AquaMonitor" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Custom Email sent successfully to " + to + ":", info.response);
        res.json({ success: true, message: "Email sent successfully", info: info.response });
    } catch (error) {
        console.error("Generic email error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to send email",
            details: error.message
        });
    }
});

app.get("/", (req, res) => {
    res.send("AquaMonitor Azure Backend is running... 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
app.post("/api/broadcast-email", async (req, res) => {
    const { users, subject, message } = req.body;

    if (!users || !subject || !message) {
        return res.status(400).json({
            success: false,
            error: "Missing users, subject or message"
        });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        for (const user of users) {
            await transporter.sendMail({
                from: `"AquaMonitor" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: subject,
                html: `
                    <h2>${subject}</h2>
                    <p>${message}</p>
                    <hr/>
                    <p style="font-size:12px;color:#777;">AquaMonitor System Notification</p>
                `
            });
        }

        res.json({
            success: true,
            message: "Broadcast email sent successfully"
        });

    } catch (error) {
        console.error("Broadcast email error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to send broadcast email",
            details: error.message
        });
    }
});