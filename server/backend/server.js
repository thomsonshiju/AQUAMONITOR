import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/send-email", async (req, res) => {
    const { email } = req.body;

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Welcome to AquaMonitor",
            text: "Your registration was successful"
        });

        res.send("Email sent successfully");
    } catch (error) {
        res.status(500).send("Email failed");
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});