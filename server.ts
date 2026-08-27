import "dotenv/config";
import express from "express";
import { put, del } from '@vercel/blob';
import multer from 'multer';

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  setDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  runTransaction,
  arrayUnion
} from "firebase/firestore";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";
import { parseSenaiItemsFromCSV } from "./src/lib/csvParser.js";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Configurações SMTP Diretas no Código (Garantia de Envio sem dependência exclusiva de .env)
const DIRECT_SMTP_USER = "admregionalvitoria@gmail.com";
const DIRECT_SMTP_PASS = "otyxtqbjhwgkdvuq";
const DIRECT_SMTP_HOST = "smtp.gmail.com";
const DIRECT_SMTP_PORT = 587;
const DIRECT_SMTP_FROM = '"SENAI Porto" <admregionalvitoria@gmail.com>';

// SMTP - O transporter é criado a cada envio para garantir que as variáveis
// de ambiente da Vercel sejam lidas no momento certo (serverless-safe)
function createTransporter() {
  const smtpUser = (process.env.SMTP_USER || DIRECT_SMTP_USER).trim();
  const smtpPass = (process.env.SMTP_PASS || DIRECT_SMTP_PASS).replace(/\s+/g, '');
  const smtpHost = (process.env.SMTP_HOST || DIRECT_SMTP_HOST).trim();
  const smtpPort = Number(process.env.SMTP_PORT) || DIRECT_SMTP_PORT;
  const isGmail = smtpHost.toLowerCase().includes('gmail') || smtpUser.toLowerCase().includes('@gmail.com');

  const config: any = isGmail ? {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: smtpUser, pass: smtpPass },
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 25000,
    tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
  } : {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    requireTLS: smtpPort === 587,
    auth: { user: smtpUser, pass: smtpPass },
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 25000,
    tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
  };

  return nodemailer.createTransport(config);
}

async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.warn("⚠️ [E-mail] Destinatário inválido ou não informado:", to);
    return { success: false, error: "Destinatário inválido" };
  }

  const smtpUser = (process.env.SMTP_USER || DIRECT_SMTP_USER).trim();
  const smtpPass = (process.env.SMTP_PASS || DIRECT_SMTP_PASS).replace(/\s+/g, '');

  try {
    const transporter = createTransporter();

    const fromAddress = process.env.SMTP_FROM || DIRECT_SMTP_FROM;
    const plainText = text || html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Remover emojis e colchetes do assunto para garantir 100% de entrega no Outlook
    const cleanSubject = subject
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const mailOptions = {
      from: fromAddress,
      to: to.trim(),
      replyTo: smtpUser,
      subject: cleanSubject || subject,
      text: plainText,
      html,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'SENAI-Solicitacoes-Porto/2.0'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [E-mail] Enviado com sucesso para ${to}: "${cleanSubject}" (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ [E-mail] Erro ao enviar para ${to}:`, error);
    return { success: false, error: error.message || String(error) };
  }
}

// Firebase Configuration
let firebaseConfig: any = {};
try {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } else {
    firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };
  }
} catch (e) {
  console.error("Error loading Firebase config:", e);
}

const isDummyFirebase = !firebaseConfig.projectId || 
                        firebaseConfig.projectId === "remixed-project-id" || 
                        firebaseConfig.projectId === "your-project-id" ||
                        firebaseConfig.projectId === "" ||
                        firebaseConfig.apiKey === "remixed-api-key" ||
                        firebaseConfig.apiKey === "your-api-key";

interface LocalDBData {
  users: any[];
  tickets: any[];
  comments: any[];
  loans: any[];
  purchases: any[];
  availableItems?: any[];
  availableItemsMeta?: { lastUpdated?: string; updatedBy?: string; totalSenaiItems?: number };
  counters: { tickets: number; purchases?: number };
}

class LocalDatabase {
  private filePath: string;
  private data: LocalDBData;

  constructor() {
    this.filePath = path.join(__dirname, 'data_store.json');
    this.data = {
      users: [],
      tickets: [],
      comments: [],
      loans: [],
      purchases: [],
      availableItems: [],
      availableItemsMeta: {},
      counters: { tickets: 0, purchases: 0 }
    };
    this.load();
    this.seedAdminIfNeeded();
    this.seedSenaiItemsIfNeeded();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = [];
        if (!this.data.tickets) this.data.tickets = [];
        if (!this.data.comments) this.data.comments = [];
        if (!this.data.loans) this.data.loans = [];
        if (!this.data.purchases) this.data.purchases = [];
        if (!this.data.availableItems) this.data.availableItems = [];
        if (!this.data.availableItemsMeta) this.data.availableItemsMeta = {};
        if (!this.data.counters) this.data.counters = { tickets: 0, purchases: 0 };
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to load local DB:", e);
    }
  }

  private seedSenaiItemsIfNeeded() {
    try {
      if (!this.data.availableItems || this.data.availableItems.length === 0) {
        const baseCsvPath = path.join(__dirname, 'Consulta de Itens - Atas e Contratos - Agosto 3(BASE DE DADOS).csv');
        if (fs.existsSync(baseCsvPath)) {
          const buffer = fs.readFileSync(baseCsvPath);
          const senaiItems = parseSenaiItemsFromCSV(buffer);
          if (senaiItems.length > 0) {
            this.data.availableItems = senaiItems;
            this.data.availableItemsMeta = {
              lastUpdated: new Date().toISOString(),
              updatedBy: "Base Inicial (CSV SENAI)",
              totalSenaiItems: senaiItems.length
            };
            this.save();
            console.log(`📦 [LocalDB] Inicializados ${senaiItems.length} itens do SENAI a partir do CSV base.`);
          }
        }
      }
    } catch (err) {
      console.error("Error seeding SENAI items from base CSV:", err);
    }
  }

  getAvailableItems() {
    this.load();
    // Fallback if empty
    if (!this.data.availableItems || this.data.availableItems.length === 0) {
      this.seedSenaiItemsIfNeeded();
    }
    return {
      items: this.data.availableItems || [],
      meta: this.data.availableItemsMeta || {}
    };
  }

  setAvailableItems(
    items: any[],
    updatedBy: string = "Sistema",
    mode: 'replace' | 'merge' = 'replace',
    resolveConflicts: 'check' | 'overwrite' | 'ignore' = 'check'
  ) {
    this.load();
    const existing = this.data.availableItems || [];

    if (mode === 'replace') {
      this.data.availableItems = items;
      this.data.availableItemsMeta = {
        lastUpdated: new Date().toISOString(),
        updatedBy,
        totalSenaiItems: items.length
      };
      this.save();
      return {
        success: true,
        count: items.length,
        meta: this.data.availableItemsMeta,
        message: `Base zerada e ${items.length} novos itens do SENAI importados!`
      };
    }

    // mode === 'merge'
    const conflicts: any[] = [];
    const newItems: any[] = [];

    const existingMapByCode = new Map<string, any>();
    const existingMapByName = new Map<string, any>();

    for (const item of existing) {
      if (item.codigo) existingMapByCode.set(item.codigo.toString().trim(), item);
      if (item.full_name) existingMapByName.set(item.full_name.toLowerCase().trim(), item);
    }

    for (const incoming of items) {
      const incCode = incoming.codigo ? incoming.codigo.toString().trim() : '';
      const incName = incoming.full_name ? incoming.full_name.toLowerCase().trim() : '';

      const match = (incCode && existingMapByCode.get(incCode)) || (incName && existingMapByName.get(incName));

      if (match) {
        conflicts.push({
          codigo: incoming.codigo || match.codigo,
          existing: match,
          incoming
        });
      } else {
        newItems.push(incoming);
      }
    }

    if (conflicts.length > 0 && resolveConflicts === 'check') {
      return {
        hasConflicts: true,
        conflicts,
        newItemsCount: newItems.length,
        totalCsvItems: items.length,
        message: `Foram encontrados ${conflicts.length} conflito(s) com itens já existentes.`
      };
    }

    let finalItems: any[] = [];

    if (resolveConflicts === 'overwrite') {
      const conflictCodes = new Set(conflicts.map(c => c.codigo?.toString().trim()));
      const conflictNames = new Set(conflicts.map(c => c.incoming?.full_name?.toLowerCase().trim()));

      const filteredExisting = existing.filter(ex => {
        const exCode = ex.codigo ? ex.codigo.toString().trim() : '';
        const exName = ex.full_name ? ex.full_name.toLowerCase().trim() : '';
        return !conflictCodes.has(exCode) && !conflictNames.has(exName);
      });

      finalItems = [...filteredExisting, ...items];
    } else if (resolveConflicts === 'ignore') {
      finalItems = [...existing, ...newItems];
    } else {
      finalItems = [...existing, ...newItems];
    }

    this.data.availableItems = finalItems;
    this.data.availableItemsMeta = {
      lastUpdated: new Date().toISOString(),
      updatedBy,
      totalSenaiItems: finalItems.length
    };
    this.save();

    return {
      success: true,
      count: finalItems.length,
      conflictsResolved: conflicts.length,
      meta: this.data.availableItemsMeta,
      message: `Itens adicionados/mesclados com sucesso! Total no banco: ${finalItems.length} itens.`
    };
  }



  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to save local DB:", e);
    }
  }

  private seedAdminIfNeeded() {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin";
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@2026";
    const hasAdmin = this.data.users.some(u => u.email.toLowerCase() === adminEmail.toLowerCase());
    if (!hasAdmin) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      this.data.users.push({
        id: "local-admin-id",
        name: "Administrador",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        departments: ["TI", "Manutenção", "Limpeza", "Supervisão", "Compras", "ADM"],
        unit: "Todas"
      });
      this.save();
    }
  }

  getUsers() {
    this.load();
    return this.data.users;
  }

  getUser(id: string) {
    this.load();
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string) {
    this.load();
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user: any) {
    this.load();
    const id = "user_" + Math.random().toString(36).substring(2, 11);
    const newUser = { id, ...user };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id: string, updates: any) {
    this.load();
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  deleteUser(id: string) {
    this.load();
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  getTickets() {
    this.load();
    return this.data.tickets;
  }

  getTicket(id: string) {
    this.load();
    return this.data.tickets.find(t => t.id === id || String(t.numeric_id) === String(id));
  }

  addTicket(ticket: any) {
    this.load();
    const id = "ticket_" + Math.random().toString(36).substring(2, 11);
    this.data.counters.tickets = (this.data.counters.tickets || 0) + 1;
    const numeric_id = this.data.counters.tickets;
    const newTicket = { id, numeric_id, ...ticket };
    this.data.tickets.push(newTicket);
    this.save();
    return newTicket;
  }

  updateTicket(id: string, updates: any) {
    this.load();
    const idx = this.data.tickets.findIndex(t => t.id === id || String(t.numeric_id) === String(id));
    if (idx !== -1) {
      this.data.tickets[idx] = { ...this.data.tickets[idx], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  deleteTicket(id: string) {
    this.load();
    const initialLen = this.data.tickets.length;
    this.data.tickets = this.data.tickets.filter(t => t.id !== id && String(t.numeric_id) !== String(id));
    if (this.data.tickets.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  getComments(ticket_id: string) {
    this.load();
    return this.data.comments.filter(c => c.ticket_id === ticket_id);
  }

  addComment(comment: any) {
    this.load();
    const id = "comment_" + Math.random().toString(36).substring(2, 11);
    const newComment = { id, ...comment };
    this.data.comments.push(newComment);
    this.save();
    return newComment;
  }

  getLoans() {
    this.load();
    return this.data.loans;
  }

  getLoan(id: string) {
    this.load();
    return this.data.loans.find(l => l.id === id);
  }

  addLoan(loan: any) {
    this.load();
    const id = "loan_" + Math.random().toString(36).substring(2, 11);
    const newLoan = { id, ...loan };
    this.data.loans.push(newLoan);
    this.save();
    return newLoan;
  }

  updateLoan(id: string, updates: any) {
    this.load();
    const idx = this.data.loans.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.data.loans[idx] = { ...this.data.loans[idx], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  getPurchases() {
    this.load();
    return this.data.purchases || [];
  }

  getPurchase(id: string) {
    this.load();
    return (this.data.purchases || []).find(p => p.id === id || String(p.numeric_id) === String(id));
  }

  addPurchase(purchase: any) {
    this.load();
    if (!this.data.purchases) this.data.purchases = [];
    if (!this.data.counters) this.data.counters = { tickets: 0, purchases: 0 };
    this.data.counters.purchases = ((this.data.counters as any).purchases || 0) + 1;
    const numeric_id = (this.data.counters as any).purchases;
    const id = "purchase_" + Math.random().toString(36).substring(2, 11);
    const newPurchase = { id, numeric_id, ...purchase };
    this.data.purchases.push(newPurchase);
    this.save();
    return newPurchase;
  }

  updatePurchase(id: string, updates: any) {
    this.load();
    if (!this.data.purchases) this.data.purchases = [];
    const idx = this.data.purchases.findIndex(p => p.id === id || String(p.numeric_id) === String(id));
    if (idx !== -1) {
      this.data.purchases[idx] = { ...this.data.purchases[idx], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  deletePurchase(id: string) {
    this.load();
    if (!this.data.purchases) return false;
    const initialLen = this.data.purchases.length;
    this.data.purchases = this.data.purchases.filter(p => p.id !== id && String(p.numeric_id) !== String(id));
    if (this.data.purchases.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

const localDb = new LocalDatabase();

let db: any;
try {
  if (firebaseConfig.projectId && !isDummyFirebase) {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized for project:", firebaseConfig.projectId);
  } else {
    console.warn("Firebase Project ID is missing or is dummy. Local Database fallback enabled.");
  }
} catch (e) {
  console.error("Firebase initialization failed, enabling Local Database fallback:", e);
}

const app = express();
app.use(express.json());

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1] || req.query.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
};

const upload = multer({ storage: multer.memoryStorage() });

// In-Memory Blob Storage Mock/Fallback
const inMemoryBlobs = new Map<string, { buffer: Buffer; mimeType: string; originalname: string; pathname: string }>();

// --- API Routes ---

app.get("/api/files", authenticate, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: "No url provided" });
    
    if (inMemoryBlobs.has(url)) {
      const blob = inMemoryBlobs.get(url)!;
      res.setHeader('Content-Type', blob.mimeType);
      return res.send(blob.buffer);
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      const response = await fetch(url, {
        headers: process.env.BLOB_READ_WRITE_TOKEN ? {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
        } : {}
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch file" });
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType) res.setHeader('Content-Type', contentType);
      
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }

    return res.status(404).json({ error: "File not found" });
  } catch (error: any) {
    console.error("File proxy error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Upload Route
app.post("/api/upload", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`tickets/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
          access: 'private'
        });
        return res.json({ url: blob.url, path: blob.pathname });
      } catch (blobErr) {
        console.warn("Vercel Blob put failed, falling back to in-memory store:", blobErr);
      }
    }
    
    const id = `tickets/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    inMemoryBlobs.set(id, {
      buffer: req.file.buffer,
      mimeType: req.file.mimetype || 'application/octet-stream',
      originalname: req.file.originalname,
      pathname: id
    });
    res.json({ url: `/api/files?url=${encodeURIComponent(id)}`, path: id });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/upload", authenticate, async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) return res.status(400).json({ error: "No path provided" });
    
    if (inMemoryBlobs.has(path)) {
      inMemoryBlobs.delete(path);
      return res.json({ success: true });
    }

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(path);
      } catch (delErr) {
        console.warn("Vercel Blob del failed:", delErr);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Public: Open Ticket
app.post("/api/tickets", async (req, res) => {
  const payload = req.body;
  const now = new Date().toISOString();
  
  if (isDummyFirebase) {
    try {
      const ticket = localDb.addTicket({
        ...payload,
        status: 'aberto',
        last_status_change_at: now,
        created_at: now,
        total_time_ms: 0,
        assigned_technician_id: null,
        history: [{
          status: 'aberto',
          changed_at: now,
          changed_by_name: payload.requester_name || "Sistema"
        }]
      });
      return res.json({ id: ticket.id, numeric_id: ticket.numeric_id });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) {
    return res.status(500).json({ error: "Banco de dados não inicializado. Verifique as configurações do Firebase." });
  }

  try {
    const ticketId = await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, "counters", "tickets");
      const counterDoc = await transaction.get(counterRef);
      
      let nextId = 1;
      if (counterDoc.exists()) {
        nextId = (counterDoc.data().lastId || 0) + 1;
      }
      
      transaction.set(counterRef, { lastId: nextId });
      return nextId;
    });

    const docRef = await addDoc(collection(db, "chamados"), {
      ...payload,
      numeric_id: ticketId,
      status: 'aberto',
      last_status_change_at: now,
      created_at: now,
      total_time_ms: 0,
      assigned_technician_id: null,
      history: [{
        status: 'aberto',
        changed_at: now,
        changed_by_name: payload.requester_name || "Sistema"
      }]
    });
    
    res.json({ id: docRef.id, numeric_id: ticketId });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/tickets/:id", authenticate, isAdmin, async (req, res) => {
  if (isDummyFirebase) {
    try {
      const ticket = localDb.getTicket(req.params.id);
      if (ticket && ticket.evidenceUrls && ticket.evidenceUrls.length > 0) {
        try {
          await del(ticket.evidenceUrls);
        } catch (error) {
          console.error('Error deleting evidence files from Vercel Blob:', error);
        }
      }
      const deleted = localDb.deleteTicket(req.params.id);
      if (deleted) {
        return res.json({ success: true });
      } else {
        return res.status(404).json({ error: "Chamado não encontrado" });
      }
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const ticketRef = doc(db, "chamados", req.params.id);
    const ticketDoc = await getDoc(ticketRef);
    
    if (ticketDoc.exists()) {
      const ticket = ticketDoc.data();
      if (ticket.evidenceUrls && ticket.evidenceUrls.length > 0) {
        try {
          await del(ticket.evidenceUrls);
        } catch (error) {
          console.error('Error deleting evidence files from Vercel Blob:', error);
        }
      }
    }

    await deleteDoc(ticketRef);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Auth: Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (isDummyFirebase) {
    try {
      const user = localDb.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      const token = jwt.sign({ 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.name, 
        departments: user.departments || [], 
        unit: user.unit || "Todas",
        allowed_modules: user.allowed_modules || []
      }, JWT_SECRET);
      return res.json({ 
        token, 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          departments: user.departments || [], 
          unit: user.unit || "Todas",
          allowed_modules: user.allowed_modules || []
        } 
      });
    } catch (error: any) {
      console.error("Local login error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (!db) {
    return res.status(500).json({ error: "Banco de dados não inicializado. Verifique as configurações do Firebase." });
  }

  try {
    const usersCol = collection(db, "users");
    const q = query(usersCol, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin";
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@2026";
      const isAdminLogin = (email.toLowerCase() === adminEmail.toLowerCase()) && password === adminPassword;
      
      if (isAdminLogin) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newAdmin = await addDoc(usersCol, {
          name: "Administrador",
          email: adminEmail,
          password: hashedPassword,
          role: "admin",
          departments: ["TI", "Manutenção", "ADM"],
          unit: "Todas"
        });
        const token = jwt.sign({ id: newAdmin.id, email: adminEmail, role: "admin", name: "Administrador", departments: ["TI", "Manutenção", "ADM"], unit: "Todas", allowed_modules: ['chamados', 'compras', 'emprestimos', 'supervisao', 'agendamento', 'painel_aulas', 'users'] }, JWT_SECRET);
        return res.json({ token, user: { id: newAdmin.id, name: "Administrador", email: adminEmail, role: "admin", departments: ["TI", "Manutenção", "ADM"], unit: "Todas", allowed_modules: ['chamados', 'compras', 'emprestimos', 'supervisao', 'agendamento', 'painel_aulas', 'users'] } });
      }
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data();

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    
    const token = jwt.sign({ id: userDoc.id, email: user.email, role: user.role, name: user.name, departments: user.departments || [user.department] || [], unit: user.unit || "Todas", allowed_modules: user.allowed_modules || [] }, JWT_SECRET);
    res.json({ token, user: { id: userDoc.id, name: user.name, email: user.email, role: user.role, departments: user.departments || [user.department] || [], unit: user.unit || "Todas", allowed_modules: user.allowed_modules || [] } });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Public: Track Ticket
app.get("/api/tickets/track/:id", async (req, res) => {
  if (isDummyFirebase) {
    try {
      const ticket = localDb.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: "Chamado não encontrado" });
      }
      const ticketCopy = { ...ticket };
      if (ticketCopy.assigned_technician_id) {
        const tech = localDb.getUser(ticketCopy.assigned_technician_id);
        if (tech) {
          ticketCopy.technician_name = tech.name;
        }
      }
      return res.json(ticketCopy);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const id = req.params.id;
    let ticket = null;

    // First try numeric_id
    if (!isNaN(Number(id))) {
      const q = query(collection(db, "chamados"), where("numeric_id", "==", Number(id)));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        ticket = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
    }

    // If not found, try document ID
    if (!ticket) {
      const docRef = doc(db, "chamados", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        ticket = { id: docSnap.id, ...docSnap.data() };
      }
    }

    if (!ticket) {
      return res.status(404).json({ error: "Chamado não encontrado" });
    }

    // Fetch technician name if assigned
    if (ticket.assigned_technician_id) {
      const techDoc = await getDoc(doc(db, "users", ticket.assigned_technician_id));
      if (techDoc.exists()) {
        ticket.technician_name = techDoc.data().name;
      }
    }

    res.json(ticket);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Public: Get Tickets by Unit
app.get("/api/tickets/public", async (req, res) => {
  const { unit } = req.query;
  if (!unit) {
    return res.status(400).json({ error: "Unidade é obrigatória" });
  }

  if (isDummyFirebase) {
    try {
      const tickets = localDb.getTickets()
        .filter((t: any) => t.unit === unit)
        .map((t: any) => {
          const ticketCopy = { ...t };
          if (ticketCopy.assigned_technician_id) {
            const tech = localDb.getUser(ticketCopy.assigned_technician_id);
            if (tech) {
              ticketCopy.technician_name = tech.name;
            }
          }
          return ticketCopy;
        });
      return res.json(tickets);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const q = query(collection(db, "chamados"), where("unit", "==", unit), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    
    let tickets = await Promise.all(querySnapshot.docs.map(async (ticketDoc) => {
      const data = ticketDoc.data();
      let technician_name = null;
      
      if (data.assigned_technician_id) {
        const techDoc = await getDoc(doc(db, "users", data.assigned_technician_id));
        if (techDoc.exists()) {
          technician_name = techDoc.data().name;
        }
      }
      
      return {
        id: ticketDoc.id,
        ...data,
        technician_name
      };
    }));

    res.json(tickets);
  } catch (error: any) {
    // If index is missing, it might throw an error. We can fallback to fetching all and filtering if needed, but let's try this first.
    if (error.message.includes('index')) {
       try {
         const qFallback = query(collection(db, "chamados"), orderBy("created_at", "desc"));
         const querySnapshotFallback = await getDocs(qFallback);
         let ticketsFallback = await Promise.all(querySnapshotFallback.docs.map(async (ticketDoc) => {
            const data = ticketDoc.data();
            let technician_name = null;
            if (data.assigned_technician_id) {
              const techDoc = await getDoc(doc(db, "users", data.assigned_technician_id));
              if (techDoc.exists()) {
                technician_name = techDoc.data().name;
              }
            }
            return { id: ticketDoc.id, ...data, technician_name };
         }));
         ticketsFallback = ticketsFallback.filter((t: any) => t.unit === unit);
         return res.json(ticketsFallback);
       } catch (fallbackError: any) {
         return res.status(400).json({ error: fallbackError.message });
       }
    }
    res.status(400).json({ error: error.message });
  }
});

// Protected: Get Tickets
app.get("/api/tickets", authenticate, async (req, res) => {
  const user = (req as any).user;

  if (isDummyFirebase) {
    try {
      let tickets = localDb.getTickets().map((t: any) => {
        const ticketCopy = { ...t };
        if (ticketCopy.assigned_technician_id) {
          const tech = localDb.getUser(ticketCopy.assigned_technician_id);
          if (tech) {
            ticketCopy.technician_name = tech.name;
          }
        }
        return ticketCopy;
      });

      if (user.role !== 'admin' && user.unit && user.unit !== 'Todas') {
        tickets = tickets.filter((t: any) => t.unit === user.unit);
      }

      // Filtrar categoria "Supervisão": apenas admin e gestor podem visualizar
      tickets = tickets.filter((t: any) => {
        if (t.category === 'Supervisão') {
          return user.role === 'admin' || user.role === 'gestor';
        }
        return true;
      });

      return res.json(tickets);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const q = query(collection(db, "chamados"), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    
    let tickets = await Promise.all(querySnapshot.docs.map(async (ticketDoc) => {
      const data = ticketDoc.data();
      let technician_name = null;
      
      if (data.assigned_technician_id) {
        const techDoc = await getDoc(doc(db, "users", data.assigned_technician_id));
        if (techDoc.exists()) {
          technician_name = techDoc.data().name;
        }
      }
      
      return {
        id: ticketDoc.id,
        ...data,
        technician_name
      };
    }));

    if (user.role !== 'admin' && user.unit && user.unit !== 'Todas') {
      tickets = tickets.filter((t: any) => t.unit === user.unit);
    }

    // Filtrar categoria "Supervisão": apenas admin e gestor podem visualizar
    tickets = tickets.filter((t: any) => {
      if (t.category === 'Supervisão') {
        return user.role === 'admin' || user.role === 'gestor';
      }
      return true;
    });

    res.json(tickets);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Protected: Change Password
app.patch("/api/users/me/password", authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (isDummyFirebase) {
    try {
      const userId = (req as any).user.id;
      const user = localDb.getUser(userId);
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ error: "Senha atual incorreta" });
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      localDb.updateUser(userId, { password: hashedPassword });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  
  try {
    const userRef = doc(db, "users", (req as any).user.id);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return res.status(404).json({ error: "Usuário não encontrado" });
    
    const userData = userDoc.data();
    const isMatch = await bcrypt.compare(currentPassword, userData.password);
    if (!isMatch) return res.status(400).json({ error: "Senha atual incorreta" });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateDoc(userRef, { password: hashedPassword });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Protected: Get Single Ticket
app.get("/api/tickets/:id", authenticate, async (req, res) => {
  if (isDummyFirebase) {
    try {
      const ticket = localDb.getTicket(req.params.id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      const ticketCopy = { ...ticket };
      if (ticketCopy.assigned_technician_id) {
        const tech = localDb.getUser(ticketCopy.assigned_technician_id);
        if (tech) {
          ticketCopy.technician_name = tech.name;
        }
      }

      // Restrição de acesso à categoria "Supervisão"
      if (ticketCopy.category === 'Supervisão' && (req as any).user.role !== 'admin' && (req as any).user.role !== 'gestor') {
        return res.status(403).json({ error: "Acesso negado para esta categoria de chamado" });
      }

      const comments = localDb.getComments(req.params.id)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return res.json({ 
        ...ticketCopy, 
        comments 
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const ticketDoc = await getDoc(doc(db, "chamados", req.params.id));
    if (!ticketDoc.exists()) return res.status(404).json({ error: "Ticket not found" });

    const ticketData = ticketDoc.data();
    let technician_name = null;
    
    if (ticketData.assigned_technician_id) {
      const techDoc = await getDoc(doc(db, "users", ticketData.assigned_technician_id));
      if (techDoc.exists()) {
        technician_name = techDoc.data().name;
      }
    }

    // Restrição de acesso à categoria "Supervisão"
    if (ticketData.category === 'Supervisão' && (req as any).user.role !== 'admin' && (req as any).user.role !== 'gestor') {
      return res.status(403).json({ error: "Acesso negado para esta categoria de chamado" });
    }

    const commentsQuery = query(collection(db, "comments"), where("ticket_id", "==", req.params.id));
    const commentsSnapshot = await getDocs(commentsQuery);
    const comments = commentsSnapshot.docs
      .map(d => ({ id: d.id, ...d.data() as any }))
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    res.json({ 
      id: ticketDoc.id,
      ...ticketData, 
      technician_name,
      comments 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Protected: Update Ticket Status & Time Tracking
app.patch("/api/tickets/:id/status", authenticate, async (req, res) => {
  const { status } = req.body;

  if (isDummyFirebase) {
    try {
      const ticket = localDb.getTicket(req.params.id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      const now = new Date();
      const lastChange = new Date(ticket.last_status_change_at);
      let additionalTime = 0;

      if (ticket.status === 'aberto' || ticket.status === 'em_atendimento') {
        additionalTime = now.getTime() - lastChange.getTime();
      }

      const newTotalTime = (ticket.total_time_ms || 0) + additionalTime;
      const nowISO = now.toISOString();
      const completedAt = status === 'concluido' ? nowISO : (ticket.completed_at || null);

      const history = ticket.history || [];
      history.push({
        status,
        changed_at: nowISO,
        changed_by_name: (req as any).user.name
      });

      const updateData: any = { 
        status, 
        total_time_ms: newTotalTime, 
        last_status_change_at: nowISO, 
        completed_at: completedAt,
        history
      };

      if (status === 'concluido' && ticket.evidenceUrls && ticket.evidenceUrls.length > 0) {
        try {
          await del(ticket.evidenceUrls);
          updateData.evidencePaths = [];
          updateData.evidenceUrls = [];
        } catch (error) {
          console.error('Error deleting evidence files from Vercel Blob:', error);
        }
      }

      localDb.updateTicket(req.params.id, updateData);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  
  try {
    const ticketRef = doc(db, "chamados", req.params.id);
    const ticketDoc = await getDoc(ticketRef);

    if (!ticketDoc.exists()) return res.status(404).json({ error: "Ticket not found" });

    const ticket = ticketDoc.data();
    const now = new Date();
    const lastChange = new Date(ticket.last_status_change_at);
    let additionalTime = 0;

    if (ticket.status === 'aberto' || ticket.status === 'em_atendimento') {
      additionalTime = now.getTime() - lastChange.getTime();
    }

    const newTotalTime = (ticket.total_time_ms || 0) + additionalTime;
    const nowISO = now.toISOString();
    const completedAt = status === 'concluido' ? nowISO : (ticket.completed_at || null);

    const history = ticket.history || [];
    history.push({
      status,
      changed_at: nowISO,
      changed_by_name: (req as any).user.name
    });

    const updateData: any = { 
      status, 
      total_time_ms: newTotalTime, 
      last_status_change_at: nowISO, 
      completed_at: completedAt,
      history
    };

    if (status === 'concluido' && ticket.evidenceUrls && ticket.evidenceUrls.length > 0) {
      try {
        await del(ticket.evidenceUrls);
        updateData.evidencePaths = [];
        updateData.evidenceUrls = [];
      } catch (error) {
        console.error('Error deleting evidence files from Vercel Blob:', error);
      }
    }

    await updateDoc(ticketRef, updateData);

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Protected: Assign Technician
app.patch("/api/tickets/:id/assign", authenticate, async (req, res) => {
  const { technician_id } = req.body;

  if (isDummyFirebase) {
    try {
      const updated = localDb.updateTicket(req.params.id, { assigned_technician_id: technician_id });
      if (updated) {
        return res.json({ success: true });
      } else {
        return res.status(404).json({ error: "Ticket not found" });
      }
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    await updateDoc(doc(db, "chamados", req.params.id), { assigned_technician_id: technician_id });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Protected: Update Priority
app.patch("/api/tickets/:id/priority", authenticate, async (req, res) => {
  const { priority } = req.body;

  if (isDummyFirebase) {
    try {
      const updated = localDb.updateTicket(req.params.id, { priority });
      if (updated) {
        return res.json({ success: true });
      } else {
        return res.status(404).json({ error: "Ticket not found" });
      }
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    await updateDoc(doc(db, "chamados", req.params.id), { priority });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Protected: Add Comment
app.post("/api/tickets/:id/comments", authenticate, async (req, res) => {
  const { message } = req.body;
  const user = (req as any).user;

  if (isDummyFirebase) {
    try {
      localDb.addComment({ 
        ticket_id: req.params.id, 
        author_name: user.name, 
        author_role: user.role, 
        message,
        created_at: new Date().toISOString()
      });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  
  try {
    await addDoc(collection(db, "comments"), { 
      ticket_id: req.params.id, 
      author_name: user.name, 
      author_role: user.role, 
      message,
      created_at: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/debug/users", async (req, res) => {
  if (isDummyFirebase) {
    return res.json(localDb.getUsers());
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(users);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: User Management
app.get("/api/users", authenticate, isAdmin, async (req, res) => {
  if (isDummyFirebase) {
    try {
      const users = localDb.getUsers().map((u: any) => {
        let depts = [];
        if (Array.isArray(u.departments)) {
          depts = u.departments;
        } else if (typeof u.departments === 'string') {
          depts = [u.departments];
        }
        return { 
          id: u.id, 
          name: u.name, 
          email: u.email, 
          role: u.role, 
          departments: depts, 
          unit: u.unit,
          allowed_modules: u.allowed_modules || []
        };
      });
      return res.json(users);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = querySnapshot.docs.map(d => {
      const data = d.data();
      console.log("User data:", data);
      let depts = [];
      if (Array.isArray(data.departments)) {
        depts = data.departments;
      } else if (typeof data.departments === 'string') {
        depts = [data.departments];
      } else if (data.department) {
        depts = [data.department];
      }
      return { 
        id: d.id, 
        name: data.name, 
        email: data.email, 
        role: data.role, 
        departments: depts, 
        unit: data.unit,
        allowed_modules: data.allowed_modules || []
      };
    });
    console.log("Returning users:", users);
    res.json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/users", authenticate, isAdmin, async (req, res) => {
  const { name, email, password, role, departments, unit, allowed_modules } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (isDummyFirebase) {
    try {
      const existing = localDb.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }
      localDb.addUser({ 
        name, 
        email, 
        password: hashedPassword, 
        role, 
        departments: departments || [], 
        unit: unit || "Todas",
        allowed_modules: Array.isArray(allowed_modules) ? allowed_modules : []
      });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  
  try {
    // Check if email exists
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    await addDoc(collection(db, "users"), { 
      name, 
      email, 
      password: hashedPassword, 
      role, 
      departments: departments || [], 
      unit: unit || "Todas",
      allowed_modules: Array.isArray(allowed_modules) ? allowed_modules : []
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// User: Change Own Password
app.patch("/api/users/me/password", authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = (req as any).user;

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "A nova senha deve ter pelo menos 4 caracteres" });
  }

  if (isDummyFirebase) {
    try {
      const currentUser = localDb.getUser(user.id) || localDb.getUserByEmail(user.email);
      if (!currentUser) return res.status(404).json({ error: "Usuário não encontrado" });
      if (!bcrypt.compareSync(currentPassword, currentUser.password)) {
        return res.status(400).json({ error: "Senha atual incorreta" });
      }
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      localDb.updateUser(currentUser.id, { password: hashedPassword });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const userRef = doc(db, "users", user.id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return res.status(404).json({ error: "Usuário não encontrado" });
    const userData = userSnap.data();
    if (!bcrypt.compareSync(currentPassword, userData.password)) {
      return res.status(400).json({ error: "Senha atual incorreta" });
    }
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await updateDoc(userRef, { password: hashedPassword });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Reset any user password
app.patch("/api/users/:id/reset-password", authenticate, isAdmin, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "A nova senha deve ter pelo menos 4 caracteres" });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  if (isDummyFirebase) {
    try {
      const targetUser = localDb.getUser(req.params.id);
      if (!targetUser) return res.status(404).json({ error: "Usuário não encontrado" });
      localDb.updateUser(req.params.id, { password: hashedPassword });
      return res.json({ success: true, message: `Senha do usuário ${targetUser.name} redefinida com sucesso` });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const userRef = doc(db, "users", req.params.id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return res.status(404).json({ error: "Usuário não encontrado" });
    await updateDoc(userRef, { password: hashedPassword });
    res.json({ success: true, message: "Senha redefinida com sucesso" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/users/:id", authenticate, isAdmin, async (req, res) => {
  if (isDummyFirebase) {
    try {
      const deleted = localDb.deleteUser(req.params.id);
      if (deleted) {
        return res.json({ success: true });
      } else {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    await deleteDoc(doc(db, "users", req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Edit User Profile (Name, Email, Role, Unit, Departments, Allowed Modules)
app.patch("/api/users/:id", authenticate, isAdmin, async (req, res) => {
  const { name, email, password, role, departments, unit, allowed_modules } = req.body;
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (departments !== undefined) updateData.departments = Array.isArray(departments) ? departments : [departments];
  if (allowed_modules !== undefined) updateData.allowed_modules = Array.isArray(allowed_modules) ? allowed_modules : [allowed_modules];
  if (unit !== undefined) updateData.unit = unit;
  if (password && password.trim().length >= 4) {
    updateData.password = bcrypt.hashSync(password, 10);
  }

  if (isDummyFirebase) {
    try {
      const user = localDb.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
      localDb.updateUser(req.params.id, updateData);
      return res.json({ success: true, user: { ...user, ...updateData } });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const userRef = doc(db, "users", req.params.id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return res.status(404).json({ error: "Usuário não encontrado" });
    await updateDoc(userRef, updateData);
    res.json({ success: true, message: "Usuário atualizado com sucesso" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- Empréstimos (Loans) ---

/** Helper: strip PIN from a loan object for public routes */
function sanitizeLoan(loan: any) {
  const { pin, ...rest } = loan;
  return rest;
}


// Helper functions to send notifications
function notifyManagerAboutNewLoan(loan: any) {
  const managerEmail = process.env.MANAGER_EMAIL;
  if (!managerEmail) {
    console.warn("⚠️ MANAGER_EMAIL não configurado nas variáveis de ambiente. Alerta de novo empréstimo não enviado.");
    return;
  }

  sendEmail({
    to: managerEmail,
    subject: `📋 Novo Empréstimo Solicitado: ${loan.equipment} - ${loan.requester_name}`,
    html: `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #007bff; margin: 0; font-size: 22px;">Nova Solicitação de Empréstimo</h2>
        </div>
        <p>Um novo empréstimo foi solicitado no sistema de solicitações:</p>
        <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; border-radius: 4px; font-size: 15px;">
          <p style="margin: 6px 0;"><strong>Equipamento:</strong> ${loan.equipment}</p>
          <p style="margin: 6px 0;"><strong>Solicitante:</strong> ${loan.requester_name} (${loan.registration})</p>
          <p style="margin: 6px 0;"><strong>E-mail:</strong> ${loan.email}</p>
          <p style="margin: 6px 0;"><strong>Telefone:</strong> ${loan.phone}</p>
          <p style="margin: 6px 0;"><strong>Local de Uso:</strong> ${loan.location}</p>
          <p style="margin: 6px 0;"><strong>Motivo:</strong> ${loan.reason}</p>
          <p style="margin: 6px 0;"><strong>Solicitado em:</strong> ${new Date(loan.created_at).toLocaleString('pt-BR')}</p>
        </div>
        <p>Acesse o painel administrativo da aplicação para aprovar ou reprovar esta solicitação.</p>
        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 16px; font-size: 12px; color: #777; text-align: center;">
          <p>Este é um e-mail automático gerado pelo sistema de Gestão de Empréstimos.</p>
        </div>
      </div>
    `
  }).catch(e => console.error("Error sending manager notification:", e));
}

function notifyUserAboutAuthorization(loan: any) {
  if (!loan.email) return;

  sendEmail({
    to: loan.email,
    subject: `✅ Empréstimo Aprovado: ${loan.equipment}`,
    html: `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #28a745; margin: 0; font-size: 22px;">Sua Solicitação foi Aprovada!</h2>
        </div>
        <p>Olá <strong>${loan.requester_name}</strong>,</p>
        <p>O seu empréstimo para o equipamento <strong>${loan.equipment}</strong> foi autorizado pela gestão.</p>
        
        <p>Abaixo está o seu **PIN de Liberação** de 4 dígitos:</p>
        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; background-color: #e8f5e9; border: 2px dashed #28a745; border-radius: 12px; padding: 15px 30px; font-family: monospace; font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 4px;">
            ${loan.pin}
          </div>
        </div>
        
        ${loan.terms ? `
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <strong style="display: block; margin-bottom: 8px; color: #555;">Termos e Condições do Empréstimo:</strong>
          <p style="margin: 0; font-size: 14px; color: #666; white-space: pre-wrap;">${loan.terms}</p>
        </div>
        ` : ''}

        <p>Acesse o acompanhamento de empréstimos públicos com sua matrícula <strong>${loan.registration}</strong>, confirme o PIN, assine os termos e preencha o checklist para retirar o equipamento.</p>
        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 16px; font-size: 12px; color: #777; text-align: center;">
          <p>Este é um e-mail automático gerado pelo sistema de Gestão de Empréstimos.</p>
        </div>
      </div>
    `
  }).catch(e => console.error("Error sending user authorization notification:", e));
}

app.post("/api/loans", async (req, res) => {
  const { requester_name, registration, email, phone, equipment, location, reason } = req.body;

  if (!requester_name || !registration || !email || !phone || !equipment || !location || !reason) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  const newLoanObj = {
    requester_name, registration, email, phone, equipment, location, reason,
    status: "pendente" as const,
    created_at: new Date().toISOString(),
    logs: [{ action: "Solicitado", user: requester_name, timestamp: new Date().toISOString() }]
  };

  if (isDummyFirebase) {
    try {
      const newLoan = localDb.addLoan(newLoanObj);
      notifyManagerAboutNewLoan({ id: newLoan.id, ...newLoanObj });
      return res.json({ success: true, id: newLoan.id });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const docRef = await addDoc(collection(db, "loans"), newLoanObj);
    notifyManagerAboutNewLoan({ id: docRef.id, ...newLoanObj });
    res.json({ success: true, id: docRef.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/loans", async (req, res) => {
  if (isDummyFirebase) {
    try {
      const loans = localDb.getLoans().sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return res.json(loans);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const q = query(collection(db, "loans"), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    const loans = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(loans);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Public tracking endpoint
app.get("/api/loans/track/:id", async (req, res) => {
  if (isDummyFirebase) {
    try {
      const loan = localDb.getLoan(req.params.id);
      if (!loan) return res.status(404).json({ error: "Empréstimo não encontrado" });
      return res.json(sanitizeLoan(loan));
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const snap = await getDoc(doc(db, "loans", req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: "Empréstimo não encontrado" });
    const loan = { id: snap.id, ...snap.data() };
    res.json(sanitizeLoan(loan));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Public tracking by registration endpoint
app.get("/api/loans/registration/:registration", async (req, res) => {
  const { registration } = req.params;
  if (!registration) {
    return res.status(400).json({ error: "Matrícula é obrigatória" });
  }

  if (isDummyFirebase) {
    try {
      const loans = localDb.getLoans()
        .filter((l: any) => l.registration === registration)
        .map(sanitizeLoan)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return res.json(loans);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const q = query(collection(db, "loans"), where("registration", "==", registration));
    const querySnapshot = await getDocs(q);
    const loans = querySnapshot.docs.map(d => sanitizeLoan({ id: d.id, ...d.data() }));
    loans.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(loans);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/loans/:id/authorize", authenticate, async (req, res) => {
  const { terms } = req.body;
  const user = (req as any).user;
  if (!user.departments?.includes('ADM') && !user.departments?.includes('TI') && user.role !== 'admin') {
    return res.status(403).json({ error: "Acesso negado" });
  }
  if (!terms) return res.status(400).json({ error: "Termos são obrigatórios" });

  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const logEntry = { action: "Autorizado", user: user.name, timestamp: new Date().toISOString(), details: terms };

  if (isDummyFirebase) {
    try {
      const loan = localDb.getLoan(req.params.id);
      if (!loan) return res.status(404).json({ error: "Empréstimo não encontrado" });
      if (loan.status !== 'pendente') return res.status(400).json({ error: "Empréstimo não está pendente" });
      
      const currentLogs = loan.logs || [];
      const updatedData = { 
        status: "autorizado" as const, 
        terms, 
        pin, 
        authorized_by: user.name, 
        authorized_at: new Date().toISOString(), 
        logs: [...currentLogs, logEntry] 
      };
      
      localDb.updateLoan(req.params.id, updatedData);
      notifyUserAboutAuthorization({ id: loan.id, ...loan, ...updatedData });
      return res.json({ success: true, pin });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const loanRef = doc(db, "loans", req.params.id);
    const snap = await getDoc(loanRef);
    if (!snap.exists()) return res.status(404).json({ error: "Empréstimo não encontrado" });
    const loanData = snap.data();
    if (loanData.status !== 'pendente') return res.status(400).json({ error: "Empréstimo não está pendente" });

    await updateDoc(loanRef, { 
      status: "autorizado", 
      terms, 
      pin, 
      authorized_by: user.name, 
      authorized_at: new Date().toISOString(), 
      logs: arrayUnion(logEntry) 
    });
    
    notifyUserAboutAuthorization({ id: snap.id, ...loanData, pin, terms });
    res.json({ success: true, pin });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});


app.patch("/api/loans/:id/reject", authenticate, async (req, res) => {
  const { reason } = req.body;
  const user = (req as any).user;
  if (!user.departments?.includes('ADM') && !user.departments?.includes('TI') && user.role !== 'admin') {
    return res.status(403).json({ error: "Acesso negado" });
  }
  if (!reason || !reason.trim()) return res.status(400).json({ error: "Motivo da reprovação é obrigatório" });

  if (isDummyFirebase) {
    try {
      const loan = localDb.getLoan(req.params.id);
      if (!loan) return res.status(404).json({ error: "Empréstimo não encontrado" });
      if (loan.status !== 'pendente') return res.status(400).json({ error: "Apenas empréstimos pendentes podem ser reprovados" });
      const logEntry = { action: "Reprovado", user: user.name, timestamp: new Date().toISOString(), details: reason };
      const currentLogs = loan.logs || [];
      localDb.updateLoan(req.params.id, { status: "recusado", rejected_by: user.name, rejected_at: new Date().toISOString(), rejection_reason: reason, logs: [...currentLogs, logEntry] });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const loanRef = doc(db, "loans", req.params.id);
    const snap = await getDoc(loanRef);
    if (!snap.exists()) return res.status(404).json({ error: "Empréstimo não encontrado" });
    if (snap.data().status !== 'pendente') return res.status(400).json({ error: "Apenas empréstimos pendentes podem ser reprovados" });
    const logEntry = { action: "Reprovado", user: user.name, timestamp: new Date().toISOString(), details: reason };
    await updateDoc(loanRef, { status: "recusado", rejected_by: user.name, rejected_at: new Date().toISOString(), rejection_reason: reason, logs: arrayUnion(logEntry) });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Release endpoint (replaces /sign) — validates PIN, captures signature + initial checklist
app.patch("/api/loans/:id/release", async (req, res) => {
  const { pin, signature_name, signature_registration, signature_email, checklist_initial } = req.body;
  if (!pin || !signature_name || !signature_registration || !signature_email || !checklist_initial) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios para liberação" });
  }
  const now = new Date().toISOString();

  if (isDummyFirebase) {
    try {
      const loan = localDb.getLoan(req.params.id);
      if (!loan) return res.status(404).json({ error: "Empréstimo não encontrado" });
      if (loan.status !== 'autorizado') return res.status(400).json({ error: "Empréstimo não está disponível para liberação" });
      if (loan.pin !== pin) return res.status(401).json({ error: "PIN inválido" });
      const logEntry = { action: "Liberado / Assinado", user: signature_name, timestamp: now, details: checklist_initial };
      const currentLogs = loan.logs || [];
      localDb.updateLoan(req.params.id, { status: "em_uso", signature_name, signature_registration, signature_email, signature_date: now, released_at: now, checklist_initial, checklist_initial_at: now, logs: [...currentLogs, logEntry] });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const loanRef = doc(db, "loans", req.params.id);
    const snap = await getDoc(loanRef);
    if (!snap.exists()) return res.status(404).json({ error: "Empréstimo não encontrado" });
    const loanData = snap.data();
    if (loanData.status !== 'autorizado') return res.status(400).json({ error: "Empréstimo não está disponível para liberação" });
    if (loanData.pin !== pin) return res.status(401).json({ error: "PIN inválido" });
    const logEntry = { action: "Liberado / Assinado", user: signature_name, timestamp: now, details: checklist_initial };
    await updateDoc(loanRef, { status: "em_uso", signature_name, signature_registration, signature_email, signature_date: now, released_at: now, checklist_initial, checklist_initial_at: now, logs: arrayUnion(logEntry) });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Return endpoint — public, requires same PIN used at release
app.patch("/api/loans/:id/return", async (req, res) => {
  const { pin, checklist_return, return_condition, return_problem } = req.body;
  if (!pin || !checklist_return || !return_condition) {
    return res.status(400).json({ error: "PIN, checklist de devolução e condição são obrigatórios" });
  }
  if (return_condition === 'nao' && !return_problem) {
    return res.status(400).json({ error: "Descrição do problema é obrigatória quando a condição é 'não'" });
  }
  const now = new Date().toISOString();

  if (isDummyFirebase) {
    try {
      const loan = localDb.getLoan(req.params.id);
      if (!loan) return res.status(404).json({ error: "Empréstimo não encontrado" });
      if (loan.status !== 'em_uso') return res.status(400).json({ error: "Empréstimo não está em uso" });
      if (loan.pin !== pin) return res.status(401).json({ error: "PIN inválido" });
      const details = `Checklist: ${checklist_return}${return_condition === 'nao' ? ` | Problema: ${return_problem}` : ' | Devolvido em perfeito estado'}`;
      const logEntry = { action: "Concluído (Devolução)", user: loan.signature_name || loan.requester_name, timestamp: now, details };
      const currentLogs = loan.logs || [];
      localDb.updateLoan(req.params.id, { status: "concluido", checklist_return, checklist_return_at: now, return_condition, return_problem: return_problem || null, completed_by: loan.signature_name || loan.requester_name, completed_at: now, completed_via: 'pin', logs: [...currentLogs, logEntry] });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const loanRef = doc(db, "loans", req.params.id);
    const snap = await getDoc(loanRef);
    if (!snap.exists()) return res.status(404).json({ error: "Empréstimo não encontrado" });
    const loanData = snap.data();
    if (loanData.status !== 'em_uso') return res.status(400).json({ error: "Empréstimo não está em uso" });
    if (loanData.pin !== pin) return res.status(401).json({ error: "PIN inválido" });
    const details = `Checklist: ${checklist_return}${return_condition === 'nao' ? ` | Problema: ${return_problem}` : ' | Devolvido em perfeito estado'}`;
    const logEntry = { action: "Concluído (Devolução)", user: loanData.signature_name || loanData.requester_name, timestamp: now, details };
    await updateDoc(loanRef, { status: "concluido", checklist_return, checklist_return_at: now, return_condition, return_problem: return_problem || null, completed_by: loanData.signature_name || loanData.requester_name, completed_at: now, completed_via: 'pin', logs: arrayUnion(logEntry) });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Fallback: admin-only manual completion without PIN (exceptional use)
app.patch("/api/loans/:id/complete", authenticate, async (req, res) => {
  const { return_condition, return_problem } = req.body;
  const user = (req as any).user;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: "Apenas administradores podem encerrar manualmente" });
  }
  const now = new Date().toISOString();

  if (isDummyFirebase) {
    try {
      const loan = localDb.getLoan(req.params.id);
      if (!loan) return res.status(404).json({ error: "Empréstimo não encontrado" });
      const logEntry = { action: "Concluído (Manual)", user: user.name, timestamp: now, details: return_condition === 'nao' ? `Problema: ${return_problem}` : 'Devolvido em perfeito estado' };
      const currentLogs = loan.logs || [];
      localDb.updateLoan(req.params.id, { status: "concluido", return_condition, return_problem: return_problem || null, completed_at: now, completed_by: user.name, completed_via: 'gestor_manual', logs: [...currentLogs, logEntry] });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const logEntry = { action: "Concluído (Manual)", user: user.name, timestamp: now, details: return_condition === 'nao' ? `Problema: ${return_problem}` : 'Devolvido em perfeito estado' };
    await updateDoc(doc(db, "loans", req.params.id), { status: "concluido", return_condition, return_problem: return_problem || null, completed_at: now, completed_by: user.name, completed_via: 'gestor_manual', logs: arrayUnion(logEntry) });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});



// --- Módulo de Compras (Purchases) ---

interface PurchaseEmailData {
  title: string;
  orderId: string | number;
  curso: string;
  turma: string;
  items?: any[];
  status: string;
  requesterName?: string;
  buyerName?: string;
  message?: string;
  actionUrl?: string;
}

function buildPurchaseEmailHtml({
  title, orderId, curso, turma, items, status, requesterName, buyerName, message
}: PurchaseEmailData): string {
  const itemsHtml = items && items.length > 0 ? `
    <div style="margin: 20px 0;">
      <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Itens do Pedido:</h4>
      ${items.map((it: any, idx: number) => `
        <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 6px; margin-bottom: 6px; font-size: 14px; color: #1e293b;">
          <strong>${idx + 1}. ${it.item_name}</strong> &times; ${it.quantity} un
          ${it.reason ? `<br/><span style="font-size: 12px; color: #64748b;">Motivo: ${it.reason}</span>` : ''}
          ${it.is_new_item && it.new_item_description ? `<br/><span style="font-size: 12px; color: #d97706;">[Novo Item] ${it.new_item_description}</span>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="background: #15803d; padding: 18px 24px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px; color: #ffffff;">${title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()}</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #dcfce7;">SENAI Porto — Pedido #${orderId}</p>
      </div>
      
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        Notificação automática do Sistema de Gestão e Compras — SENAI Porto.
      </p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Curso:</strong> ${curso || 'Não informado'}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Turma:</strong> ${turma || 'Não informado'}</p>
        ${requesterName ? `<p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Solicitante:</strong> ${requesterName}</p>` : ''}
        ${buyerName ? `<p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Comprador Responsável:</strong> ${buyerName}</p>` : ''}
        <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Status:</strong> <span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase;">${(status || 'pendente').toUpperCase()}</span></p>
      </div>
      
      ${itemsHtml}

      ${message ? `
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0;">
          <p style="margin: 0; font-size: 14px; color: #334155; white-space: pre-wrap;">${message}</p>
        </div>
      ` : ''}

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">
        Sistema de Solicitações & Compras — SENAI Porto
      </p>
    </div>
  `;
}

async function getPurchaseRecipients() {
  let buyers: { email: string; name: string; id?: string; role?: string; departments?: string[] }[] = [];
  let managers: { email: string; name: string; id?: string }[] = [];

  const processUser = (u: any) => {
    if (!u || !u.email) return;
    const rawEmail = String(u.email).trim();
    const emailLower = rawEmail.toLowerCase();
    
    // Ignore non-emails like 'admin' without domain
    if (!emailLower.includes('@')) return;

    let depts: string[] = [];
    if (Array.isArray(u.departments)) {
      depts = u.departments.map((d: any) => String(d).trim());
    } else if (u.department) {
      depts = [String(u.department).trim()];
    } else if (typeof u.departments === 'string') {
      depts = [u.departments.trim()];
    }

    const deptsLower = depts.map(d => d.toLowerCase());
    const isDeptCompras = deptsLower.some(d => d === 'compras' || d.includes('compra') || d.includes('suprimento') || d.includes('almoxarifado'));
    
    const allowedModules: string[] = Array.isArray(u.allowed_modules) ? u.allowed_modules : [];
    const hasComprasAtender = allowedModules.includes('compras') || allowedModules.includes('compras_atender');
    
    const roleLower = String(u.role || '').toLowerCase().trim();
    const isBuyerRole = roleLower === 'comprador' || roleLower === 'compras';

    // Match buyer: explicit role, or module permission, or Compras dept
    if (isBuyerRole || hasComprasAtender || (isDeptCompras && (roleLower === 'comprador' || roleLower === 'tecnico' || roleLower === 'analista' || roleLower === 'assistente' || roleLower === 'gestor'))) {
      if (!buyers.some(b => b.email.toLowerCase() === emailLower)) {
        buyers.push({ 
          email: rawEmail, 
          name: u.name || 'Comprador', 
          id: u.id, 
          role: u.role,
          departments: depts 
        });
      }
    }

    if (roleLower === 'gestor' && (isDeptCompras || deptsLower.some(d => d.includes('supervis')))) {
      if (!managers.some(m => m.email.toLowerCase() === emailLower)) {
        managers.push({ email: rawEmail, name: u.name || 'Gestor', id: u.id });
      }
    }
  };

  if (isDummyFirebase) {
    const allUsers = localDb.getUsers();
    allUsers.forEach(processUser);
  } else if (db) {
    try {
      const snap = await getDocs(collection(db, "users"));
      snap.docs.forEach(d => {
        const u = { id: d.id, ...d.data() };
        processUser(u);
      });
    } catch (e) {
      console.error("Error fetching purchase recipients from Firestore:", e);
    }
  }

  // Also parse explicit buyer emails from environment variable if configured
  const envBuyers = (process.env.BUYERS_EMAILS || process.env.COMPRADORES_EMAILS || "")
    .split(",")
    .map(e => e.trim())
    .filter(e => e.includes("@"));

  envBuyers.forEach(email => {
    if (!buyers.some(b => b.email.toLowerCase() === email.toLowerCase())) {
      buyers.push({ email, name: "Comprador (ENV)" });
    }
  });

  // Fallback: If no buyers found matching specific roles/depts, look for any user with role 'admin' or 'comprador'
  if (buyers.length === 0) {
    const fallbackUser = (u: any) => {
      if (!u || !u.email) return;
      const rawEmail = String(u.email).trim();
      if (!rawEmail.includes('@')) return;
      const roleLower = String(u.role || '').toLowerCase().trim();
      if (roleLower === 'comprador' || roleLower === 'admin' || roleLower === 'gestor') {
        if (!buyers.some(b => b.email.toLowerCase() === rawEmail.toLowerCase())) {
          buyers.push({ email: rawEmail, name: u.name || u.role, id: u.id });
        }
      }
    };
    if (isDummyFirebase) {
      localDb.getUsers().forEach(fallbackUser);
    } else if (db) {
      try {
        const snap = await getDocs(collection(db, "users"));
        snap.docs.forEach(d => fallbackUser({ id: d.id, ...d.data() }));
      } catch (err) {}
    }
  }

  // Garantir que os destinatários padrão sempre estejam na lista de notificações
  const defaultRecipients = ["dluiz@findes.org.br", "admregionalvitoria@gmail.com"];
  defaultRecipients.forEach(email => {
    if (!buyers.some(b => b.email.toLowerCase() === email.toLowerCase())) {
      buyers.push({ email, name: email.includes('dluiz') ? 'Davi Moreira Luiz' : 'Administrador', id: email });
    }
  });

  return { buyers, managers };
}

// Endpoint to inspect/debug purchase recipients
app.get("/api/purchases/recipients", authenticate, async (req, res) => {
  try {
    const { buyers, managers } = await getPurchaseRecipients();
    res.json({
      buyers,
      managers,
      smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      smtpUser: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : null,
      smtpHost: process.env.SMTP_HOST || "smtp.gmail.com"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to trigger a test purchase email with full diagnostic feedback
app.post("/api/purchases/test-email", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { to } = req.body || {};
    const { buyers } = await getPurchaseRecipients();
    
    const targetEmails = to ? [to] : Array.from(new Set(buyers.map(b => b.email).filter(Boolean)));
    
    if (targetEmails.length === 0) {
      return res.status(400).json({
        error: "Nenhum e-mail de comprador encontrado para enviar o teste. Informe um e-mail no corpo da requisição ou cadastre compradores no sistema.",
        buyersFound: buyers
      });
    }

    const smtpUser = (process.env.SMTP_USER || "").trim();
    const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, '');

    if (!smtpUser || !smtpPass) {
      return res.status(500).json({
        error: "As variáveis de ambiente SMTP_USER ou SMTP_PASS não estão configuradas na Vercel.",
        envStatus: {
          SMTP_USER: smtpUser ? `${smtpUser.substring(0, 4)}***` : "AUSENTE / NÃO CONFIGURADA",
          SMTP_PASS: smtpPass ? `Configurada (${smtpPass.length} chars)` : "AUSENTE / NÃO CONFIGURADA",
          SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com (padrão)",
          SMTP_PORT: process.env.SMTP_PORT || "587 (padrão)"
        },
        hint: "Acesse o painel da Vercel > Settings > Environment Variables e configure SMTP_USER e SMTP_PASS."
      });
    }

    // Verificar conexão SMTP antes de tentar enviar
    try {
      const transporter = createTransporter();
      await transporter.verify();
      console.log("✅ [SMTP Verify] Conexão e autenticação SMTP validadas com sucesso!");
    } catch (verifyErr: any) {
      console.error("❌ [SMTP Verify] Falha ao verificar conexão SMTP:", verifyErr);
      return res.status(500).json({
        error: `Falha na autenticação SMTP: ${verifyErr.message || verifyErr}`,
        code: verifyErr.code,
        response: verifyErr.response,
        hint: "Verifique se a Senha de App do Gmail (16 letras) está correta e sem espaços."
      });
    }

    const results: any[] = [];
    for (const email of targetEmails) {
      const sendRes = await sendEmail({
        to: email,
        subject: "Notificacao de Pedido de Compra - SENAI Porto #TESTE-101",
        html: buildPurchaseEmailHtml({
          title: "E-mail de Teste do Módulo de Compras",
          orderId: "TESTE-101",
          curso: "Eletrotécnica / Mecânica",
          turma: "TURMA-2026-TESTE",
          items: [
            { item_name: "Item de Teste 1 (Multímetro Digital)", quantity: 2, reason: "Teste de envio de e-mail" },
            { item_name: "Item de Teste 2 (Cabo de Rede Cat6)", quantity: 5, reason: "Validação do sistema" }
          ],
          status: "Pendente",
          requesterName: user.name || "Administrador",
          message: "Este é um e-mail de teste disparado para verificar se todos os compradores estão recebendo as notificações corretamente."
        })
      });

      if (sendRes.success) {
        results.push({ email, status: "success", messageId: sendRes.messageId });
      } else {
        results.push({ email, status: "error", error: sendRes.error });
      }
    }

    const hasErrors = results.some(r => r.status === "error");

    res.json({
      success: !hasErrors,
      message: hasErrors 
        ? `Envio concluído com avisos para ${targetEmails.length} destinatário(s)` 
        : `Teste de envio executado com sucesso para ${targetEmails.length} destinatário(s)!`,
      recipients: results
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Segregation of Duties and Module Permissions Helper (Backend)
function userHasModuleAccess(user: any, module: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;

  // Check explicit allowed_modules array if assigned
  if (Array.isArray(user.allowed_modules) && user.allowed_modules.length > 0) {
    if (user.allowed_modules.includes(module)) return true;
    if (user.allowed_modules.includes('compras')) {
      if (module === 'compras_solicitar' && (user.role === 'supervisor' || user.role === 'docente')) return true;
      if (module === 'compras_atender' && (user.role === 'comprador' || user.role === 'gestor')) return true;
    }
    return false;
  }

  // Fallback to role-based access
  if (module === 'compras_solicitar') {
    return user.role === 'supervisor' || user.role === 'docente';
  }
  if (module === 'compras_atender') {
    return user.role === 'comprador' || user.role === 'gestor';
  }
  if (module === 'compras') {
    return user.role === 'supervisor' || user.role === 'comprador' || user.role === 'gestor';
  }
  return false;
}

// Itens do SENAI e upload de CSV pelo comprador
app.get("/api/purchases/items", async (req, res) => {
  try {
    const data = localDb.getAvailableItems();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao buscar itens do SENAI" });
  }
});

// Upload CSV de Itens (Comprador/Admin) — Filtra apenas itens do SENAI
app.post("/api/purchases/upload-items", authenticate, upload.single('file'), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!userHasModuleAccess(user, 'compras_atender') && user.role !== 'admin') {
      return res.status(403).json({ error: "Acesso negado: apenas compradores e administradores podem fazer upload da lista de itens." });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "Nenhum arquivo CSV foi enviado." });
    }

    const mode = (req.body.mode === 'merge' ? 'merge' : 'replace') as 'replace' | 'merge';
    const resolveConflicts = (req.body.resolveConflicts || 'check') as 'check' | 'overwrite' | 'ignore';

    // Parse CSV filtering ONLY SENAI items
    const senaiItems = parseSenaiItemsFromCSV(req.file.buffer);

    if (senaiItems.length === 0) {
      return res.status(400).json({
        error: "Nenhum item do SENAI foi encontrado no arquivo enviado. Verifique se a coluna ENTIDADE especifica 'SENAI'."
      });
    }

    const result = localDb.setAvailableItems(
      senaiItems,
      user.name || user.email,
      mode,
      resolveConflicts
    );

    if (result.hasConflicts) {
      return res.json({
        success: false,
        hasConflicts: true,
        conflicts: result.conflicts,
        newItemsCount: result.newItemsCount,
        totalCsvItems: result.totalCsvItems,
        message: result.message
      });
    }

    res.json({
      success: true,
      count: result.count,
      meta: result.meta,
      message: result.message
    });
  } catch (error: any) {
    console.error("Erro no upload do CSV de itens:", error);
    res.status(500).json({ error: error.message || "Erro ao processar arquivo CSV" });
  }
});


app.get("/api/purchases/reasons", async (req, res) => {
  res.json([
    "Aula prática de laboratório",
    "Reposição de insumos da oficina",
    "Material para projeto integrador",
    "Manutenção preventiva de equipamentos",
    "Equipamentos de Proteção Individual (EPI)",
    "Consumíveis de soldagem / usinagem",
    "Material didático para curso técnico",
    "Novo projeto / expansão de turma"
  ]);
});


// Create Purchase Order (authenticated - only requester/supervisor/admin)
app.post("/api/purchases", authenticate, async (req, res) => {
  const { curso, turma, items } = req.body;
  const user = (req as any).user;

  if (!userHasModuleAccess(user, 'compras_solicitar')) {
    return res.status(403).json({ error: "Acesso negado: apenas solicitantes e supervisores podem abrir pedidos de compra (segregação de funções)." });
  }

  if (!curso || !turma || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Curso, turma e pelo menos um item são obrigatórios" });
  }

  const now = new Date().toISOString();
  const purchaseData = {
    curso,
    turma,
    items,
    status: 'pendente',
    requester_id: user.id,
    requester_name: user.name,
    requester_email: user.email,
    requester_role: user.role,
    unit: user.unit || 'PORTO',
    updates: [
      {
        id: "upd_" + Math.random().toString(36).substring(2, 9),
        author_id: user.id,
        author_name: user.name,
        author_role: user.role,
        message: "Pedido de compra registrado no sistema. Aguardando atribuição de comprador.",
        created_at: now
      }
    ],
    email_paused: false,
    created_at: now,
    updated_at: now
  };

  const dispatchBuyerEmails = async (orderId: string | number, orderData: any) => {
    try {
      const { buyers } = await getPurchaseRecipients();
      const targetEmails = Array.from(new Set(
        buyers
          .map(b => b.email)
          .filter(email => email && typeof email === 'string' && email.includes('@'))
      ));

      console.log(`🔍 [Compras] Pedido #${orderId} registrado. Compradores encontrados para notificação (${targetEmails.length}):`, targetEmails);

      if (targetEmails.length === 0) {
        console.warn(`⚠️ [Compras] Nenhum e-mail de comprador encontrado para o pedido #${orderId}.`);
        return;
      }

      for (const email of targetEmails) {
        await sendEmail({
          to: email,
          subject: `Notificacao de Pedido de Compra #${orderId} - ${orderData.curso} - SENAI Porto`,
          html: buildPurchaseEmailHtml({
            title: "Novo Pedido de Compra Registrado",
            orderId: orderId,
            curso: orderData.curso,
            turma: orderData.turma,
            items: orderData.items,
            status: "Pendente",
            requesterName: orderData.requester_name,
            message: "Um novo pedido de compra foi solicitado e aguarda que um comprador se atribua a ele para iniciar as cotações e o atendimento."
          })
        });
      }
    } catch (mailErr) {
      console.error(`❌ [Compras] Erro ao enviar e-mails de novo pedido #${orderId}:`, mailErr);
    }
  };

  if (isDummyFirebase) {
    try {
      const created = localDb.addPurchase(purchaseData);
      
      // No Vercel serverless, devemos aguardar o envio antes de retornar a resposta
      await dispatchBuyerEmails(created.numeric_id || created.id, created);

      return res.status(201).json(created);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const counterRef = doc(db, "counters", "purchases");
    let numeric_id = 1;
    try {
      const counterSnap = await getDoc(counterRef);
      if (counterSnap.exists()) {
        numeric_id = (counterSnap.data().current || 0) + 1;
        await updateDoc(counterRef, { current: numeric_id });
      } else {
        await setDoc(counterRef, { current: 1 });
      }
    } catch (cErr) {
      console.warn("Counter setup error for purchases:", cErr);
    }

    const docRef = await addDoc(collection(db, "purchases"), { numeric_id, ...purchaseData });
    const created = { id: docRef.id, numeric_id, ...purchaseData };

    // No Vercel serverless, devemos aguardar o envio antes de retornar a resposta
    await dispatchBuyerEmails(created.numeric_id || created.id, created);

    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get current authenticated user profile (session revalidation)
app.get("/api/users/me", authenticate, async (req, res) => {
  const tokenUser = (req as any).user;
  if (!tokenUser) return res.status(401).json({ error: "Não autenticado" });

  if (isDummyFirebase) {
    const u = localDb.getUser(tokenUser.id) || tokenUser;
    return res.json({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      departments: u.departments || [],
      unit: u.unit || "Todas",
      allowed_modules: u.allowed_modules || []
    });
  }

  if (!db) {
    return res.json(tokenUser);
  }

  try {
    const userSnap = await getDoc(doc(db, "users", tokenUser.id));
    if (userSnap.exists()) {
      const u = userSnap.data();
      return res.json({
        id: userSnap.id,
        name: u.name,
        email: u.email,
        role: u.role,
        departments: u.departments || [],
        unit: u.unit || "Todas",
        allowed_modules: u.allowed_modules || []
      });
    }
    return res.json(tokenUser);
  } catch (err: any) {
    return res.json(tokenUser);
  }
});

// List Purchase Orders (authenticated)
app.get("/api/purchases", authenticate, async (req, res) => {
  const user = (req as any).user;
  const isOnlyRequester = userHasModuleAccess(user, 'compras_solicitar') && !userHasModuleAccess(user, 'compras_atender');
  const userEmail = (user.email || '').toLowerCase().trim();
  const userId = String(user.id || user.uid || '').trim();

  if (isDummyFirebase) {
    try {
      let list = localDb.getPurchases();
      if (isOnlyRequester) {
        list = list.filter((p: any) => {
          const pEmail = (p.requester_email || '').toLowerCase().trim();
          const pId = String(p.requester_id || '').trim();
          return (userId && pId === userId) || (userEmail && pEmail === userEmail);
        });
      }
      list.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      return res.json(list);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    // Buscamos sem where composto para evitar falhas por falta de índice no Firestore
    let snap;
    try {
      const q = query(collection(db, "purchases"), orderBy("created_at", "desc"));
      snap = await getDocs(q);
    } catch (qErr) {
      snap = await getDocs(collection(db, "purchases"));
    }

    let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    if (isOnlyRequester) {
      list = list.filter((p: any) => {
        const pEmail = (p.requester_email || '').toLowerCase().trim();
        const pId = String(p.requester_id || '').trim();
        return (userId && pId === userId) || (userEmail && pEmail === userEmail);
      });
    }

    list.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    res.json(list);
  } catch (error: any) {
    console.error("Error fetching purchases:", error);
    res.status(400).json({ error: error.message });
  }
});

// Get Single Purchase Order
app.get("/api/purchases/:id", authenticate, async (req, res) => {
  if (isDummyFirebase) {
    try {
      const order = localDb.getPurchase(req.params.id);
      if (!order) return res.status(404).json({ error: "Pedido de compra não encontrado" });
      return res.json(order);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const snap = await getDoc(doc(db, "purchases", req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: "Pedido de compra não encontrado" });
    res.json({ id: snap.id, ...snap.data() });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Assign / Claim Purchase Order (buyer assigns themselves or is assigned)
app.patch("/api/purchases/:id/assign", authenticate, async (req, res) => {
  const user = (req as any).user;
  if (!userHasModuleAccess(user, 'compras_atender')) {
    return res.status(403).json({ error: "Acesso negado: apenas compradores e administradores podem assumir ou atribuir pedidos de compra." });
  }

  const { buyer_id, buyer_name, buyer_email } = req.body || {};
  const targetId = buyer_id || user.id;
  const targetName = buyer_name || user.name;
  const targetEmail = buyer_email || user.email;

  const now = new Date().toISOString();
  const updateLog = {
    id: "upd_" + Math.random().toString(36).substring(2, 9),
    author_id: user.id,
    author_name: user.name,
    author_role: user.role,
    message: `Pedido de compra assumido pelo comprador ${targetName}.`,
    created_at: now
  };

  if (isDummyFirebase) {
    try {
      const order = localDb.getPurchase(req.params.id);
      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });

      const updatesList = order.updates || [];
      const updatedFields: any = {
        buyer_id: targetId,
        buyer_name: targetName,
        buyer_email: targetEmail,
        updated_at: now,
        updates: [...updatesList, updateLog]
      };
      if (order.status === 'pendente') {
        updatedFields.status = 'ciente';
      }

      localDb.updatePurchase(req.params.id, updatedFields);
      const updatedOrder = { ...order, ...updatedFields };

      // Send email to requester notifying that buyer claimed the order
      if (order.requester_email) {
        await sendEmail({
          to: order.requester_email,
          subject: `Pedido #${order.numeric_id || order.id} assumido pelo comprador ${targetName} - SENAI Porto`,
          html: buildPurchaseEmailHtml({
            title: "Pedido Assumido por Comprador",
            orderId: order.numeric_id || order.id,
            curso: order.curso,
            turma: order.turma,
            status: updatedFields.status || order.status,
            requesterName: order.requester_name,
            buyerName: targetName,
            message: `O comprador ${targetName} assumiu o atendimento do seu pedido de compra e iniciará o processo de cotação/andamento.`
          })
        });
      }

      // Send email to buyer confirming assignment
      if (targetEmail) {
        await sendEmail({
          to: targetEmail,
          subject: `Voce assumiu o Pedido #${order.numeric_id || order.id} - ${order.curso} - SENAI Porto`,
          html: buildPurchaseEmailHtml({
            title: "Atribuição de Pedido Confirmada",
            orderId: order.numeric_id || order.id,
            curso: order.curso,
            turma: order.turma,
            items: order.items,
            status: updatedFields.status || order.status,
            requesterName: order.requester_name,
            buyerName: targetName,
            message: `Você agora é o comprador responsável pelo pedido #${order.numeric_id || order.id}. As próximas notificações deste pedido serão direcionadas a você.`
          })
        });
      }

      return res.json({ success: true, order: updatedOrder });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const orderRef = doc(db, "purchases", req.params.id);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return res.status(404).json({ error: "Pedido não encontrado" });
    const order = snap.data();

    const updatedFields: any = {
      buyer_id: targetId,
      buyer_name: targetName,
      buyer_email: targetEmail,
      updated_at: now,
      updates: arrayUnion(updateLog)
    };
    if (order.status === 'pendente') {
      updatedFields.status = 'ciente';
    }

    await updateDoc(orderRef, updatedFields);
    const updatedOrder = { id: snap.id, ...order, ...updatedFields };

    if (order.requester_email) {
      await sendEmail({
        to: order.requester_email,
        subject: `Pedido #${order.numeric_id || req.params.id} assumido pelo comprador ${targetName} - SENAI Porto`,
        html: buildPurchaseEmailHtml({
          title: "Pedido Assumido por Comprador",
          orderId: order.numeric_id || req.params.id,
          curso: order.curso,
          turma: order.turma,
          status: updatedFields.status || order.status,
          requesterName: order.requester_name,
          buyerName: targetName,
          message: `O comprador ${targetName} assumiu o atendimento do seu pedido de compra e iniciará o processo de cotação/andamento.`
        })
      });
    }

    if (targetEmail) {
      await sendEmail({
        to: targetEmail,
        subject: `Voce assumiu o Pedido #${order.numeric_id || req.params.id} - ${order.curso} - SENAI Porto`,
        html: buildPurchaseEmailHtml({
          title: "Atribuição de Pedido Confirmada",
          orderId: order.numeric_id || req.params.id,
          curso: order.curso,
          turma: order.turma,
          items: order.items,
          status: updatedFields.status || order.status,
          requesterName: order.requester_name,
          buyerName: targetName,
          message: `Você agora é o comprador responsável pelo pedido #${order.numeric_id || req.params.id}. As próximas notificações deste pedido serão direcionadas a você.`
        })
      });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update Status (only compradores, gestores or admin)
app.patch("/api/purchases/:id/status", authenticate, async (req, res) => {
  const { status } = req.body;
  const user = (req as any).user;

  if (!userHasModuleAccess(user, 'compras_atender')) {
    return res.status(403).json({ error: "Acesso negado: apenas compradores e administradores podem alterar o status do pedido de compra (segregação de funções)." });
  }

  const validStatuses = ['pendente', 'ciente', 'em_andamento', 'concluido', 'cancelado'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Status inválido" });
  }

  const now = new Date().toISOString();
  const updateLog = {
    id: "upd_" + Math.random().toString(36).substring(2, 9),
    author_id: user.id,
    author_name: user.name,
    author_role: user.role,
    message: `Status alterado para "${status.toUpperCase().replace('_', ' ')}".`,
    created_at: now
  };

  if (isDummyFirebase) {
    try {
      const order = localDb.getPurchase(req.params.id);
      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });

      const updatesList = order.updates || [];
      const updatedFields: any = {
        status,
        updated_at: now,
        updates: [...updatesList, updateLog]
      };

      if (!order.buyer_id && (user.role === 'comprador' || user.role === 'admin' || userHasModuleAccess(user, 'compras_atender'))) {
        updatedFields.buyer_id = user.id;
        updatedFields.buyer_name = user.name;
        updatedFields.buyer_email = user.email;
      }

      localDb.updatePurchase(req.params.id, updatedFields);

      // Send email to supervisor
      if (order.requester_email) {
        await sendEmail({
          to: order.requester_email,
          subject: `Atualizacao do Pedido #${order.numeric_id || order.id} - Status: ${status.toUpperCase()} - SENAI Porto`,
          html: buildPurchaseEmailHtml({
            title: `Atualização de Pedido: ${status.toUpperCase().replace('_', ' ')}`,
            orderId: order.numeric_id || order.id,
            curso: order.curso,
            turma: order.turma,
            status: status,
            requesterName: order.requester_name,
            buyerName: updatedFields.buyer_name || order.buyer_name || user.name,
            message: `O status do seu pedido de compra foi atualizado por ${user.name} (${user.role}).`
          })
        });
      }

      return res.json({ success: true, status, ...updatedFields });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const orderRef = doc(db, "purchases", req.params.id);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return res.status(404).json({ error: "Pedido não encontrado" });
    const order = snap.data();

    const updatedFields: any = {
      status,
      updated_at: now,
      updates: arrayUnion(updateLog)
    };

    if (!order.buyer_id && (user.role === 'comprador' || user.role === 'admin' || userHasModuleAccess(user, 'compras_atender'))) {
      updatedFields.buyer_id = user.id;
      updatedFields.buyer_name = user.name;
      updatedFields.buyer_email = user.email;
    }

    await updateDoc(orderRef, updatedFields);

    if (order.requester_email) {
      await sendEmail({
        to: order.requester_email,
        subject: `Atualizacao do Pedido #${order.numeric_id || req.params.id} - Status: ${status.toUpperCase()} - SENAI Porto`,
        html: buildPurchaseEmailHtml({
          title: `Atualização de Pedido: ${status.toUpperCase().replace('_', ' ')}`,
          orderId: order.numeric_id || req.params.id,
          curso: order.curso,
          turma: order.turma,
          status: status,
          requesterName: order.requester_name,
          buyerName: updatedFields.buyer_name || order.buyer_name || user.name,
          message: `O status do seu pedido de compra foi atualizado por ${user.name} (${user.role}).`
        })
      });
    }

    res.json({ success: true, status, ...updatedFields });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Add Update/Informativo + Fluig Number (only compradores or admin)
app.patch("/api/purchases/:id/update", authenticate, async (req, res) => {
  const { message, fluig_number } = req.body;
  const user = (req as any).user;

  if (!userHasModuleAccess(user, 'compras_atender')) {
    return res.status(403).json({ error: "Acesso negado: apenas compradores e administradores podem atualizar número de Fluig e emitir comunicados." });
  }

  if (!message && fluig_number === undefined) {
    return res.status(400).json({ error: "Mensagem ou número do Fluig é obrigatório" });
  }

  const now = new Date().toISOString();
  const updateLog = message ? {
    id: "upd_" + Math.random().toString(36).substring(2, 9),
    author_id: user.id,
    author_name: user.name,
    author_role: user.role,
    message: fluig_number ? `[Fluig: ${fluig_number}] ${message}` : message,
    created_at: now
  } : null;

  if (isDummyFirebase) {
    try {
      const order = localDb.getPurchase(req.params.id);
      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });

      const updatesList = order.updates || [];
      const updatedFields: any = {
        updated_at: now
      };
      if (fluig_number !== undefined) updatedFields.fluig_number = fluig_number;
      if (updateLog) updatedFields.updates = [...updatesList, updateLog];

      if (!order.buyer_id && (user.role === 'comprador' || user.role === 'admin' || userHasModuleAccess(user, 'compras_atender'))) {
        updatedFields.buyer_id = user.id;
        updatedFields.buyer_name = user.name;
        updatedFields.buyer_email = user.email;
      }

      localDb.updatePurchase(req.params.id, updatedFields);

      // Email to requester
      if (order.requester_email && message) {
        await sendEmail({
          to: order.requester_email,
          subject: `Informativo do Pedido #${order.numeric_id || order.id} - SENAI Porto`,
          html: buildPurchaseEmailHtml({
            title: "Nova Atualização do Comprador",
            orderId: order.numeric_id || order.id,
            curso: order.curso,
            turma: order.turma,
            status: order.status,
            requesterName: order.requester_name,
            buyerName: updatedFields.buyer_name || order.buyer_name || user.name,
            message: `${fluig_number ? `<strong>Número do Fluig:</strong> ${fluig_number}<br/><br/>` : ''}${message}`
          })
        });
      }

      return res.json({ success: true, updates: updatedFields.updates || updatesList, ...updatedFields });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const orderRef = doc(db, "purchases", req.params.id);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return res.status(404).json({ error: "Pedido não encontrado" });
    const order = snap.data();

    const updatedFields: any = { updated_at: now };
    if (fluig_number !== undefined) updatedFields.fluig_number = fluig_number;
    if (updateLog) updatedFields.updates = arrayUnion(updateLog);

    if (!order.buyer_id && (user.role === 'comprador' || user.role === 'admin' || userHasModuleAccess(user, 'compras_atender'))) {
      updatedFields.buyer_id = user.id;
      updatedFields.buyer_name = user.name;
      updatedFields.buyer_email = user.email;
    }

    await updateDoc(orderRef, updatedFields);

    if (order.requester_email && message) {
      await sendEmail({
        to: order.requester_email,
        subject: `Informativo do Pedido #${order.numeric_id || req.params.id} - SENAI Porto`,
        html: buildPurchaseEmailHtml({
          title: "Nova Atualização do Comprador",
          orderId: order.numeric_id || req.params.id,
          curso: order.curso,
          turma: order.turma,
          status: order.status,
          requesterName: order.requester_name,
          buyerName: updatedFields.buyer_name || order.buyer_name || user.name,
          message: `${fluig_number ? `<strong>Número do Fluig:</strong> ${fluig_number}<br/><br/>` : ''}${message}`
        })
      });
    }

    res.json({ success: true, ...updatedFields });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Request Update / Solicitar Andamento (requester/supervisor/admin)
app.post("/api/purchases/:id/request-update", authenticate, async (req, res) => {
  const user = (req as any).user;

  if (!userHasModuleAccess(user, 'compras_solicitar') && user.role !== 'admin') {
    return res.status(403).json({ error: "Acesso negado: apenas o solicitante pode solicitar posição de andamento." });
  }

  const now = new Date().toISOString();

  const updateLog = {
    id: "upd_" + Math.random().toString(36).substring(2, 9),
    author_id: user.id,
    author_name: user.name,
    author_role: user.role,
    message: "Solicitação de andamento enviada pelo solicitante.",
    created_at: now
  };

  if (isDummyFirebase) {
    try {
      const order = localDb.getPurchase(req.params.id);
      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });

      const updatesList = order.updates || [];
      localDb.updatePurchase(req.params.id, {
        updated_at: now,
        updates: [...updatesList, updateLog]
      });

      // Send email: if assigned to a buyer, send ONLY to that buyer; if unassigned, send to ALL buyers
      try {
        let targetEmails: string[] = [];
        if (order.buyer_email) {
          targetEmails = [order.buyer_email];
        } else {
          const { buyers } = await getPurchaseRecipients();
          targetEmails = Array.from(new Set(buyers.map(b => b.email).filter(Boolean)));
        }
        
        for (const email of targetEmails) {
          await sendEmail({
            to: email,
            subject: `Solicitacao de Andamento do Pedido #${order.numeric_id || order.id} - SENAI Porto`,
            html: buildPurchaseEmailHtml({
              title: "Solicitação de Andamento Recebida",
              orderId: order.numeric_id || order.id,
              curso: order.curso,
              turma: order.turma,
              status: order.status,
              requesterName: order.requester_name,
              buyerName: order.buyer_name || "Ainda não atribuído",
              message: `O solicitante ${user.name} (${user.role}) solicitou uma atualização sobre o andamento deste pedido de compra.${!order.buyer_email ? '\n\n⚠️ Este pedido ainda não possui um comprador atribuído. Por favor, acesse o sistema para assumir o pedido.' : ''}`
            })
          });
        }
      } catch (mailErr) {
        console.error("Error sending request-update email:", mailErr);
      }

      return res.json({ success: true, message: "Solicitação de andamento enviada com sucesso" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const orderRef = doc(db, "purchases", req.params.id);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return res.status(404).json({ error: "Pedido não encontrado" });
    const order = snap.data();

    await updateDoc(orderRef, {
      updated_at: now,
      updates: arrayUnion(updateLog)
    });

    try {
      let targetEmails: string[] = [];
      if (order.buyer_email) {
        targetEmails = [order.buyer_email];
      } else {
        const { buyers } = await getPurchaseRecipients();
        targetEmails = Array.from(new Set(buyers.map(b => b.email).filter(Boolean)));
      }
      
      for (const email of targetEmails) {
        await sendEmail({
          to: email,
          subject: `Solicitacao de Andamento do Pedido #${order.numeric_id || req.params.id} - SENAI Porto`,
          html: buildPurchaseEmailHtml({
            title: "Solicitação de Andamento Recebida",
            orderId: order.numeric_id || req.params.id,
            curso: order.curso,
            turma: order.turma,
            status: order.status,
            requesterName: order.requester_name,
            buyerName: order.buyer_name || "Ainda não atribuído",
            message: `O solicitante ${user.name} (${user.role}) solicitou uma atualização sobre o andamento deste pedido de compra.${!order.buyer_email ? '\n\n⚠️ Este pedido ainda não possui um comprador atribuído. Por favor, acesse o sistema para assumir o pedido.' : ''}`
          })
        });
      }
    } catch (mailErr) {
      console.error("Error sending request-update email:", mailErr);
    }

    res.json({ success: true, message: "Solicitação de andamento enviada com sucesso" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Pause / Resume Email Notifications (only compradores, gestores or admin)
app.patch("/api/purchases/:id/pause-emails", authenticate, async (req, res) => {
  const user = (req as any).user;
  if (!userHasModuleAccess(user, 'compras_atender')) {
    return res.status(403).json({ error: "Acesso negado: apenas compradores podem pausar alertas de e-mail." });
  }

  if (isDummyFirebase) {
    try {
      const order = localDb.getPurchase(req.params.id);
      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
      const newStatus = !order.email_paused;
      localDb.updatePurchase(req.params.id, { email_paused: newStatus });
      return res.json({ success: true, email_paused: newStatus });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (!db) return res.status(500).json({ error: "Banco de dados não inicializado" });
  try {
    const orderRef = doc(db, "purchases", req.params.id);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return res.status(404).json({ error: "Pedido não encontrado" });
    const newStatus = !snap.data().email_paused;
    await updateDoc(orderRef, { email_paused: newStatus });
    res.json({ success: true, email_paused: newStatus });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global Error:", err);
  res.status(500).json({ 
    error: "Erro interno do servidor", 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Vite Integration
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
          res.status(404).send("Frontend build not found.");
        }
      });
    });
  }
}

// Overdue Loans Verification & Alert routine
async function checkAndAlertOverdueLoans() {
  console.log("⏰ [Rotina] Verificando se há empréstimos atrasados (+24h)...");
  try {
    let overdueLoans: any[] = [];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (isDummyFirebase) {
      overdueLoans = localDb.getLoans().filter((l: any) => 
        l.status === 'em_uso' && 
        new Date(l.released_at || l.created_at) < oneDayAgo
      );
    } else {
      if (db) {
        const q = query(collection(db, "loans"), where("status", "==", "em_uso"));
        const snap = await getDocs(q);
        overdueLoans = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((l: any) => new Date(l.released_at || l.created_at) < oneDayAgo);
      }
    }

    if (overdueLoans.length > 0) {
      console.log(`⚠️ [Rotina] Encontrados ${overdueLoans.length} empréstimos atrasados.`);
      const managerEmail = process.env.MANAGER_EMAIL;
      if (managerEmail) {
        const loansListHtml = overdueLoans.map((l: any) => `
          <li style="margin-bottom: 12px; padding: 12px; bg-color: #fff8f8; border: 1px solid #fbdad7; border-radius: 8px;">
            <strong>Equipamento:</strong> ${l.equipment} <br/>
            <strong>Solicitante:</strong> ${l.requester_name} (${l.registration}) <br/>
            <strong>Contato:</strong> ${l.email} | ${l.phone} <br/>
            <strong>Retirado em:</strong> ${new Date(l.released_at || l.created_at).toLocaleString('pt-BR')} <br/>
            <strong>Tempo em aberto:</strong> Mais de 24 horas ativo sem devolução.
          </li>
        `).join("");

        await sendEmail({
          to: managerEmail,
          subject: "⚠️ ALERTA: Empréstimos de Equipamento Atrasados (+24h)",
          html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #fcd3d1; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(217,83,79,0.05);">
              <h2 style="color: #d9534f; margin-top: 0; border-bottom: 1px solid #fbdad7; padding-bottom: 12px;">Alerta de Atraso em Empréstimo</h2>
              <p>Os seguintes empréstimos de equipamentos ultrapassaram o limite de devolução recomendado (24 horas) e permanecem ativos:</p>
              <ul style="padding-left: 0; list-style-type: none;">
                ${loansListHtml}
              </ul>
              <p>Por favor, verifique a situação com os solicitantes ou realize a devolução manual caso o equipamento já tenha sido retornado fisicamente.</p>
              <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 16px; font-size: 12px; color: #777; text-align: center;">
                <p>Este é um e-mail automático enviado pelo sistema de Gestão de Empréstimos.</p>
              </div>
            </div>
          `
        });
      }
    } else {
      console.log("✅ [Rotina] Nenhum empréstimo atrasado encontrado.");
    }
  } catch (error) {
    console.error("❌ [Rotina] Erro ao verificar empréstimos atrasados:", error);
  }
}

// Background Routine: Daily check for pending purchase orders (>24h without update)
// Sends email to ALL buyers until someone assigns themselves to the order. Once assigned, sends only to that buyer.
async function runDailyPendingOrdersCheck() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let pendingOrders: any[] = [];

    if (isDummyFirebase) {
      pendingOrders = localDb.getPurchases().filter((p: any) => 
        p.status === 'pendente' &&
        !p.email_paused &&
        new Date(p.created_at) < oneDayAgo &&
        (!p.last_email_sent_at || new Date(p.last_email_sent_at) < oneDayAgo)
      );
    } else if (db) {
      const q = query(collection(db, "purchases"), where("status", "==", "pendente"));
      const snap = await getDocs(q);
      pendingOrders = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((p: any) => 
          !p.email_paused && 
          new Date(p.created_at) < oneDayAgo &&
          (!p.last_email_sent_at || new Date(p.last_email_sent_at) < oneDayAgo)
        );
    }

    if (pendingOrders.length > 0) {
      const { buyers } = await getPurchaseRecipients();
      const allBuyerEmails = buyers.map(b => b.email).filter(Boolean);

      for (const order of pendingOrders) {
        const isUnassigned = !order.buyer_id && !order.buyer_email;
        // If unassigned, notify ALL buyers until someone claims it!
        // If assigned, notify only that specific buyer!
        const recipients = isUnassigned 
          ? allBuyerEmails 
          : Array.from(new Set([order.buyer_email].filter(Boolean)));

        for (const email of recipients) {
          await sendEmail({
            to: email,
            subject: isUnassigned 
              ? `🛒 [Lembrete Compras] Pedido #${order.numeric_id || order.id} aguarda atribuição de comprador (+24h)`
              : `🛒 [Lembrete Compras] Pedido #${order.numeric_id || order.id} sob sua responsabilidade aguarda andamento (+24h)`,
            html: buildPurchaseEmailHtml({
              title: isUnassigned ? "Lembrete: Pedido sem Comprador Atribuído" : "Lembrete: Pedido de Compra Pendente",
              orderId: order.numeric_id || order.id,
              curso: order.curso,
              turma: order.turma,
              items: order.items,
              status: "Pendente",
              requesterName: order.requester_name,
              buyerName: order.buyer_name || "Ainda não atribuído",
              message: isUnassigned
                ? "Este pedido de compra foi criado há mais de 24 horas e ainda não possui comprador atribuído. Por favor, acesse o sistema para assumir o pedido."
                : "Este pedido de compra atribuído a você está pendente há mais de 24 horas e aguarda atualização ou cotação."
            })
          });
        }

        const nowIso = new Date().toISOString();
        if (isDummyFirebase) {
          localDb.updatePurchase(order.id, { last_email_sent_at: nowIso });
        } else if (db) {
          await updateDoc(doc(db, "purchases", order.id), { last_email_sent_at: nowIso });
        }
      }
    }
  } catch (err) {
    console.error("❌ [Rotina Compras] Erro ao verificar pedidos pendentes:", err);
  }
}

// Background Routine: Status email for buyer every 48h for active orders
async function runBiDailyBuyerStatusEmail() {
  try {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    let activeOrders: any[] = [];

    if (isDummyFirebase) {
      activeOrders = localDb.getPurchases().filter((p: any) => 
        (p.status === 'ciente' || p.status === 'em_andamento') &&
        !p.email_paused &&
        (!p.last_buyer_email_sent_at || new Date(p.last_buyer_email_sent_at) < twoDaysAgo)
      );
    } else if (db) {
      const q = query(collection(db, "purchases"), where("status", "in", ["ciente", "em_andamento"]));
      const snap = await getDocs(q);
      activeOrders = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((p: any) => 
          !p.email_paused &&
          (!p.last_buyer_email_sent_at || new Date(p.last_buyer_email_sent_at) < twoDaysAgo)
        );
    }

    if (activeOrders.length > 0) {
      const { buyers } = await getPurchaseRecipients();
      const allBuyerEmails = buyers.map(b => b.email).filter(Boolean);

      for (const order of activeOrders) {
        const recipients = order.buyer_email 
          ? [order.buyer_email] 
          : allBuyerEmails;

        for (const email of recipients) {
          await sendEmail({
            to: email,
            subject: `[Compras Acompanhamento] Status Pedido #${order.numeric_id || order.id} (${order.status.toUpperCase()})`,
            html: buildPurchaseEmailHtml({
              title: "Acompanhamento Periódico de Pedido",
              orderId: order.numeric_id || order.id,
              curso: order.curso,
              turma: order.turma,
              items: order.items,
              status: order.status,
              requesterName: order.requester_name,
              buyerName: order.buyer_name || "Ainda não atribuído",
              message: `Pedido em andamento. Fluig cadastrado: ${order.fluig_number || 'Ainda não informado'}.`
            })
          });
        }

        const nowIso = new Date().toISOString();
        if (isDummyFirebase) {
          localDb.updatePurchase(order.id, { last_buyer_email_sent_at: nowIso });
        } else if (db) {
          await updateDoc(doc(db, "purchases", order.id), { last_buyer_email_sent_at: nowIso });
        }
      }
    }
  } catch (err) {
    console.error("❌ [Rotina Compras] Erro ao enviar status periódico:", err);
  }
}

async function startServer() {
  await setupVite();

  // Run routine on startup (after 10s) and then every 1 hour
  setTimeout(() => {
    checkAndAlertOverdueLoans();
    runDailyPendingOrdersCheck();
    runBiDailyBuyerStatusEmail();
  }, 10000);

  setInterval(() => {
    checkAndAlertOverdueLoans();
    runDailyPendingOrdersCheck();
    runBiDailyBuyerStatusEmail();
  }, 60 * 60 * 1000);

  const PORT = process.env.PORT || 3000;
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

export default app;

