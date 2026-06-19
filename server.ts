import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import transactionRoutes from './backend/routes/transactionRoutes.js';
import authRoutes from './backend/routes/authRoutes.js';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Handle standard JSON payload bodies
  app.use(express.json());

  // Enforce HTTPS security simulation header (Data-In-Transit)
  app.use((req, res, next) => {
    // Force/simulate SSL environment header check
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:;");
    next();
  });

  // API router configuration
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/auth', authRoutes);

  // Lead Security Architect Interactive Chat Assistant endpoint (using Google Gen AI)
  app.post('/api/architect/chat', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Core prompt parameter is required' });
      return;
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const systemInstruction = `
      You are "Lead Arch", VaultPay's elite Lead Security Architect and Fintech PCI-compliance officer.
      Your job is to answer the user's questions about payment gateways, card industry tokenization standards (PCI DSS 4.0), data privacy laws (GDPR, CCPA), memory-level attacks (preventing stack overflows or residual register logging), and SQL Injection prevention.
      
      Always speak with deep authority, clarity, and precision. Maintain a secure, reassuring, and highly expert tone.
      Whenever referring to the VaultPay gateway:
      1. Confirm we run Data-at-Rest security by immediate tokenization via the mockPciVault service and erasing in-memory stack strings of raw PAN.
      2. Confirm We run Data-in-Process parameterized inserts using @supabase/supabase-js, neutralizing potential SQL Injection inputs.
      3. Confirm We run Data-in-Transit via simulated Strict-Transport-Security TLS rules.
      
      Keep explanations clean and formatted in neat scannable markdown with bold headers where appropriate. Do not sound generic or dry.
    `;

    if (!geminiKey || geminiKey === 'MY_GEMINI_API_KEY' || geminiKey.trim() === '') {
      // Graceful fallback for demo environments without active API keys
      res.json({
        reply: `### [Lead Arch] Secure Sandbox Response (Key Unavailable)

I am operating in **Local Sandbox Mode** because a remote \`GEMINI_API_KEY\` is not configured. However, I can confirm that the VaultPay Fortress Core is fully operational:

1. **Card Sanitization**: Any PAN supplied to \`/api/transactions/send\` is evaluated through the **Luhn Algorithm** immediately.
2. **Immediate Tokenization**: The card is swapped for a token (e.g. \`tok_pci_vp_...\`) via our isolated cryptographic vault. 
3. **Register Splitting**: All raw variables in Node memory are overwritten with garbage characters immediately after token generation.
4. **Parameterized Prepared Queries**: When the transaction SQL commands are sent, they utilize standard parameterized placeholders to block active attacks (such as SQL Injection payloads in payment memos).

*How else can I assist you in verifying our Fintech Security Architecture?*`
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 600,
        },
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      res.status(500).json({ error: `Architect service encountered an interruption: ${error.message}` });
    }
  });

  // Standard API Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', secureMode: true, pciScope: 'Tokenized-Only' });
  });

  // Serve static UI assets based on environment
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Vite] Middleware successfully mounted on top of express.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VaultPay backend server listening securely on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error in fintech gate:', err);
});
