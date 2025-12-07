import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBorrowRequestSchema, insertEquipmentSchema, loginSchema, registerSchema } from "@shared/schema";
// Using plaintext passwords by request (INSECURE). Passwords are stored and compared as-is.
import session from "express-session";
import { z } from "zod";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { sendMail, approveEmailBody } from './mailer';

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PgSession = connectPgSimple(session);
  
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET environment variable is required in production");
  }
  
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      secret: sessionSecret || "toolledger-development-only-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.user = user;
    next();
  };

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // NOTE: Storing plaintext password (INSECURE). This was requested to avoid hashing conflicts.
      const user = await storage.createUser({
        ...data,
        password: data.password,
        role: "student",
      });

      req.session.userId = user.id;
      // Persist login metadata: timestamp, IP and user-agent
      try {
        const ip = (req.headers['x-forwarded-for'] as string) || req.ip || null;
        const ua = (req.headers['user-agent'] as string) || null;
        await storage.updateUserLoginInfo(user.id, new Date(), ip, ua);
      } catch (e) {
        console.error('Failed to update user login info:', e);
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      // Log the error for easier debugging (will appear in server console)
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Debug: log password lengths to help diagnose mismatches (removed later)
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.log('Login debug:', { email: data.email, providedLen: data.password.length, providedRaw: JSON.stringify(data.password), dbLen: user.password ? String(user.password).length : 0, dbRaw: JSON.stringify(user.password) });
        } catch (e) {}
      }

      // Plaintext password comparison (INSECURE).
      if (data.password !== user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      // Log the error for easier debugging (will appear in server console)
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      // Clear common session cookie names so client no longer sends the cookie
      try {
        res.clearCookie('connect.sid');
        res.clearCookie('toolledger.sid');
      } catch (e) {}

      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  app.get("/api/equipment", requireAuth, async (req, res) => {
    try {
      const items = await storage.getEquipment();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  app.get("/api/equipment/low-stock", requireAdmin, async (req, res) => {
    try {
      const items = await storage.getLowStockEquipment();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.post("/api/equipment", requireAdmin, async (req, res) => {
    try {
      const data = insertEquipmentSchema.parse(req.body);
      const item = await storage.createEquipment(data);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create equipment" });
    }
  });

  app.patch("/api/equipment/:id", requireAdmin, async (req, res) => {
    try {
      const data = insertEquipmentSchema.partial().parse(req.body);
      const item = await storage.updateEquipment(req.params.id, data);
      if (!item) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update equipment" });
    }
  });

  app.delete("/api/equipment/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteEquipment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.json({ message: "Equipment deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete equipment" });
    }
  });

  app.get("/api/borrow-requests", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const requests = status 
        ? await storage.getBorrowRequestsByStatus(status)
        : await storage.getBorrowRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.get("/api/borrow-requests/my", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getBorrowRequestsByUser(req.session.userId!);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.post("/api/borrow-requests", requireAuth, async (req, res) => {
    try {
      // Validate incoming payload from client (accept ISO date strings)
      const borrowSchema = z.object({
        equipmentId: z.string().min(1, "Please select an equipment"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
        purpose: z.string().min(1, "Please describe purpose"),
        borrowDate: z.string().min(1, "Please provide a borrow date"),
        expectedReturnDate: z.string().min(1, "Please provide an expected return date"),
      });

      // log the raw body for diagnostics in case of validation issues
      if (process.env.NODE_ENV !== 'production') {
        try { console.log('Borrow request body:', req.body); } catch (e) {}
      }

      const parsed = borrowSchema.parse(req.body);

      const data = {
        userId: req.session.userId,
        equipmentId: parsed.equipmentId,
        quantity: parsed.quantity,
        purpose: parsed.purpose,
        borrowDate: new Date(parsed.borrowDate),
        expectedReturnDate: new Date(parsed.expectedReturnDate),
      };

      const equip = await storage.getEquipmentById(data.equipmentId);
      if (!equip) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      if (equip.availableQuantity < data.quantity) {
        return res.status(400).json({ message: "Not enough equipment available" });
      }
      const request = await storage.createBorrowRequest(data as any);
      res.json(request);
    } catch (error) {
      console.error('Create borrow request error:', error);
      if (error instanceof z.ZodError) {
        // return the first validation message
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create request" });
    }
  });

  app.patch("/api/borrow-requests/:id/approve", requireAdmin, async (req: any, res) => {
    try {
      const request = await storage.updateBorrowRequestStatus(
        req.params.id, 
        "approved", 
        req.user.id,
        req.body.notes
      );
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      // send approval email (best-effort)
      try {
        const { sendApprovalEmail } = await import("./mailer");
        const to = request.user?.email;
        if (to) {
          await sendApprovalEmail({
            to,
            studentName: request.user.name || request.user.email,
            itemName: request.equipment?.name || 'Equipment',
            borrowDate: request.borrowDate,
            expectedReturnDate: request.expectedReturnDate,
          });
        }
      } catch (mailErr) {
        console.error('Failed to send approval email:', mailErr);
      }

      res.json(request);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Invalid status transition") || 
            error.message.includes("Not enough equipment") ||
            error.message.includes("Equipment not found")) {
          return res.status(400).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Failed to approve request" });
    }
  });

  app.patch("/api/borrow-requests/:id/decline", requireAdmin, async (req: any, res) => {
    try {
      const request = await storage.updateBorrowRequestStatus(
        req.params.id, 
        "declined", 
        req.user.id,
        req.body.notes
      );
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid status transition")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to decline request" });
    }
  });

  app.patch("/api/borrow-requests/:id/return", requireAdmin, async (req: any, res) => {
    try {
      const request = await storage.updateBorrowRequestStatus(
        req.params.id, 
        "returned", 
        req.user.id,
        req.body.notes
      );
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      // send return confirmation email (best-effort)
      try {
        const { sendReturnEmail } = await import("./mailer");
        const to = request.user?.email;
        if (to) {
          await sendReturnEmail({
            to,
            studentName: request.user.name || request.user.email,
            itemName: request.equipment?.name || 'Equipment',
            borrowDate: request.borrowDate,
            returnDate: request.actualReturnDate || new Date(),
          });
        }
      } catch (mailErr) {
        console.error('Failed to send return email:', mailErr);
      }

      res.json(request);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid status transition")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to record return" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
