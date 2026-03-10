import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Email transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "aquamonitor2025@gmail.com",
        pass: "lvot ewmt tbuf fqdx"
    }
});

// Test route
app.get("/", (req, res) => {
    res.send("AquaMonitor Email API Running");
});

// Email API
app.post("/sendEmail", async (req, res) => {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        await transporter.sendMail({
            from: "aquamonitor2025@gmail.com",
            to,
            subject,
            html
        });

        res.json({ success: true, message: "Email sent successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Email failed" });
    }
});

// IMPORTANT for Railway
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});