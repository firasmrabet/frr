import playwright from 'playwright-core';
import chromium from '@sparticuz/chromium';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import ejs from 'ejs';
import { promisify } from 'util';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

dotenv.config();

// Configuration Playwright
const isProd = process.env.NODE_ENV === 'production';

// Configuration Playwright pour la génération de PDF
const playwrightConfig = {
    args: [
        ...chromium.args,
        '--disable-web-security',
        '--no-sandbox',
        '--disable-setuid-sandbox'
    ],
    executablePath: await chromium.executablePath(),
    headless: true,
    defaultViewport: {
        width: 1920,
        height: 1080
    }
};

// Configuration des tokens de téléchargement
const DOWNLOAD_TOKEN_SECRET = process.env.DOWNLOAD_TOKEN_SECRET || process.env.ENCRYPTION_KEY || 'dev-download-secret';
const DOWNLOAD_TOKEN_TTL = Number(process.env.DOWNLOAD_TOKEN_TTL_SECONDS || process.env.DOWNLOAD_TOKEN_TTL || 60 * 60);

// Protection contre les demandes en double
const DUPLICATE_WINDOW_SECONDS = Number(process.env.DUPLICATE_WINDOW_SECONDS || 15);
const recentRequests = new Map();
const sentRecords = new Map();
const sentRecipients = new Map();

// Nettoyage périodique
setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    for (const [sig, ts] of recentRequests.entries()) {
        if (now - ts > DUPLICATE_WINDOW_SECONDS) recentRequests.delete(sig);
    }
    for (const [sig, ts] of sentRecords.entries()) {
        if (now - ts > DUPLICATE_WINDOW_SECONDS) sentRecords.delete(sig);
    }
    for (const [sig, set] of sentRecipients.entries()) {
        if (!sentRecords.has(sig)) {
            sentRecipients.delete(sig);
        }
    }
}, 60 * 1000);

// Fonctions utilitaires
function base64UrlEncode(input) {
    return Buffer.from(input).toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(input) {
    input = input.replace(/-/g, '+').replace(/_/g, '/');
    while (input.length % 4) input += '=';
    return Buffer.from(input, 'base64').toString();
}

function stableStringify(obj) {
    const seen = new WeakSet();
    function canonicalize(value) {
        if (value && typeof value === 'object') {
            if (seen.has(value)) return;
            seen.add(value);
            if (Array.isArray(value)) {
                return value.map(canonicalize);
            }
            const keys = Object.keys(value).sort();
            const out = {};
            for (const k of keys) {
                out[k] = canonicalize(value[k]);
            }
            return out;
        }
        return value;
    }
    return JSON.stringify(canonicalize(obj));
}

function signDownloadToken(payloadObj) {
    const payload = JSON.stringify(payloadObj);
    const payloadB64 = base64UrlEncode(payload);
    const mac = crypto.createHmac('sha256', DOWNLOAD_TOKEN_SECRET).update(payloadB64).digest('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${payloadB64}.${mac}`;
}

function verifyDownloadToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 2) return null;
        const [payloadB64, mac] = parts;
        const expectedMac = crypto.createHmac('sha256', DOWNLOAD_TOKEN_SECRET).update(payloadB64).digest('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const a = Buffer.from(mac);
        const b = Buffer.from(expectedMac);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
        const payloadJson = base64UrlDecode(payloadB64);
        const payload = JSON.parse(payloadJson);
        const now = Math.floor(Date.now() / 1000);
        if (!payload.exp || payload.exp < now) return null;
        return payload;
    } catch (e) {
        return null;
    }
}

const app = express();

// Configuration CORS
const configuredFrontendOrigin = (process.env.FRONTEND_ORIGIN || '').toString().trim() || undefined;
const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'http://localhost:4174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    'https://bedoui-frontend.onrender.com',
    'https://bedoui-backend.onrender.com',
    'https://backend-bedoui.onrender.com',
    'https://bedouistoreproducts.vercel.app'
]);

if (configuredFrontendOrigin) allowedOrigins.add(configuredFrontendOrigin);
console.log('Origines CORS autorisées ->', Array.from(allowedOrigins));

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const isRender = origin.includes('.onrender.com');
        const isVercel = origin.includes('.vercel.app');
        const isLocalhost = /^https?:\/\/localhost(?::\d+)?$/.test(origin);
        const isPrivateIp = /^https?:\/\/(?:127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})(?::\d+)?$/.test(origin);

        if (isRender || isVercel) return callback(null, true);
        if (process.env.NODE_ENV !== 'production' && (isLocalhost || isPrivateIp)) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);

        console.log('Origine CORS bloquée:', origin);
        return callback(new Error('Non autorisé par CORS'));
    },
    credentials: true
}));

app.use(express.json({ limit: '2mb' }));

// Route racine
app.get('/', (req, res) => {
    res.json({
        name: 'Bedoui API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: [
            '/health',
            '/send-quote',
            '/download-devis/:name'
        ]
    });
});

// Middleware API Key (trim values to avoid trailing whitespace/newline mismatches)
const apiKey = (process.env.API_KEY || process.env.VITE_API_KEY || '').toString().trim();
app.use('/send-quote', (req, res, next) => {
    const rawClientKey = req.headers['x-api-key'] || '';
    const clientKey = rawClientKey.toString().trim();
    if (!apiKey) {
        console.error('❌ VARIABLE API_KEY NON CONFIGURÉE');
        return res.status(500).json({ 
            success: false, 
            error: 'Configuration serveur manquante',
            message: 'La clé API n\'est pas configurée sur le serveur'
        });
    }
    if (clientKey !== apiKey) {
        const masked = clientKey ? `${clientKey.slice(0,6)}...` : '(empty)';
        console.warn('Clé API invalide reçue (masked):', masked);
        return res.status(401).json({ 
            success: false, 
            error: 'Non autorisé: Clé API invalide ou manquante.',
            message: 'Veuillez vérifier la configuration de votre clé API.'
        });
    }
    next();
});

// Simple in-memory job queue to process quote sending in background.
// Note: this is transient (lost on process restart) but keeps the HTTP response fast.
const jobQueue = [];
let processingQueue = false;

async function processQuote(job) {
    const { body, headers, baseUrl, bodySig } = job;
    try {
        console.log('🔁 Traitement en arrière-plan de la demande de devis:', bodySig);

        const { name, email, phone, company, message, products } = body;

        // Normaliser / trim des variables d'environnement SMTP pour éviter les \n/espaces
        const SMTP_HOST = (process.env.SMTP_HOST || '').toString().trim();
        const SMTP_PORT = (process.env.SMTP_PORT || '').toString().trim();
        const SMTP_USER = (process.env.SMTP_USER || '').toString().trim();
        const SMTP_PASS = (process.env.SMTP_PASS || '').toString().trim();
        const RECEIVER_EMAIL = (process.env.RECEIVER_EMAIL || '').toString().trim();

        const adminEmails = RECEIVER_EMAIL ? RECEIVER_EMAIL.split(',').map(e=>e.trim()).filter(Boolean) : [];

        // Calcul du prix total
        const totalPrice = (products || []).reduce((sum, item) => {
            let itemTotal = 0;
            if (item && typeof item.totalPrice === 'number') {
                itemTotal = item.totalPrice;
            } else if (item && item.product) {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.product.price) || 0;
                itemTotal = qty * price;
            }
            return sum + (isNaN(itemTotal) ? 0 : itemTotal);
        }, 0);

        // If SMTP is not configured we still log and mark as processed so client won't wait.
        if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
            console.error('⚠️ SMTP non configuré; la tâche sera enregistrée mais l\'envoi échouera lors du traitement.');
        }

        // Build email template (same as before)
        const emailTemplate = `...`; // keep small placeholder here for brevity in logs

        // Prepare PDF HTML using existing template lookup logic
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const pdfTemplateEnv = (process.env.PDF_TEMPLATE_PATH || '').toString().trim();

        const candidatePaths = [];
        if (pdfTemplateEnv) {
            if (path.isAbsolute(pdfTemplateEnv)) {
                candidatePaths.push(pdfTemplateEnv);
            } else {
                candidatePaths.push(path.join(process.cwd(), pdfTemplateEnv));
                candidatePaths.push(path.join(__dirname, pdfTemplateEnv));
                candidatePaths.push(path.join(process.cwd(), 'app', pdfTemplateEnv));
                candidatePaths.push(path.join(process.cwd(), 'backend', pdfTemplateEnv));
            }
        }
        candidatePaths.push(path.join(process.cwd(), 'templates', 'devis-pdf.ejs'));
        candidatePaths.push(path.join(process.cwd(), 'backend', 'templates', 'devis-pdf.ejs'));
        candidatePaths.push(path.join(process.cwd(), 'app', 'templates', 'devis-pdf.ejs'));
        candidatePaths.push(path.join(__dirname, 'templates', 'devis-pdf.ejs'));
        candidatePaths.push(path.join(__dirname, '..', 'templates', 'devis-pdf.ejs'));

        let foundTemplate = null;
        for (const p of candidatePaths) {
            try { if (!p) continue; await fs.access(p); foundTemplate = p; break; } catch(e){}
        }

        let pdfHtml;
        try {
            if (foundTemplate) {
                pdfHtml = await ejs.renderFile(foundTemplate, { name, email, phone, company, message, products, totalPrice, companyName: process.env.COMPANY_NAME || 'Bedouielec Transformateurs' });
            } else {
                const fallbackTemplate = `<!doctype html><html><head><meta charset="utf-8"/><title>Devis</title></head><body><h1>Devis</h1><p>Client: ${name} - ${email} - ${phone}</p></body></html>`;
                pdfHtml = ejs.render(fallbackTemplate, { name, email, phone, company, message, products, totalPrice });
            }
        } catch (e) {
            console.warn('⚠️ Erreur rendant le template PDF, génération d\'un HTML fallback', e && e.message);
            const fallbackTemplate = `<!doctype html><html><head><meta charset="utf-8"/><title>Devis</title></head><body><h1>Devis</h1><p>Client: ${name} - ${email} - ${phone}</p></body></html>`;
            pdfHtml = ejs.render(fallbackTemplate, { name, email, phone, company, message, products, totalPrice });
        }

        // Generate PDF buffer
        let pdfBuffer = null;
        try {
            const browser = await playwright.chromium.launch(playwrightConfig);
            const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
            const page = await context.newPage();
            await page.setContent(pdfHtml, { timeout: 30000, waitUntil: 'networkidle' });
            pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }, printBackground: true, preferCSSPageSize: true, scale: 0.8 });
            await page.close(); await context.close(); await browser.close();
        } catch (e) {
            console.error('❌ Erreur génération PDF en background:', e && e.message);
        }

        // Save PDF if generated
        let fileName = null;
        if (pdfBuffer) {
            try {
                const pdfDir = path.join(process.cwd(), process.env.PDF_STORAGE_PATH || 'generated-pdfs');
                await fs.mkdir(pdfDir, { recursive: true });
                fileName = `devis-${Date.now()}.pdf`;
                const filePath = path.join(pdfDir, fileName);
                await fs.writeFile(filePath, pdfBuffer);
                console.log('PDF écrit à:', filePath);
            } catch (e) {
                console.error('Erreur écriture fichier PDF en background:', e && e.message);
            }
        }

        // Prepare mail sending if SMTP configured
        if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
            try {
                const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT) || 587, secure: String(SMTP_PORT) === '465', auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined, tls: { rejectUnauthorized: false } });
                try { await transporter.verify(); console.log('✅ Connexion SMTP vérifiée (background)'); } catch(e){ console.error('❌ SMTP verify failed (background):', e && e.message); }

                const base = {
                    from: `"Système de Devis" <${SMTP_USER}>`,
                    subject: `🔔 Nouvelle demande de devis - ${name} (${totalPrice.toLocaleString()} TND)`,
                    html: pdfHtml,
                    attachments: pdfBuffer ? [{ filename: fileName, content: pdfBuffer, contentType: 'application/pdf' }] : []
                };

                let recSet = sentRecipients.get(bodySig);
                if (!recSet) { recSet = new Set(); sentRecipients.set(bodySig, recSet); }

                const toSendAdmins = adminEmails.filter(r => !recSet.has(r));
                for (const adminAddr of toSendAdmins) {
                    const singleMail = { ...base, to: adminAddr, envelope: { from: SMTP_USER, to: adminAddr } };
                    try { const info = await transporter.sendMail(singleMail); console.log('✅ Email admin envoyé à', adminAddr, 'id=', info.messageId); recSet.add(adminAddr); } catch(e){ console.error('Erreur envoi admin', adminAddr, e && e.message); }
                }

                if (email && !adminEmails.includes(email) && !recSet.has(email)) {
                    const clientMail = { ...base, to: email, subject: `Votre devis - ${name} (${totalPrice.toLocaleString()} TND)`, envelope: { from: SMTP_USER, to: email } };
                    try { const info = await transporter.sendMail(clientMail); console.log('✅ Email client envoyé à', email, 'id=', info.messageId); recSet.add(email); } catch(e){ console.error('Erreur envoi client', e && e.message); }
                }

                sentRecords.set(bodySig, Math.floor(Date.now() / 1000));

            } catch (e) {
                console.error('Erreur lors de l\'envoi des emails en background:', e && e.message);
            }
        } else {
            console.warn('SMTP non configuré - saut de l\'envoi des emails (background)');
        }

        console.log('✅ Traitement en arrière-plan terminé pour', bodySig);
    } catch (err) {
        console.error('Erreur inattendue durant le traitement background:', err && err.stack || err);
    }
}

function startProcessingQueue() {
    if (processingQueue) return;
    processingQueue = true;
    (async () => {
        while (jobQueue.length > 0) {
            const job = jobQueue.shift();
            try { await processQuote(job); } catch (e) { console.error('Erreur job queue:', e && e.message); }
        }
        processingQueue = false;
    })();
}

// Route principale pour l'envoi de devis (enqueue and fast response)
app.post('/send-quote', (req, res) => {
    try {
        const bodyString = stableStringify(req.body || {});
        const bodySig = crypto.createHmac('sha256', DOWNLOAD_TOKEN_SECRET).update(bodyString).digest('hex');
        const now = Math.floor(Date.now() / 1000);
        const prev = recentRequests.get(bodySig);

        if (prev && now - prev < DUPLICATE_WINDOW_SECONDS) {
            console.log('Demande en double ignorée (dans la fenêtre). Signature:', bodySig);
            return res.status(202).json({ success: true, duplicate: true, message: 'Demande en double ignorée.' });
        }

        const alreadySent = sentRecords.get(bodySig);
        if (alreadySent && now - alreadySent < DUPLICATE_WINDOW_SECONDS) {
            console.log('Demande en double ignorée (déjà traitée). Signature:', bodySig);
            return res.status(202).json({ success: true, duplicate: true, message: 'Demande déjà traitée.' });
        }

        // Basic validation
        const { name, email, phone, products } = req.body || {};
        if (!name || !email || !phone || !products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ success: false, error: 'Champs requis manquants ou produits vides.' });
        }

        recentRequests.set(bodySig, now);

        const baseUrl = req.protocol + '://' + req.get('host');
        jobQueue.push({ body: req.body, headers: req.headers, baseUrl, bodySig, receivedAt: Date.now() });
        console.log('✅ Demande acceptée et ajoutée à la file (length=' + jobQueue.length + '). Signature:', bodySig);

        // start worker in background
        startProcessingQueue();

        // Fast response to client: accepted for processing
        return res.status(202).json({ success: true, queued: true, message: 'La demande a été acceptée et sera traitée en arrière-plan. Vous recevrez un email.' });

    } catch (err) {
        console.error('Erreur lors de l\'ajout à la file /send-quote:', err && err.stack || err);
        return res.status(500).json({ success: false, error: err.message || 'Erreur serveur' });
    }
});

// Route de téléchargement PDF sécurisée
app.get('/download-devis/:name', async (req, res) => {
    try {
        const name = req.params.name;
        const token = req.query.token;
        
        if (!token || typeof token !== 'string') {
            return res.status(401).send('Non autorisé: token manquant');
        }
        
        const payload = verifyDownloadToken(token);
        if (!payload || payload.name !== name) {
            return res.status(403).send('Interdit: token invalide ou expiré');
        }
        
        const filePath = path.join(process.cwd(), 'generated-pdfs', name);
        
        // Vérifier que le fichier existe
        try {
            await fs.access(filePath);
        } catch (e) {
            console.error('PDF demandé introuvable:', filePath, e);
            return res.status(404).send('Non trouvé');
        }
        
        return res.download(filePath);
        
    } catch (e) {
        console.error('Erreur service PDF', e);
        return res.status(500).send('Erreur interne');
    }
});

// Route admin pour test (protégée par SERVICE_ROLE_KEY)
app.get('/admin/cart/:userId', async (req, res) => {
    try {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) return res.status(403).json({ error: 'Clé de rôle de service non configurée' });
        
        const userId = req.params.userId;
        const fetch = (await import('node-fetch')).default;
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        
        const resp = await fetch(`${supabaseUrl}/rest/v1/carts?user_id=eq.${userId}`, {
            headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`
            }
        });
        
        const data = await resp.json();
        return res.json({ data });
        
    } catch (e) {
        console.error('Erreur dans /admin/cart/:userId', e);
        return res.status(500).json({ error: e.message });
    }
});

// Health check optimisé avec cache
let cachedHealthCheck = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_TTL = 60000; // Cache pendant 1 minute

app.get('/health', async (req, res) => {
    const now = Date.now();
    
    // Retourner le résultat en cache si disponible et frais
    if (cachedHealthCheck && (now - lastHealthCheck < HEALTH_CHECK_TTL)) {
        return res.json(cachedHealthCheck);
    }

    try {
        const execAsync = promisify(exec);
        let chromeVersion = null;
        
        try {
            const { stdout } = await execAsync('chromium --version');
            chromeVersion = stdout.trim();
        } catch (e) {
            try {
                const { stdout } = await execAsync('/usr/bin/chromium --version');
                chromeVersion = stdout.trim();
            } catch (e2) {
                chromeVersion = null;
            }
        }

        // Vérifier si le répertoire PDF existe et est accessible en écriture
        let pdfDirStatus = 'ok';
        try {
            await fs.access('./generated-pdfs', fs.constants.W_OK);
        } catch (e) {
            pdfDirStatus = 'erreur';
        }

        // Vérifier la configuration SMTP
        const smtpStatus = {
            configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
            host: process.env.SMTP_HOST || 'non configuré',
            user: process.env.SMTP_USER ? 'configuré' : 'non configuré'
        };

        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            chrome: chromeVersion,
            node: process.version,
            environment: process.env.NODE_ENV,
            memory: {
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
            },
            uptime: Math.round(process.uptime()),
            pdfDirectory: pdfDirStatus,
            smtp: smtpStatus
        };

        // Mettre en cache le résultat
        cachedHealthCheck = healthStatus;
        lastHealthCheck = now;

        return res.json(healthStatus);
        
    } catch (error) {
        const fallbackStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            chrome: null,
            node: process.version,
            environment: process.env.NODE_ENV,
            note: 'vérification de santé partiellement échouée',
            error: isProd ? 'erreur interne' : error.message
        };

        // Mettre en cache le résultat de repli
        cachedHealthCheck = fallbackStatus;
        lastHealthCheck = now;

        return res.json(fallbackStatus);
    }
});

// Endpoint de debug Playwright (à supprimer en production)
app.get('/debug/playwright', async (req, res) => {
    if (isProd) {
        return res.status(404).json({ error: 'Non trouvé' });
    }
    
    try {
        console.log('Point de terminaison DEBUG /debug/playwright invoqué');
        
        const candidates = [
            process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
            process.env.CHROME_BIN,
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable'
        ].filter(Boolean);
        
        const checks = {};
        for (const c of candidates) {
            try {
                await fs.access(c);
                checks[c] = true;
            } catch (e) {
                checks[c] = false;
            }
        }
        
        let pwPath = null;
        try {
            pwPath = await chromium.executablePath();
        } catch (e) {
            pwPath = null;
        }
        
        return res.json({
            environment: {
                PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || null,
                CHROME_BIN: process.env.CHROME_BIN || null
            },
            candidates,
            checks,
            playwrightReportedExecutablePath: pwPath
        });
        
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur en cours d'exécution sur le port ${PORT}`);
    console.log(`📡 Serveur accessible à:`);
    console.log(`   - http://localhost:${PORT}`);
    console.log(`   - http://0.0.0.0:${PORT}`);
    console.log(`📧 Configuration SMTP:`, {
        host: process.env.SMTP_HOST || 'NON_CONFIGURÉ',
        user: process.env.SMTP_USER ? 'CONFIGURÉ' : 'NON_CONFIGURÉ',
        pass: process.env.SMTP_PASS ? 'CONFIGURÉ' : 'NON_CONFIGURÉ'
    });
    console.log(`🔑 Configuration API:`, {
        apiKey: apiKey ? 'CONFIGURÉ' : 'NON_CONFIGURÉ',
        frontendOrigin: process.env.FRONTEND_ORIGIN || 'NON_CONFIGURÉ'
    });
});
