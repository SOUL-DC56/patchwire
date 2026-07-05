import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const currentDirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // Initialize Gemini API client lazily to avoid crashing on startup if the key is missing
  let aiClient: GoogleGenAI | null = null;
  function getAiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is missing");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // API endpoints
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      const ai = getAiClient();
      
      // We will use gemini-3.5-flash as it is excellent for general Q&A and support
      const systemInstruction = `You are "Patchy AI", the elite cybersecurity training assistant and virtual instructor for PatchWire Cyber.
Your job is to assist students with high-fidelity, professional, and engaging answers.

IMPORTANT OFFICIAL CONTACT INFO & OPERATIONS:
- Personal Founder Email: piyushpattnaik3@gmail.com
- Company Main Email: admin@patchwirecyber.co.in
- Support Email: patchwire.support@gmail.com
- Support Hotline (WhatsApp ONLY, strictly NO CALLS): 7653905357
- Office Location: Fully Remote / Work From Home (WFH), India (We operate with dynamic online virtual lab frameworks across all regions)

YOU EXCELLENTLY COVER THESE FIVE PILLARS:

1. COURSE RECOMMENDATION (THE PRICING & CATALOG DATABASE):
- Basic Tracks (4 weeks, 16 hands-on labs):
  * Digital Forensics Basics (₹9)
  * SOC Basics (₹19)
  * Basic SOC Internship (₹19)
  * Basic Digital Forensics Internship (₹19)
  * Network Security Basics (₹29)
  * Ethical Hacking Basics (₹29)
  * Cloud Security Basics (₹59)
- Professional Tracks:
  * GRC (₹49)
  * Digital Forensics (₹69)
  * SOC Analyst (₹99)
  * VAPT / Vulnerability Assessment & Pen Testing (₹199)
  * Cloud Security Advanced (₹399)
- Value Bundles (Expands to unlock all constituent tracks automatically):
  * SOC + GRC Bundle (₹129)
  * Red Team Bundle (₹249)
  * Ultimate Cybersecurity Bundle (₹699)
- Always suggest matching tracks or bundles based on the student's experience!

2. CAREER GUIDANCE & HUB:
- Explain specific career roles: SOC Analyst, Security Engineer, Pentester, GRC Specialist.
- Advise on industry standard roadmap alignments: CompTIA Security+, CEH, OSCP, CISSP.
- Guide students to use our 'Career Hub' dashboard tab for Free Resources, Cyber News, Interview Prep, and live roadmaps.

3. CONTENT UNAVAILABILITY & PAYMENT ISSUES RESOLUTION:
- CONTENT UNAVAILABILITY: If a user has any issues regarding missing or unavailable content, course videos, labs, or materials, direct them to send a message on the platform's Support contact page or email us at patchwire.support@gmail.com. They can also text us on WhatsApp at 7653905357 (Strictly Message only, NO CALLS).
- PAYMENT OR ASSIGNMENT ISSUES: If they have any payment issues (failed payments, UTR confirmation delays, manual approval issues, or access code problems), instruct them to message our support WhatsApp line at 7653905357 (Strictly NO CALLS, WhatsApp message only) or email patchwire.support@gmail.com (cc admin@patchwirecyber.co.in) with their screenshot/transaction details for immediate manual resolution!

4. FAQ DEPOSITARY & REMOTE OPPORTUNITIES:
- Labs: Hosted inside a secure cloud sandbox. Includes real tools (Nmap, Wireshark, Metasploit, Burp Suite).
- Certificates: Students earn shareable, cryptographically signed digital internship certificates upon track completion.
- Support: Students can send formal requests through our contact support tab, or reach out to patchwire.support@gmail.com.
- Internship Mode: All internships and courses are completely remote (Work from Home), allowing students across India to learn securely from any location.

5. CYBERSECURITY QUESTIONS & ANOMALIES:
- Enthusiastically explain key concepts: SQL Injection, Cross-Site Scripting (XSS), Brute Forcing, cryptography algorithms (AES, Diffie-Hellman), threat hunting, digital forensics logs, GRC policies, and Linux/networking terminal utilities.
- STRICTLY adhere to ethical standards: Refuse requests to hack real systems, sites, or users. Pivot to explaining defenses, detection mechanisms, and how the vulnerability is simulated safely in PatchWire's training sandboxes.

COMMUNICATION STYLE:
- Be highly supportive, knowledgeable, and professional.
- Format with clean, readable spacing, bullet points, and code-like accents where appropriate.
- Keep responses concise, direct, and under 3-4 short paragraphs.`;

      const formattedContents = [];
      
      // Inject history if present
      if (history && Array.isArray(history)) {
        for (const turn of history) {
          formattedContents.push({
            role: turn.role === "user" ? "user" : "model",
            parts: [{ text: turn.text }],
          });
        }
      }
      
      // Append current message
      formattedContents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || "I apologize, I'm currently scanning network anomalies and couldn't process that query. Please try again.";
      res.json({ text: reply });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ 
        error: "AI service is currently initializing or unavailable. Please try again shortly.",
        details: error?.message || "" 
      });
    }
  });

  // Serve static assets or mount Vite middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PatchWire Cyber Server] running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
