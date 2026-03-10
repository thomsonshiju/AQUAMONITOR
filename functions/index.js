import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";

const app = express();

app.use(cors({
    origin: ["https://aquamonitor.web.app"]
}));

app.use(express.json());

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.get("/", (req, res) => {
    res.send("AquaMonitor Email API Running");
});

app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});

app.post("/sendEmail", async (req, res) => {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        });

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Email failed" });
    }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});