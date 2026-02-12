import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { assignments } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { insertDepartmentSchema, insertMessageSchema, insertAdminSchema, insertAssignmentSchema, insertAnnouncementSchema, insertPersonSchema, insertPushSubscriptionSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import webpush from "web-push";
import DOMPurify from "isomorphic-dompurify";

// Allowed MIME types for file uploads
const ALLOWED_MIME_TYPES = [
  // Documents - Microsoft Office
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Documents - OpenDocument (LibreOffice)
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  // Documents - Text
  'text/plain',
  'application/rtf',
  'text/html',
  'text/xml',
  'application/xml',
  // Images - Common
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  // Images - iPhone/Modern
  'image/heic',
  'image/heif',
  'image/avif',
  // Videos
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/webm',
  'video/3gpp',
  'video/x-flv',
  'video/x-matroska',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/x-m4a',
  'audio/flac',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-7z-compressed',
  'application/gzip',
  'application/x-tar',
  // Other
  'application/json',
  'text/csv',
  'application/octet-stream',
];

// Helper function to properly decode filename with UTF-8 support
function decodeFilename(filename: string): string {
  try {
    // First try percent-encoding decoding
    if (filename.includes('%')) {
      return decodeURIComponent(filename);
    }
    
    // Check if already proper UTF-8 (no mojibake characters)
    const hasMojibake = /[Ð-Ñ]/.test(filename);
    if (!hasMojibake) {
      return filename;
    }
    
    // Try to fix mojibake: convert from latin1 to UTF-8
    const buffer = Buffer.from(filename, 'latin1');
    const decoded = buffer.toString('utf8');
    
    // Verify the decode worked (should not have mojibake anymore)
    const stillHasMojibake = /Ð|Ñ/.test(decoded);
    if (!stillHasMojibake || decoded.length < filename.length) {
      return decoded;
    }
    
    return filename;
  } catch (e) {
    // If all fails, return original
    return filename;
  }
}

// Configure multer for file uploads (store in memory as Buffer) - no file size limit
const upload = multer({
  storage: multer.memoryStorage(),
});

// Configure multer for department icon uploads with stricter limits
const uploadIcon = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size for icons
    files: 1, // Only one file at a time
  },
});

// Allowed image MIME types for department icons
const ALLOWED_ICON_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Extend Express Request to include session
declare module 'express-serve-static-core' {
  interface Request {
    session: {
      departmentId?: number;
      adminId?: number;
      userType?: 'department' | 'admin';
      destroy(callback: (err: any) => void): void;
    } & any;
  }
}

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const departmentId = req.session?.departmentId;
  const adminId = req.session?.adminId;
  
  if (!departmentId && !adminId) {
    console.warn('[AUTH_MIDDLEWARE] Rejected: No session or user ID', {
      hasDepartmentId: !!departmentId,
      hasAdminId: !!adminId,
      sessionExists: !!req.session,
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Log successful auth for POST requests
  if (req.method === 'POST' && (req.path.includes('/push/') || req.path.includes('/api/'))) {
    console.log('[AUTH_MIDDLEWARE] Authenticated:', {
      userType: departmentId ? 'department' : 'admin',
      userId: departmentId || adminId,
      path: req.path,
      method: req.method,
    });
  }
  
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function registerRoutes(app: Express) {
  // Monitoring route - public access for viewing unread counts (MUST BE FIRST!)
  app.get("/api/monitoring/unread-stats", async (req: Request, res: Response) => {
    try {
      const departments = await storage.getDepartments();
      const unreadCounts = await storage.getAllDepartmentsUnreadCounts();
      
      // Combine department info with unread counts
      const stats = departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        block: dept.block,
        unreadCount: unreadCounts[dept.id] || 0,
      }));
      
      // Cache for 30 seconds for monitoring dashboard
      res.setHeader('Cache-Control', 'public, max-age=30');
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Authentication routes
  
  // Department login
  app.post("/api/auth/department/login", async (req: Request, res: Response) => {
    try {
      const { accessCode } = req.body;
      
      if (!accessCode) {
        return res.status(400).json({ error: 'Access code is required' });
      }

      const department = await storage.getDepartmentByAccessCode(accessCode);
      
      if (!department) {
        return res.status(401).json({ error: 'Invalid access code' });
      }

      // CRITICAL: Regenerate session ID to prevent session fixation attacks
      // This creates a new session ID while preserving the session store
      req.session.regenerate((regenErr: any) => {
        if (regenErr) {
          console.error('Session regenerate error:', regenErr);
          return res.status(500).json({ error: 'Failed to create session' });
        }
        
        // Set department session data on the NEW session
        req.session.departmentId = department.id;
        req.session.userType = 'department';
        req.session.parentDepartmentId = department.parentDepartmentId || null;
        req.session.isSubdepartment = !!department.parentDepartmentId;
        
        // Save the session
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ error: 'Failed to save session' });
          }
          
          console.log('[AUTH] Department login successful:', { 
            departmentId: department.id, 
            sessionId: req.session.id,
            accessCode: accessCode 
          });
          
          res.json({ 
            success: true, 
            department: {
              id: department.id,
              name: department.name,
              block: department.block,
              code: department.accessCode,
              canMonitor: department.canMonitor,
              canCreateAssignmentFromMessage: department.canCreateAssignmentFromMessage,
              canCreateAssignment: department.canCreateAssignment,
              canCreateAnnouncement: department.canCreateAnnouncement,
              canApprove: department.canApprove,
              parentDepartmentId: department.parentDepartmentId || null,
              isSubdepartment: !!department.parentDepartmentId,
            }
          });
        });
      });
    } catch (error: any) {
      console.error('Department login error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin login
  app.post("/api/auth/admin/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const admin = await storage.getAdminByUsername(username);
      
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const passwordMatch = await bcrypt.compare(password, admin.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // CRITICAL: Regenerate session ID to prevent session fixation attacks
      req.session.regenerate((regenErr: any) => {
        if (regenErr) {
          console.error('Session regenerate error:', regenErr);
          return res.status(500).json({ error: 'Failed to create session' });
        }
        
        // Set admin session data on the NEW session
        req.session.adminId = admin.id;
        req.session.userType = 'admin';
        
        // Save the session
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ error: 'Failed to save session' });
          }
          
          console.log('[AUTH] Admin login successful:', { adminId: admin.id, sessionId: req.session.id });
          
          res.json({ 
            success: true,
            admin: {
              id: admin.id,
              username: admin.username,
            }
          });
        });
      });
    } catch (error: any) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin change password
  app.post("/api/auth/admin/change-password", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Рамзи кунунӣ ва рамзи нав зарур аст' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Рамзи нав бояд на камтар аз 6 аломат бошад' });
      }

      const adminId = req.session.adminId;
      if (!adminId) {
        return res.status(401).json({ error: 'Не авторизован' });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin) {
        return res.status(404).json({ error: 'Админ ёфт нашуд' });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Рамзи кунунӣ нодуруст аст' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateAdminPassword(adminId, hashedPassword);

      res.json({ success: true, message: 'Рамз бомуваффақият иваз шуд' });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    // CRITICAL: Prevent ALL caching of auth status
    // Without these headers, browser returns 304 with stale session data after login
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    // Disable ETag to prevent 304 responses entirely
    res.removeHeader('ETag');
    res.setHeader('Last-Modified', new Date().toUTCString());
    
    try {
      if (req.session.departmentId) {
        const department = await storage.getDepartmentById(req.session.departmentId);
        if (department) {
          return res.json({
            userType: 'department',
            department: {
              id: department.id,
              name: department.name,
              block: department.block,
              code: department.accessCode,
              canMonitor: department.canMonitor,
              canCreateAssignmentFromMessage: department.canCreateAssignmentFromMessage,
              canCreateAssignment: department.canCreateAssignment,
              canCreateAnnouncement: department.canCreateAnnouncement,
              canApprove: department.canApprove,
              parentDepartmentId: department.parentDepartmentId || null,
              isSubdepartment: !!department.parentDepartmentId,
            }
          });
        }
      }
      
      if (req.session.adminId) {
        return res.json({
          userType: 'admin',
          admin: {
            id: req.session.adminId,
          }
        });
      }
      
      res.status(401).json({ error: 'Not authenticated' });
    } catch (error: any) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Department routes
  app.get("/api/departments", requireAdmin, async (req: Request, res: Response) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Departments list (for authenticated departments to see other departments)
  // Always returns all parent departments (no subdepartments) for navigation
  // Subdepartment recipient restrictions are handled in ComposeMessage frontend
  app.get("/api/departments/list", requireAuth, async (req: Request, res: Response) => {
    try {
      // Always return parent departments for navigation/directory view
      const departments = await storage.getParentDepartments();
      
      // Return departments without access codes for security
      const sanitizedDepartments = departments.map(({ accessCode, ...dept }) => dept);
      // Cache for 5 minutes since departments rarely change
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.json(sanitizedDepartments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get ALL departments (parents + subdepartments) for lookups
  // Used to resolve sender/recipient names in messages
  app.get("/api/departments/all", requireAuth, async (req: Request, res: Response) => {
    try {
      const allDepartments = await storage.getDepartments();
      // Return departments without access codes for security
      const sanitizedDepartments = allDepartments.map(({ accessCode, ...dept }) => dept);
      // Cache for 5 minutes since departments rarely change
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.json(sanitizedDepartments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get subdepartments of a parent department
  app.get("/api/departments/:id/subdepartments", requireAuth, async (req: Request, res: Response) => {
    try {
      const parentId = parseInt(req.params.id);
      if (isNaN(parentId)) {
        return res.status(400).json({ error: 'Invalid department ID' });
      }
      
      const subdepartments = await storage.getSubdepartments(parentId);
      // Return without access codes for security
      const sanitizedSubdepartments = subdepartments.map(({ accessCode, ...dept }) => dept);
      res.json(sanitizedSubdepartments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Department can update their own access code
  app.patch("/api/departments/self/access-code", requireAuth, async (req: Request, res: Response) => {
    try {
      const departmentId = req.session.departmentId;
      
      if (!departmentId) {
        return res.status(403).json({ error: 'Only departments can update their access code' });
      }
      
      const { newAccessCode } = req.body;
      
      if (!newAccessCode || typeof newAccessCode !== 'string') {
        return res.status(400).json({ error: 'New access code is required' });
      }
      
      // Check if access code is unique
      const existing = await storage.getDepartmentByAccessCode(newAccessCode);
      if (existing && existing.id !== departmentId) {
        return res.status(400).json({ error: 'Ин рамз аллакай истифода мешавад' });
      }
      
      const updated = await storage.updateDepartment(departmentId, { accessCode: newAccessCode } as any);
      
      if (!updated) {
        return res.status(404).json({ error: 'Department not found' });
      }
      
      console.log('[DEPARTMENT] Access code updated:', { departmentId, newAccessCode });
      
      res.json({ 
        success: true, 
        accessCode: updated.accessCode 
      });
    } catch (error: any) {
      console.error('Update access code error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get parent departments only (top-level, no parent)
  app.get("/api/departments/parents", requireAdmin, async (req: Request, res: Response) => {
    try {
      const departments = await storage.getParentDepartments();
      res.json(departments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/departments", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(data);
      res.json(department);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/departments/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(id, data);
      
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }
      
      res.json(department);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/departments/reorder", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Expect array of { id: number, sortOrder: number }
      const reorderSchema = z.array(z.object({
        id: z.number(),
        sortOrder: z.number(),
      }));
      
      const updates = reorderSchema.parse(req.body);
      await storage.reorderDepartments(updates);
      
      res.json({ success: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/departments/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDepartment(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Department not found' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Department icon routes
  app.post("/api/departments/:id/icon", requireAdmin, uploadIcon.single('icon'), async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.id);
      
      if (isNaN(departmentId)) {
        return res.status(400).json({ error: 'Invalid department ID' });
      }

      // Verify department exists
      const department = await storage.getDepartmentById(departmentId);
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Server-side MIME type verification using file-type
      const { fileTypeFromBuffer } = await import('file-type');
      const fileType = await fileTypeFromBuffer(req.file.buffer);
      
      if (!fileType || !ALLOWED_ICON_MIME_TYPES.includes(fileType.mime)) {
        return res.status(400).json({ error: 'Invalid file type. Only images (PNG, JPEG, GIF, WebP) are allowed.' });
      }

      // Store icon in database
      await storage.upsertDepartmentIcon({
        departmentId,
        fileName: req.file.originalname,
        fileData: req.file.buffer,
        fileSize: req.file.size,
        mimeType: fileType.mime,
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error uploading department icon:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/departments/:id/icon", requireAuth, async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.id);
      
      if (isNaN(departmentId)) {
        return res.status(400).json({ error: 'Invalid department ID' });
      }

      const icon = await storage.getDepartmentIcon(departmentId);
      if (!icon) {
        return res.status(404).json({ error: 'Icon not found' });
      }

      // Check If-Modified-Since header for conditional GET
      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifModifiedSince) {
        const modifiedDate = new Date(icon.updatedAt).getTime();
        const requestDate = new Date(ifModifiedSince).getTime();
        
        if (modifiedDate <= requestDate) {
          return res.status(304).end(); // Not Modified
        }
      }

      // Set caching headers
      res.setHeader('Content-Type', icon.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      res.setHeader('Last-Modified', new Date(icon.updatedAt).toUTCString());
      res.setHeader('Content-Length', icon.fileSize.toString());
      res.send(icon.fileData);
    } catch (error: any) {
      console.error('Error fetching department icon:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/departments/:id/icon", requireAdmin, async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.id);
      
      if (isNaN(departmentId)) {
        return res.status(400).json({ error: 'Invalid department ID' });
      }

      // Verify department exists
      const department = await storage.getDepartmentById(departmentId);
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }

      const success = await storage.deleteDepartmentIcon(departmentId);
      
      if (!success) {
        return res.status(404).json({ error: 'Icon not found' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting department icon:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // People routes
  app.get("/api/people", requireAuth, async (req: Request, res: Response) => {
    try {
      const people = await storage.getPeople();
      res.json(people);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/people/by-department/:departmentId", requireAuth, async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const people = await storage.getPeopleByDepartmentId(departmentId);
      res.json(people);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/people", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertPersonSchema.parse(req.body);
      const person = await storage.createPerson(data);
      res.json(person);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/people/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertPersonSchema.partial().parse(req.body);
      const person = await storage.updatePerson(id, data);
      
      if (!person) {
        return res.status(404).json({ error: 'Person not found' });
      }
      
      res.json(person);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/people/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePerson(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Person not found' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Document Types routes (Намуди ҳуҷҷат)
  app.get("/api/document-types", requireAuth, async (req: Request, res: Response) => {
    try {
      const types = await storage.getActiveDocumentTypes();
      res.json(types);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/document-types/all", requireAdmin, async (req: Request, res: Response) => {
    try {
      const types = await storage.getDocumentTypes();
      res.json(types);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/document-types", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, description, sortOrder, isActive } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: "Номи намуди ҳуҷҷат ҳатмист" });
      }
      const documentType = await storage.createDocumentType({
        name: name.trim(),
        description: description || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
      });
      res.status(201).json(documentType);
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: "Ин намуди ҳуҷҷат аллакай мавҷуд аст" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/document-types/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description, sortOrder, isActive } = req.body;
      const updates: any = {};
      if (name !== undefined) updates.name = name.trim();
      if (description !== undefined) updates.description = description;
      if (sortOrder !== undefined) updates.sortOrder = sortOrder;
      if (isActive !== undefined) updates.isActive = isActive;
      
      const documentType = await storage.updateDocumentType(id, updates);
      if (!documentType) {
        return res.status(404).json({ error: "Намуди ҳуҷҷат ёфт нашуд" });
      }
      res.json(documentType);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "Ин намуди ҳуҷҷат аллакай мавҷуд аст" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/document-types/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDocumentType(id);
      if (!success) {
        return res.status(404).json({ error: "Намуди ҳуҷҷат ёфт нашуд" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Document Templates routes (Намунаҳои ҳуҷҷатҳо)
  app.get("/api/document-templates", requireAuth, async (req: Request, res: Response) => {
    try {
      const templates = await storage.getActiveDocumentTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/document-templates/all", requireAdmin, async (req: Request, res: Response) => {
    try {
      const templates = await storage.getDocumentTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/document-templates/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getDocumentTemplateById(id);
      if (!template) {
        return res.status(404).json({ error: "Намунаи ҳуҷҷат ёфт нашуд" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload document template (Admin only) - converts .docx to HTML
  app.post("/api/document-templates", requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const { name, description, sortOrder, isActive } = req.body;
      const file = req.file;
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: "Номи намуна ҳатмист" });
      }
      
      if (!file) {
        return res.status(400).json({ error: "Файли .docx ҳатмист" });
      }
      
      // Check file type
      const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ error: "Танҳо файлҳои .docx қабул мешаванд" });
      }
      
      // Convert docx to HTML using mammoth with style preservation
      const mammoth = await import('mammoth');
      const options = {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Title'] => h1.title:fresh",
          "r[style-name='Strong'] => strong",
          "r[style-name='Emphasis'] => em",
          "u => u",
          "strike => s",
        ],
        convertImage: mammoth.images.imgElement(async (image: any) => {
          const imageBuffer = await image.read();
          const base64 = imageBuffer.toString('base64');
          const contentType = image.contentType || 'image/png';
          return { src: `data:${contentType};base64,${base64}` };
        }),
      };
      const result = await mammoth.convertToHtml({ buffer: file.buffer }, options);
      
      // Wrap content with default styling to preserve appearance
      const styledHtmlContent = `<div style="font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.5;">${result.value}</div>`;
      
      const template = await storage.createDocumentTemplate({
        name: name.trim(),
        description: description || null,
        originalFileName: file.originalname,
        htmlContent: styledHtmlContent,
        originalDocx: file.buffer,
        sortOrder: parseInt(sortOrder) || 0,
        isActive: isActive !== 'false',
      });
      
      res.status(201).json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/document-templates/:id", requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description, sortOrder, isActive } = req.body;
      const file = req.file;
      
      const updates: any = {};
      if (name !== undefined) updates.name = name.trim();
      if (description !== undefined) updates.description = description;
      if (sortOrder !== undefined) updates.sortOrder = parseInt(sortOrder);
      if (isActive !== undefined) updates.isActive = isActive === 'true' || isActive === true;
      
      // If new file uploaded, convert to HTML with style preservation
      if (file) {
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({ error: "Танҳо файлҳои .docx қабул мешаванд" });
        }
        
        const mammoth = await import('mammoth');
        const options = {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Title'] => h1.title:fresh",
            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em",
            "u => u",
            "strike => s",
          ],
          convertImage: mammoth.images.imgElement(async (image: any) => {
            const imageBuffer = await image.read();
            const base64 = imageBuffer.toString('base64');
            const contentType = image.contentType || 'image/png';
            return { src: `data:${contentType};base64,${base64}` };
          }),
        };
        const result = await mammoth.convertToHtml({ buffer: file.buffer }, options);
        updates.htmlContent = `<div style="font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.5;">${result.value}</div>`;
        updates.originalFileName = file.originalname;
        updates.originalDocx = file.buffer;
      }
      
      const template = await storage.updateDocumentTemplate(id, updates);
      if (!template) {
        return res.status(404).json({ error: "Намунаи ҳуҷҷат ёфт нашуд" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create document template with HTML content directly (from editor)
  app.post("/api/document-templates/html", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, description, htmlContent, sortOrder, isActive } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: "Номи намуна ҳатмист" });
      }
      
      if (!htmlContent || typeof htmlContent !== 'string') {
        return res.status(400).json({ error: "Мундариҷаи ҳуҷҷат ҳатмист" });
      }
      
      const template = await storage.createDocumentTemplate({
        name: name.trim(),
        description: description || null,
        originalFileName: null,
        htmlContent: htmlContent,
        originalDocx: null,
        sortOrder: parseInt(sortOrder) || 0,
        isActive: isActive !== false,
      });
      
      res.status(201).json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update document template with HTML content directly (from editor)
  app.patch("/api/document-templates/:id/html", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description, htmlContent, sortOrder, isActive } = req.body;
      
      const updates: any = {};
      if (name !== undefined) updates.name = name.trim();
      if (description !== undefined) updates.description = description;
      if (htmlContent !== undefined) updates.htmlContent = htmlContent;
      if (sortOrder !== undefined) updates.sortOrder = parseInt(sortOrder);
      if (isActive !== undefined) updates.isActive = isActive;
      
      const template = await storage.updateDocumentTemplate(id, updates);
      if (!template) {
        return res.status(404).json({ error: "Намунаи ҳуҷҷат ёфт нашуд" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/document-templates/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDocumentTemplate(id);
      if (!success) {
        return res.status(404).json({ error: "Намунаи ҳуҷҷат ёфт нашуд" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Message Documents routes (Ҳуҷҷатҳои паём)
  app.get("/api/messages/:messageId/documents", requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const documents = await storage.getMessageDocuments(messageId);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/message-documents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getMessageDocumentById(id);
      if (!document) {
        return res.status(404).json({ error: "Ҳуҷҷат ёфт нашуд" });
      }
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages/:messageId/documents", requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const { templateId, title, htmlContent } = req.body;
      
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: "Номи ҳуҷҷат ҳатмист" });
      }
      
      if (!htmlContent || typeof htmlContent !== 'string') {
        return res.status(400).json({ error: "Мазмуни ҳуҷҷат ҳатмист" });
      }
      
      // Get department ID from session
      const departmentId = req.session.userType === 'department' ? req.session.departmentId : null;
      
      const document = await storage.createMessageDocument({
        messageId,
        templateId: templateId || null,
        title: title.trim(),
        htmlContent,
        lastEditedBy: departmentId,
      });
      
      res.status(201).json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/message-documents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { title, htmlContent } = req.body;
      
      // Get the document first to check authorization
      const existingDoc = await storage.getMessageDocumentById(id);
      if (!existingDoc) {
        return res.status(404).json({ error: "Ҳуҷҷат ёфт нашуд" });
      }
      
      // Get department ID from session for tracking
      const departmentId = req.session.userType === 'department' ? req.session.departmentId : null;
      
      // Authorization check: only sender or recipient of the message can edit documents
      // Admins are also allowed to edit documents
      if (req.session.userType === 'department') {
        if (!departmentId) {
          return res.status(403).json({ error: "Иҷозат надоред" });
        }
        const message = await storage.getMessageById(existingDoc.messageId);
        if (!message) {
          return res.status(404).json({ error: "Паём ёфт нашуд" });
        }
        const isSender = message.senderId === departmentId;
        const isRecipient = message.recipientIds?.includes(departmentId);
        if (!isSender && !isRecipient) {
          return res.status(403).json({ error: "Танҳо фиристанда ё гиранда метавонад ҳуҷҷатро таҳрир кунад" });
        }
      }
      
      const updates: any = {};
      if (title !== undefined) updates.title = title.trim();
      if (htmlContent !== undefined) updates.htmlContent = htmlContent;
      
      if (departmentId) {
        updates.lastEditedBy = departmentId;
      }
      
      const document = await storage.updateMessageDocument(id, updates);
      if (!document) {
        return res.status(404).json({ error: "Ҳуҷҷат ёфт нашуд" });
      }
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/message-documents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMessageDocument(id);
      if (!success) {
        return res.status(404).json({ error: "Ҳуҷҷат ёфт нашуд" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Message Approval routes (Иҷозат)
  app.patch("/api/messages/:id/approve", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body; // 'approved' or 'rejected'
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Статуси нодуруст. 'approved' ё 'rejected' интихоб кунед" });
      }
      
      // Only departments with canApprove permission can approve/reject
      if (!req.session.departmentId) {
        return res.status(403).json({ error: "Танҳо шӯъбаҳо метавонанд иҷозат диҳанд" });
      }
      
      const department = await storage.getDepartmentById(req.session.departmentId);
      if (!department || !department.canApprove) {
        return res.status(403).json({ error: "Шумо ҳуқуқи додани иҷозат надоред" });
      }
      
      // Check if department is recipient of this message
      const message = await storage.getMessageById(id);
      if (!message) {
        return res.status(404).json({ error: "Паём ёфт нашуд" });
      }
      
      const isRecipient = message.recipientId === req.session.departmentId || 
                         (message.recipientIds && message.recipientIds.includes(req.session.departmentId));
      if (!isRecipient) {
        return res.status(403).json({ error: "Шумо гирандаи ин паём нестед" });
      }
      
      // Check if already approved/rejected
      if (message.approvalStatus) {
        return res.status(400).json({ error: "Ин паём аллакай баррасӣ шудааст" });
      }
      
      const updatedMessage = await storage.updateMessageApproval(id, status, req.session.departmentId);
      res.json(updatedMessage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Message routes
  app.get("/api/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.session.adminId) {
        // Admin can see all messages
        const messages = await storage.getMessages();
        res.json(messages);
      } else if (req.session.departmentId) {
        // Department can only see their messages
        const { inbox, outbox } = await storage.getMessagesByDepartment(req.session.departmentId);
        // Combine inbox and outbox into a single array
        const allMessages = [...inbox, ...outbox];
        res.json(allMessages);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/messages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const message = await storage.getMessageById(id);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user has access to this message
      if (req.session.departmentId) {
        // Department can see messages they sent or received (check both recipientId and recipientIds)
        const isSender = message.senderId === req.session.departmentId;
        const isLegacyRecipient = message.recipientId === req.session.departmentId;
        const isBroadcastRecipient = message.recipientIds && message.recipientIds.includes(req.session.departmentId);
        
        if (!isSender && !isLegacyRecipient && !isBroadcastRecipient) {
          return res.status(403).json({ error: 'Access denied' });
        }
        
        // Check if message was deleted by this department (per-user deletion)
        const deletedByRecipients = message.deletedByRecipientIds || [];
        const isDeletedForSender = isSender && message.isDeletedBySender;
        const isDeletedForRecipient = (isLegacyRecipient || isBroadcastRecipient) && 
          deletedByRecipients.includes(req.session.departmentId);
        
        // If both sender AND recipient, check if deleted from their perspective
        if (isSender && (isLegacyRecipient || isBroadcastRecipient)) {
          // Both perspectives: must be deleted from both to hide
          if (isDeletedForSender && isDeletedForRecipient) {
            return res.status(404).json({ error: 'Message not found' });
          }
        } else if (isDeletedForSender || isDeletedForRecipient) {
          // Only one perspective: if deleted from that perspective, hide it
          return res.status(404).json({ error: 'Message not found' });
        }
        
        // Also check for globally deleted messages
        if (message.isDeleted) {
          return res.status(404).json({ error: 'Message not found' });
        }
      } else if (!req.session.adminId) {
        // If not department and not admin, deny access
        return res.status(403).json({ error: 'Access denied' });
      }
      // Admins can see all messages (including deleted ones for admin purposes)
      
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsedData: any = insertMessageSchema.parse(req.body);
      
      // Ensure sender is the authenticated department
      if (req.session.departmentId && parsedData.senderId !== req.session.departmentId) {
        return res.status(403).json({ error: 'Cannot send messages on behalf of other departments' });
      }
      
      // For subdepartments: validate that all recipients are accessible (parent + siblings only)
      if (req.session.isSubdepartment && req.session.departmentId) {
        const accessibleDepts = await storage.getAccessibleDepartments(req.session.departmentId);
        const accessibleIds = new Set(accessibleDepts.map(d => d.id));
        
        // Check recipientIds array
        if (parsedData.recipientIds && parsedData.recipientIds.length > 0) {
          const invalidRecipients = parsedData.recipientIds.filter((id: number) => !accessibleIds.has(id));
          if (invalidRecipients.length > 0) {
            return res.status(403).json({ 
              error: 'Зершуъба метавонад танҳо ба шуъбаи асосӣ ва зершуъбаҳои ҳамсоя паём фиристад' 
            });
          }
        }
        
        // Check legacy recipientId
        if (parsedData.recipientId && !accessibleIds.has(parsedData.recipientId)) {
          return res.status(403).json({ 
            error: 'Зершуъба метавонад танҳо ба шуъбаи асосӣ ва зершуъбаҳои ҳамсоя паём фиристад' 
          });
        }
        
        // Broadcast to all is not allowed for subdepartments
        if (!parsedData.recipientId && (!parsedData.recipientIds || parsedData.recipientIds.length === 0)) {
          return res.status(403).json({ 
            error: 'Зершуъба наметавонад ба ҳама шуъбаҳо паём фиристад' 
          });
        }
      }
      
      // Decode executor (document number) if present
      if (parsedData.executor) {
        parsedData.executor = decodeFilename(parsedData.executor);
      }
      
      const message = await storage.createMessage(parsedData);

      // Send push notification to recipient(s)
      const sendPushNotification = (app as any).sendPushNotification;
      if (sendPushNotification) {
        // Refetch message to get authoritative recipientIds (handles legacy recipientId normalization)
        const createdMessage = await storage.getMessageById(message.id);
        if (!createdMessage) {
          console.error('Failed to refetch message for push notifications, message ID:', message.id);
        } else {
          // Handle both new (recipientIds array) and legacy (single recipientId) formats
          let finalRecipientIds: number[] = createdMessage.recipientIds || [];
          
          // Fallback to legacy recipientId if recipientIds is empty
          if (finalRecipientIds.length === 0 && createdMessage.recipientId) {
            finalRecipientIds = [createdMessage.recipientId];
          }
          
          if (finalRecipientIds.length > 0) {
            const sender = await storage.getDepartmentById(createdMessage.senderId);
            const senderName = sender?.name || 'Неизвестно';
            
            // Send notification to each recipient
            const notificationPromises = finalRecipientIds.map((recipientId: number) =>
              sendPushNotification(recipientId, 'department', {
                title: 'Паёми нав',
                body: `Аз: ${senderName}`,
                icon: 'https://ecodoc.cc/pwa-192.png',
                badge: 'https://ecodoc.cc/pwa-192.png',
                url: '/department/inbox',
              }).catch((err: any) => console.error('Push notification failed:', err))
            );
            
            // Wait for all notifications to complete
            await Promise.allSettled(notificationPromises);
          }
        }
      }

      res.json(message);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Broadcast message to multiple recipients with file attachments
  app.post("/api/messages/broadcast", requireAuth, upload.array('files', 5), async (req: Request, res: Response) => {
    try {
      // Parse recipient IDs from JSON field
      const recipientIdsRaw = JSON.parse(req.body.recipientIds || '[]');
      
      if (!Array.isArray(recipientIdsRaw) || recipientIdsRaw.length === 0) {
        return res.status(400).json({ error: 'At least one recipient required' });
      }

      // Convert to numbers
      const recipientIds: number[] = recipientIdsRaw.map((id: any) => {
        const num = typeof id === 'number' ? id : parseInt(String(id), 10);
        if (isNaN(num)) {
          throw new Error(`Invalid recipient ID: ${id}`);
        }
        return num;
      });

      // Validate and parse message data
      const messageData = {
        subject: req.body.subject,
        content: req.body.content,
        senderId: parseInt(req.body.senderId),
        executor: req.body.executor || null,
        documentDate: new Date(req.body.documentDate),
        documentNumber: req.body.documentNumber || null,
        documentTypeId: req.body.documentTypeId ? parseInt(req.body.documentTypeId) : null,
        svNumber: req.body.svNumber || null,
        svDirection: req.body.svDirection || null,
        replyToId: null,
      };

      // Ensure sender is the authenticated department
      if (req.session.departmentId && messageData.senderId !== req.session.departmentId) {
        return res.status(403).json({ error: 'Cannot send messages on behalf of other departments' });
      }

      // For subdepartments: validate that all recipients are accessible (parent + siblings only)
      if (req.session.isSubdepartment && req.session.departmentId) {
        const accessibleDepts = await storage.getAccessibleDepartments(req.session.departmentId);
        const accessibleIds = new Set(accessibleDepts.map(d => d.id));
        
        const invalidRecipients = recipientIds.filter((id: number) => !accessibleIds.has(id));
        if (invalidRecipients.length > 0) {
          return res.status(403).json({ 
            error: 'Зершуъба метавонад танҳо ба шуъбаи асосӣ ва зершуъбаҳои ҳамсоя паём фиристад' 
          });
        }
      }

      // Decode executor if present
      if (messageData.executor) {
        messageData.executor = decodeFilename(messageData.executor);
      }

      // Validate files
      const files = req.files as Express.Multer.File[] || [];
      for (const file of files) {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return res.status(400).json({ 
            error: `File type not allowed: ${file.originalname}. Please upload documents, images, or archives only.` 
          });
        }
      }

      // Create ONE message with recipientIds array (broadcast message)
      const fullMessageData: any = {
        ...messageData,
        recipientIds, // New array field for broadcast
        recipientId: null, // Legacy field kept null for new broadcast messages
      };
      
      const message = await storage.createMessage(fullMessageData);

      // Link pre-uploaded attachments to this message (attachmentIds from standalone uploads)
      const attachmentIdsRaw = req.body.attachmentIds;
      const preUploadedIds: number[] = [];
      if (attachmentIdsRaw) {
        const ids = Array.isArray(attachmentIdsRaw) ? attachmentIdsRaw : [attachmentIdsRaw];
        for (const id of ids) {
          const numId = parseInt(String(id), 10);
          if (!isNaN(numId)) {
            preUploadedIds.push(numId);
          }
        }
      }

      if (preUploadedIds.length > 0) {
        for (const attachmentId of preUploadedIds) {
          await storage.linkAttachmentToMessage(attachmentId, message.id);
        }
      }

      // Attach files sent directly in this request
      if (files.length > 0) {
        for (const file of files) {
          await storage.createAttachment({
            messageId: message.id,
            fileData: file.buffer,
            file_name: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
          });
        }
      }

      // Send push notifications to recipients
      // Refetch message to get authoritative recipientIds (handles legacy recipientId normalization)
      const sendPushNotification = (app as any).sendPushNotification;
      if (sendPushNotification) {
        const createdMessage = await storage.getMessageById(message.id);
        if (!createdMessage) {
          console.error('Failed to refetch message for push notifications, message ID:', message.id);
        } else {
          const finalRecipientIds = createdMessage.recipientIds || [];
          
          if (finalRecipientIds.length > 0) {
            const sender = await storage.getDepartmentById(createdMessage.senderId);
            const senderName = sender?.name || 'Неизвестно';
            
            // Send notification to each recipient
            const notificationPromises = finalRecipientIds.map((recipientId: number) =>
              sendPushNotification(recipientId, 'department', {
                title: 'Паёми нав',
                body: `Аз: ${senderName}`,
                icon: 'https://ecodoc.cc/pwa-192.png',
                badge: 'https://ecodoc.cc/pwa-192.png',
                url: '/department/inbox',
              }).catch((err: any) => console.error('Push notification failed:', err))
            );
            
            // Wait for all notifications to complete
            await Promise.allSettled(notificationPromises);
          } else {
            console.error('No recipients for push notification after normalization, message ID:', message.id, 'recipientIds:', finalRecipientIds);
          }
        }
      }

      res.json({
        success: true,
        messagesCreated: 1,
        messageIds: [message.id], // Single message with multiple recipients
        failedRecipients: [],
        filesAttached: files.length + preUploadedIds.length,
      });
    } catch (error: any) {
      console.error('Error in broadcast:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Forward message endpoint (supports multiple recipients)
  app.post("/api/messages/:id/forward", requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      
      // Get original message
      const originalMessage = await storage.getMessageById(messageId);
      if (!originalMessage) {
        return res.status(404).json({ error: 'Original message not found' });
      }
      
      // Verify user has access to this message (is sender or recipient)
      if (req.session.departmentId) {
        const isSender = originalMessage.senderId === req.session.departmentId;
        const isRecipient = originalMessage.recipientId === req.session.departmentId || 
                           (originalMessage.recipientIds && originalMessage.recipientIds.includes(req.session.departmentId));
        
        if (!isSender && !isRecipient) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
      
      // Parse recipient IDs from array (handle both recipientIds[] and recipientIds field names)
      const recipientIdsRaw = req.body['recipientIds[]'] || req.body['recipientIds'];
      let recipientIds: number[] = [];
      if (recipientIdsRaw) {
        if (Array.isArray(recipientIdsRaw)) {
          recipientIds = recipientIdsRaw.map((id: any) => parseInt(String(id))).filter((id: number) => !isNaN(id));
        } else if (typeof recipientIdsRaw === 'string') {
          try {
            const parsed = JSON.parse(recipientIdsRaw);
            if (Array.isArray(parsed)) {
              recipientIds = parsed.map((id: any) => parseInt(String(id))).filter((id: number) => !isNaN(id));
            } else {
              const num = parseInt(recipientIdsRaw);
              if (!isNaN(num)) recipientIds = [num];
            }
          } catch {
            const num = parseInt(recipientIdsRaw);
            if (!isNaN(num)) recipientIds = [num];
          }
        }
      }
      
      if (recipientIds.length === 0) {
        return res.status(400).json({ error: 'At least one valid recipient ID required' });
      }
      
      // Ensure sender is the authenticated department
      if (req.session.departmentId) {
        const senderId = req.session.departmentId;
        
        // Create forwarded message
        const forwardedMessageData: any = {
          subject: originalMessage.subject.startsWith('Иловашуда: ') ? originalMessage.subject : `Иловашуда: ${originalMessage.subject}`,
          content: originalMessage.content,
          senderId: senderId, // Current user becomes the sender
          recipientIds: recipientIds,
          recipientId: null,
          executor: originalMessage.executor,
          documentDate: new Date(originalMessage.documentDate),
          documentNumber: originalMessage.documentNumber,
          svNumber: originalMessage.svNumber || null,
          svDirection: originalMessage.svDirection || null,
          documentTypeId: originalMessage.documentTypeId || null,
          replyToId: null,
          originalSenderId: originalMessage.originalSenderId || originalMessage.senderId, // Track original sender
          forwardedById: senderId, // Track who forwarded it
        };
        
        const forwardedMessage = await storage.createMessage(forwardedMessageData);
        
        // Copy attachments from original message
        const originalAttachments = await storage.getAttachmentsByMessageId(messageId);
        if (originalAttachments.length > 0) {
          await Promise.all(
            originalAttachments.map(async (attachment) => {
              try {
                const fullAttachment = await storage.getAttachmentById(attachment.id);
                if (fullAttachment && fullAttachment.fileData) {
                  await storage.createAttachment({
                    messageId: forwardedMessage.id,
                    fileData: fullAttachment.fileData,
                    file_name: fullAttachment.file_name,
                    fileSize: fullAttachment.fileSize,
                    mimeType: fullAttachment.mimeType,
                  });
                }
              } catch (attachErr) {
                console.error('Failed to copy attachment:', attachment.id, attachErr);
              }
            })
          );
        }
        
        res.json({ success: true, messageId: forwardedMessage.id, recipientsCount: recipientIds.length });
      } else {
        return res.status(403).json({ error: 'Only departments can forward messages' });
      }
    } catch (error: any) {
      console.error('Error forwarding message:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/messages/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get message first to verify user is recipient
      const message = await storage.getMessageById(id);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Only departments can mark messages as read, and only their own messages
      if (!req.session.departmentId) {
        return res.status(403).json({ error: 'Only departments can mark messages as read' });
      }
      
      const currentDepartmentId = req.session.departmentId;
      
      // Check if current department is a recipient (either via recipientId or recipientIds array)
      const isRecipient = message.recipientId === currentDepartmentId || 
                          (message.recipientIds && message.recipientIds.includes(currentDepartmentId));
      
      if (!isRecipient) {
        return res.status(403).json({ error: 'You are not the recipient of this message' });
      }
      
      const updatedMessage = await storage.markMessageAsRead(id);
      
      if (!updatedMessage) {
        return res.status(500).json({ error: 'Failed to mark message as read' });
      }
      
      res.json(updatedMessage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/messages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the message to check permissions
      const message = await storage.getMessageById(id);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Check if user has permission to delete (sender or recipient or admin)
      const isDepartment = req.session.departmentId;
      const isAdmin = req.session.adminId;
      
      if (isDepartment) {
        // Department users: use independent deletion (only affects their view)
        const deleted = await storage.deleteMessageForDepartment(id, req.session.departmentId);
        
        if (!deleted) {
          return res.status(403).json({ error: 'No permission to delete this message' });
        }
        
        return res.json({ success: true });
      } else if (isAdmin) {
        // Admin: use global deletion (affects all users)
        const deleted = await storage.deleteMessage(id);
        
        if (!deleted) {
          return res.status(500).json({ error: 'Failed to delete message' });
        }
        
        return res.json({ success: true });
      }
      
      return res.status(403).json({ error: 'No permission to delete this message' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk delete messages
  app.post("/api/messages/bulk-delete", requireAuth, async (req: Request, res: Response) => {
    try {
      // Validate request body with Zod
      const bulkDeleteSchema = z.object({
        messageIds: z.array(z.number().int().positive()).min(1),
      });
      
      const parsed = bulkDeleteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: 'Invalid message IDs - must be an array of positive integers',
          details: parsed.error.errors 
        });
      }
      
      const { messageIds } = parsed.data;
      
      // Verify permissions for each message
      const deletedCount = { success: 0, failed: 0 };
      const isDepartment = req.session.departmentId;
      const isAdmin = req.session.adminId;
      
      for (const messageId of messageIds) {
        try {
          // messageId is already validated as positive integer by Zod
          const message = await storage.getMessageById(messageId);
          
          if (!message) {
            deletedCount.failed++;
            continue;
          }
          
          let deleted = false;
          
          // Departments use independent deletion (only affects their view)
          if (isDepartment) {
            deleted = await storage.deleteMessageForDepartment(messageId, req.session.departmentId);
          } else if (isAdmin) {
            // Admins use global deletion (affects all users)
            deleted = await storage.deleteMessage(messageId);
          }
          
          if (deleted) {
            deletedCount.success++;
          } else {
            deletedCount.failed++;
          }
        } catch (err) {
          deletedCount.failed++;
        }
      }
      
      res.json({ 
        success: true,
        deleted: deletedCount.success,
        failed: deletedCount.failed
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trash endpoints for messages
  app.get("/api/trash/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const departmentId = req.session.departmentId;
      
      // Admins can see all deleted messages, departments see only their own
      const deletedMessages = await storage.listDeletedMessages(departmentId);
      
      res.json(deletedMessages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/trash/messages/:id/restore", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const departmentId = req.session.departmentId;
      const isAdmin = req.session.adminId;
      
      // First check if message exists in deleted messages visible to this user
      const deletedMessages = await storage.listDeletedMessages(departmentId);
      const messageToRestore = deletedMessages.find(m => m.id === id);
      
      if (!messageToRestore) {
        return res.status(404).json({ error: 'Message not found in trash or access denied' });
      }
      
      let restored = false;
      
      if (departmentId) {
        // Department: use independent restore (only affects their view)
        restored = await storage.restoreMessageForDepartment(id, departmentId);
      } else if (isAdmin) {
        // Admin: use global restore (restores for all users)
        restored = await storage.restoreMessage(id);
      }
      
      if (!restored) {
        return res.status(500).json({ error: 'Failed to restore message' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get deleted messages for a specific department (Admin only)
  app.get("/api/trash/messages/department/:deptId", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only admins can view trash for specific departments
      if (req.session.departmentId) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      const deptId = parseInt(req.params.deptId);
      const deletedMessages = await storage.listDeletedMessages(deptId);
      
      res.json(deletedMessages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Permanently delete a message (Admin only)
  app.delete("/api/trash/messages/:id/permanent", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only admins can permanently delete
      if (req.session.departmentId) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.permanentDeleteMessage(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get unread count for current department
  app.get("/api/messages/unread/count", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.departmentId) {
        return res.status(403).json({ error: 'Only departments can check unread count' });
      }
      
      const count = await storage.getUnreadCountByDepartment(req.session.departmentId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get unread counts for all departments (for department cards)
  app.get("/api/messages/unread/by-department", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.departmentId) {
        return res.status(403).json({ error: 'Only departments can check unread counts' });
      }
      
      const counts = await storage.getUnreadCountsForAllDepartments(req.session.departmentId);
      res.json(counts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get messages between current department and another department
  app.get("/api/messages/department/:deptId", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.departmentId) {
        return res.status(403).json({ error: 'Only departments can access this endpoint' });
      }

      const otherDeptId = parseInt(req.params.deptId);
      if (isNaN(otherDeptId)) {
        return res.status(400).json({ error: 'Invalid department ID' });
      }

      // For subdepartments: validate that target department is accessible (parent + siblings only)
      if (req.session.isSubdepartment) {
        const accessibleDepts = await storage.getAccessibleDepartments(req.session.departmentId);
        const accessibleIds = new Set(accessibleDepts.map(d => d.id));
        
        if (!accessibleIds.has(otherDeptId)) {
          return res.status(403).json({ 
            error: 'Зершуъба метавонад танҳо паёмҳои шуъбаи асосӣ ва зершуъбаҳои ҳамсояро бинад' 
          });
        }
      }

      const messages = await storage.getMessagesByDepartmentPair(req.session.departmentId, otherDeptId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // File attachment routes (PostgreSQL storage)

  // Upload file attachment (standalone - without linking to message)
  // Returns attachment ID for later linking
  app.post("/api/attachments/upload", requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      console.log('[ATTACHMENT_UPLOAD_STANDALONE] Starting standalone upload:', {
        hasFile: !!req.file,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype,
        departmentId: req.session.departmentId,
      });
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          error: 'File type not allowed. Please upload documents, images, or archives only.' 
        });
      }

      // Save file to database without messageId (will be linked later)
      const decodedFilename = decodeFilename(req.file.originalname);
      const attachment = await storage.createAttachment({
        messageId: null, // Will be linked later
        file_name: decodedFilename,
        fileData: req.file.buffer,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      console.log('[ATTACHMENT_UPLOAD_STANDALONE] Upload successful:', {
        attachmentId: attachment.id,
        fileName: decodedFilename,
        fileSize: req.file.size,
      });

      res.json({ id: attachment.id, fileName: decodedFilename, fileSize: req.file.size });
    } catch (error: any) {
      console.error('[ATTACHMENT_UPLOAD_STANDALONE] Error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // Link pre-uploaded attachment to a message
  app.post("/api/messages/:id/attachments/link", requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      const { attachmentId } = req.body;

      console.log('[ATTACHMENT_LINK] Linking attachment to message:', {
        messageId,
        attachmentId,
        departmentId: req.session.departmentId,
      });

      if (isNaN(messageId) || !attachmentId) {
        return res.status(400).json({ error: 'Invalid message ID or attachment ID' });
      }

      // Verify message exists and user has access
      const message = await storage.getMessageById(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user has access to this message
      if (req.session.departmentId) {
        const deptId = req.session.departmentId;
        const isSender = message.senderId === deptId;
        const isLegacyRecipient = message.recipientId === deptId;
        const isArrayRecipient = message.recipientIds?.includes(deptId) ?? false;
        const hasAccess = isSender || isLegacyRecipient || isArrayRecipient;
        
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (!req.session.adminId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Link the attachment to the message
      await storage.linkAttachmentToMessage(attachmentId, messageId);

      console.log('[ATTACHMENT_LINK] Successfully linked attachment:', { attachmentId, messageId });
      res.json({ success: true });
    } catch (error: any) {
      console.error('[ATTACHMENT_LINK] Error:', error);
      res.status(500).json({ error: 'Failed to link attachment' });
    }
  });

  // Upload file attachment to message
  app.post("/api/messages/:id/attachments", requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      console.log('[ATTACHMENT_UPLOAD] Starting upload for message:', req.params.id, {
        hasFile: !!req.file,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype,
        departmentId: req.session.departmentId,
        adminId: req.session.adminId,
      });
      
      const messageId = parseInt(req.params.id);
      
      if (isNaN(messageId)) {
        console.log('[ATTACHMENT_UPLOAD] Invalid message ID:', req.params.id);
        return res.status(400).json({ error: 'Invalid message ID' });
      }

      if (!req.file) {
        console.log('[ATTACHMENT_UPLOAD] No file in request for message:', messageId);
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          error: 'File type not allowed. Please upload documents, images, or archives only.' 
        });
      }

      // Verify message exists and user has access
      const message = await storage.getMessageById(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user has access to this message
      if (req.session.departmentId) {
        const deptId = req.session.departmentId;
        const isSender = message.senderId === deptId;
        const isLegacyRecipient = message.recipientId === deptId;
        const isArrayRecipient = message.recipientIds?.includes(deptId) ?? false;
        const hasAccess = isSender || isLegacyRecipient || isArrayRecipient;
        
        console.log('[ATTACHMENT_UPLOAD] Access check:', {
          messageId,
          deptId,
          senderId: message.senderId,
          recipientId: message.recipientId,
          recipientIds: message.recipientIds,
          isSender,
          isLegacyRecipient,
          isArrayRecipient,
          hasAccess,
        });
        
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (!req.session.adminId) {
        // If not department and not admin, deny access
        return res.status(403).json({ error: 'Access denied' });
      }
      // Admins can upload to any message

      // Save file to database with properly decoded filename
      const decodedFilename = decodeFilename(req.file.originalname);
      const attachment = await storage.createAttachment({
        messageId,
        file_name: decodedFilename,
        fileData: req.file.buffer,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      res.json({
        id: attachment.id,
        filename: attachment.file_name,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
      });
    } catch (error: any) {
      console.error('Error uploading attachment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get attachments for a message
  app.get("/api/messages/:id/attachments", requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      
      if (isNaN(messageId)) {
        return res.status(400).json({ error: 'Invalid message ID' });
      }

      // Verify message exists and user has access
      const message = await storage.getMessageById(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user has access to this message
      if (req.session.departmentId) {
        const deptId = req.session.departmentId;
        const isSender = message.senderId === deptId;
        const isLegacyRecipient = message.recipientId === deptId;
        const isArrayRecipient = message.recipientIds?.includes(deptId) ?? false;
        const hasAccess = isSender || isLegacyRecipient || isArrayRecipient;
        
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' });
        }
        
        // Check if message was deleted by this department (per-user deletion)
        const deletedByRecipients = message.deletedByRecipientIds || [];
        const isDeletedForSender = isSender && message.isDeletedBySender;
        const isDeletedForRecipient = (isLegacyRecipient || isArrayRecipient) && 
          deletedByRecipients.includes(deptId);
        
        if (isSender && (isLegacyRecipient || isArrayRecipient)) {
          if (isDeletedForSender && isDeletedForRecipient) {
            return res.status(404).json({ error: 'Message not found' });
          }
        } else if (isDeletedForSender || isDeletedForRecipient) {
          return res.status(404).json({ error: 'Message not found' });
        }
        
        if (message.isDeleted) {
          return res.status(404).json({ error: 'Message not found' });
        }
      } else if (!req.session.adminId) {
        // If not department and not admin, deny access
        return res.status(403).json({ error: 'Access denied' });
      }
      // Admins can see all attachments

      // Get attachments
      const attachments = await storage.getAttachmentsByMessageId(messageId);
      
      // Return without file data, decode filenames for display
      res.json(attachments.map(att => ({
        id: att.id,
        filename: decodeFilename(att.file_name),
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        createdAt: att.createdAt,
      })));
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Download specific attachment
  app.get("/api/attachments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const attachmentId = parseInt(req.params.id);
      
      if (isNaN(attachmentId)) {
        return res.status(400).json({ error: 'Invalid attachment ID' });
      }

      // Get attachment
      const attachment = await storage.getAttachmentById(attachmentId);
      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Check if attachment is linked to a message
      if (!attachment.messageId) {
        return res.status(404).json({ error: 'Attachment not linked to a message' });
      }

      // Verify message exists and user has access
      const message = await storage.getMessageById(attachment.messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user has access to this message
      if (req.session.departmentId) {
        const deptId = req.session.departmentId;
        const isSender = message.senderId === deptId;
        const isLegacyRecipient = message.recipientId === deptId;
        const isArrayRecipient = message.recipientIds?.includes(deptId) ?? false;
        const hasAccess = isSender || isLegacyRecipient || isArrayRecipient;
        
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' });
        }
        
        // Check if message was deleted by this department (per-user deletion)
        const deletedByRecipients = message.deletedByRecipientIds || [];
        const isDeletedForSender = isSender && message.isDeletedBySender;
        const isDeletedForRecipient = (isLegacyRecipient || isArrayRecipient) && 
          deletedByRecipients.includes(deptId);
        
        if (isSender && (isLegacyRecipient || isArrayRecipient)) {
          if (isDeletedForSender && isDeletedForRecipient) {
            return res.status(404).json({ error: 'Attachment not found' });
          }
        } else if (isDeletedForSender || isDeletedForRecipient) {
          return res.status(404).json({ error: 'Attachment not found' });
        }
        
        if (message.isDeleted) {
          return res.status(404).json({ error: 'Attachment not found' });
        }
      } else if (!req.session.adminId) {
        // If not department and not admin, deny access
        return res.status(403).json({ error: 'Access denied' });
      }
      // Admins can download all attachments

      // Send file with decoded filename
      const decodedFilename = decodeFilename(attachment.file_name);
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(decodedFilename)}"`);
      res.setHeader('Content-Length', attachment.fileSize.toString());
      res.send(attachment.fileData);
    } catch (error: any) {
      console.error('Error downloading attachment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ASSIGNMENTS ROUTES ====================
  
  // Get all assignments (filtered by department if applicable)
  app.get("/api/assignments", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log('[ASSIGNMENTS] Fetching assignments for:', {
        departmentId: req.session.departmentId,
        adminId: req.session.adminId,
      });
      
      const allAssignments = await storage.getAssignments();
      console.log('[ASSIGNMENTS] Total assignments from DB:', allAssignments.length);
      
      // Filter assignments: show if department is creator OR recipient
      if (req.session.departmentId) {
        const filteredAssignments = allAssignments.filter(assignment => 
          // Show if department is the creator (sender)
          assignment.senderId === req.session.departmentId ||
          // OR if department is in recipients list
          (assignment.recipientIds && assignment.recipientIds.includes(req.session.departmentId as number)) ||
          // OR if no recipients specified (legacy backward compatibility - show to all)
          (!assignment.recipientIds || assignment.recipientIds.length === 0) ||
          // OR if senderId is NULL (legacy assignments before migration - show to departments with create permission)
          (assignment.senderId === null && req.session.departmentId)
        );
        console.log('[ASSIGNMENTS] Filtered assignments for department:', filteredAssignments.length);
        return res.json(filteredAssignments);
      }
      
      // Admin sees all assignments
      console.log('[ASSIGNMENTS] Returning all assignments for admin:', allAssignments.length);
      res.json(allAssignments);
    } catch (error: any) {
      console.error('[ASSIGNMENTS] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get single assignment
  app.get("/api/assignments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.getAssignmentById(id);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      res.json(assignment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create assignment (departments with canCreateAssignment permission or admins)
  app.post("/api/assignments", requireAuth, upload.array('files', 5), async (req: Request, res: Response) => {
    try {
      // Check permissions
      if (req.session.departmentId) {
        const dept = await storage.getDepartmentById(req.session.departmentId);
        if (!dept || !dept.canCreateAssignment) {
          return res.status(403).json({ error: 'No permission to create assignments' });
        }
      } else if (!req.session.adminId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Parse executorIds from JSON field
      const executorIdsRaw = JSON.parse(req.body.executorIds || '[]');
      if (!Array.isArray(executorIdsRaw)) {
        return res.status(400).json({ error: 'ExecutorIds must be an array' });
      }

      // Convert executorIds to numbers and remove duplicates
      const executorIds = Array.from(new Set(executorIdsRaw.map(id => parseInt(String(id), 10)).filter(id => !isNaN(id))));

      // Parse recipientIds from JSON field
      const recipientIdsRaw = JSON.parse(req.body.recipientIds || '[]');
      if (!Array.isArray(recipientIdsRaw)) {
        return res.status(400).json({ error: 'RecipientIds must be an array' });
      }
      const recipientIds = recipientIdsRaw.map(id => parseInt(String(id), 10)).filter(id => !isNaN(id));

      // Get all people and departments
      const allPeople = await storage.getPeople();
      const allDepartments = await storage.getDepartments();
      
      // Validate and get invited executor names from executorIds (Даъват - приглашенные)
      const executors: string[] = [];
      if (executorIds.length > 0) {
        const selectedPeople = allPeople.filter((p: any) => executorIds.includes(p.id));
        
        // Validate that all executorIds belong to selected departments (or their parent)
        for (const person of selectedPeople) {
          if (!person.departmentId) {
            return res.status(400).json({ 
              error: `Executor ${person.name} does not belong to selected departments` 
            });
          }
          const personDept = allDepartments.find((d: any) => d.id === person.departmentId);
          const deptOrParentInRecipients = recipientIds.includes(person.departmentId) || 
            (personDept?.parentDepartmentId && recipientIds.includes(personDept.parentDepartmentId));
          if (!deptOrParentInRecipients) {
            return res.status(400).json({ 
              error: `Executor ${person.name} does not belong to selected departments` 
            });
          }
          executors.push(person.name);
        }
        
        // Verify all executor IDs were found
        if (selectedPeople.length !== executorIds.length) {
          return res.status(400).json({ error: 'Some executor IDs are invalid' });
        }
      }
      const recipientDepts = allDepartments.filter((d: any) => recipientIds.includes(d.id));
      
      let allDepartmentExecutorIds: number[] = [];
      let allDepartmentExecutors: string[] = [];
      let finalExecutors = executors;
      let finalExecutorIds = executorIds;
      
      if (executorIds.length > 0) {
        // User selected specific people
        // First person goes to Даъват, rest go to Иҷрокунандагон
        const selectedPeople = allPeople.filter((p: any) => executorIds.includes(p.id));
        
        // Sort by the order they were selected (maintain executorIds order)
        const orderedPeople: any[] = executorIds
          .map(id => selectedPeople.find((p: any) => p.id === id))
          .filter(Boolean) as any[];
        
        if (orderedPeople.length > 0) {
          const firstPerson = orderedPeople[0];
          // First person goes to Даъват
          finalExecutors = [firstPerson.name];
          finalExecutorIds = [firstPerson.id];
          
          // Remaining people go to Иҷрокунандагон
          if (orderedPeople.length > 1) {
            allDepartmentExecutors = orderedPeople.slice(1).map((p: any) => p.name);
            allDepartmentExecutorIds = orderedPeople.slice(1).map((p: any) => p.id);
          } else {
            // Only 1 person selected - other departments (excluding person's dept) become Иҷрокунандагон
            const personDeptId = firstPerson.departmentId;
            const otherDepts = recipientDepts.filter((d: any) => d.id !== personDeptId);
            allDepartmentExecutors = otherDepts.map((d: any) => d.name);
            allDepartmentExecutorIds = otherDepts.map((d: any) => d.id);
          }
        }
      } else {
        // No people selected - use department names
        // First department goes to Даъват, rest go to Иҷрокунандагон
        if (recipientDepts.length > 0) {
          // First department as Даъват
          finalExecutors = [recipientDepts[0].name];
          finalExecutorIds = [recipientDepts[0].id];
          
          // Rest of departments as Иҷрокунандагон
          if (recipientDepts.length > 1) {
            allDepartmentExecutors = recipientDepts.slice(1).map((d: any) => d.name);
            allDepartmentExecutorIds = recipientDepts.slice(1).map((d: any) => d.id);
          }
        }
      }

      // Determine senderId: for departments use departmentId, for admins require explicit sender
      let senderId: number;
      if (req.session.departmentId) {
        senderId = req.session.departmentId;
      } else if (req.session.adminId) {
        // Admins MUST specify senderId explicitly with validation
        if (!req.body.senderId) {
          return res.status(400).json({ error: 'Admins must specify senderId (creator department)' });
        }
        senderId = parseInt(req.body.senderId);
        if (isNaN(senderId)) {
          return res.status(400).json({ error: 'Invalid senderId' });
        }
        // Validate that sender department exists
        const senderDept = await storage.getDepartmentById(senderId);
        if (!senderDept) {
          return res.status(400).json({ error: 'Sender department not found' });
        }
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Prepare assignment data
      const assignmentData = {
        senderId: senderId, // Creator department ID
        documentTypeId: req.body.documentTypeId ? parseInt(req.body.documentTypeId) : null,
        topic: null, // deprecated, use documentTypeId
        content: req.body.content || null,
        documentNumber: req.body.documentNumber || null,
        executors: finalExecutors, // Invited executors (Даъват) - people or first department
        executorIds: finalExecutorIds, // Invited executor IDs (Даъват)
        allDepartmentExecutors: allDepartmentExecutors, // All department people or remaining departments (Иҷрокунандагон)
        allDepartmentExecutorIds: allDepartmentExecutorIds, // All department people IDs or remaining department IDs (Иҷрокунандагон)
        recipientIds: recipientIds,
        deadline: new Date(req.body.deadline),
      };

      // Validate assignment data
      const validationResult = insertAssignmentSchema.safeParse(assignmentData);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Invalid request data', details: validationResult.error.errors });
      }

      // Validate files
      const files = req.files as Express.Multer.File[] || [];
      for (const file of files) {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return res.status(400).json({ 
            error: `File type not allowed: ${file.originalname}. Please upload documents, images, or archives only.` 
          });
        }
      }

      // Create assignment
      const assignment = await storage.createAssignment(validationResult.data);

      // Attach files in parallel for better performance
      if (files.length > 0) {
        await Promise.all(
          files.map(file => 
            storage.createAssignmentAttachment({
              assignmentId: assignment.id,
              fileData: file.buffer,
              file_name: decodeFilename(file.originalname),
              fileSize: file.size,
              mimeType: file.mimetype,
            })
          )
        );
      }

      // Send push notifications to recipients
      // Refetch assignment to get authoritative recipientIds
      const sendPushNotification = (app as any).sendPushNotification;
      if (sendPushNotification) {
        const createdAssignment = await storage.getAssignmentById(assignment.id);
        if (!createdAssignment) {
          console.error('Failed to refetch assignment for push notifications, assignment ID:', assignment.id);
        } else {
          const finalRecipientIds = createdAssignment.recipientIds || [];
          
          if (finalRecipientIds.length > 0 && createdAssignment.senderId) {
            const sender = await storage.getDepartmentById(createdAssignment.senderId);
            const senderName = sender?.name || 'Неизвестно';
            
            // Get document type name for notification
            let docTypeName = 'Супориш';
            if (createdAssignment.documentTypeId) {
              const docType = await storage.getDocumentTypeById(createdAssignment.documentTypeId);
              if (docType) docTypeName = docType.name;
            }
            
            // Send notification to each recipient department
            const notificationPromises = finalRecipientIds.map(recipientId =>
              sendPushNotification(recipientId, 'department', {
                title: 'Супориши нав',
                body: `${docTypeName} - ${senderName}`,
                icon: 'https://ecodoc.cc/pwa-192.png',
                badge: 'https://ecodoc.cc/pwa-192.png',
                url: '/department/assignments',
              }).catch((err: any) => console.error('Push notification failed:', err))
            );
            
            // Wait for all notifications to complete
            await Promise.allSettled(notificationPromises);
          } else {
            console.error('No recipients for push notification after normalization, assignment ID:', assignment.id, 'recipientIds:', finalRecipientIds);
          }
        }
      }

      res.json(assignment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Edit assignment (creator department or admin)
  app.patch("/api/assignments/:id", requireAuth, upload.array('files', 5), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.getAssignmentById(id);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      if (req.session.departmentId) {
        if (assignment.senderId !== req.session.departmentId) {
          return res.status(403).json({ error: 'Only the creator department can edit this assignment' });
        }
      } else if (!req.session.adminId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const executorIdsRaw = JSON.parse(req.body.executorIds || '[]');
      if (!Array.isArray(executorIdsRaw)) {
        return res.status(400).json({ error: 'ExecutorIds must be an array' });
      }
      const executorIds = Array.from(new Set(executorIdsRaw.map((eid: any) => parseInt(String(eid), 10)).filter((eid: number) => !isNaN(eid))));

      const recipientIdsRaw = JSON.parse(req.body.recipientIds || '[]');
      if (!Array.isArray(recipientIdsRaw)) {
        return res.status(400).json({ error: 'RecipientIds must be an array' });
      }
      const recipientIds = recipientIdsRaw.map((rid: any) => parseInt(String(rid), 10)).filter((rid: number) => !isNaN(rid));

      const allPeople = await storage.getPeople();
      const allDepartments = await storage.getDepartments();

      const executors: string[] = [];
      if (executorIds.length > 0) {
        const selectedPeople = allPeople.filter((p: any) => executorIds.includes(p.id));
        for (const person of selectedPeople) {
          if (!person.departmentId) {
            return res.status(400).json({ 
              error: `Executor ${person.name} does not belong to selected departments` 
            });
          }
          const personDept = allDepartments.find((d: any) => d.id === person.departmentId);
          const deptOrParentInRecipients = recipientIds.includes(person.departmentId) || 
            (personDept?.parentDepartmentId && recipientIds.includes(personDept.parentDepartmentId));
          if (!deptOrParentInRecipients) {
            return res.status(400).json({ 
              error: `Executor ${person.name} does not belong to selected departments` 
            });
          }
          executors.push(person.name);
        }
        if (selectedPeople.length !== executorIds.length) {
          return res.status(400).json({ error: 'Some executor IDs are invalid' });
        }
      }

      const recipientDepts = allDepartments.filter((d: any) => recipientIds.includes(d.id));

      let allDepartmentExecutorIds: number[] = [];
      let allDepartmentExecutors: string[] = [];
      let finalExecutors = executors;
      let finalExecutorIds = executorIds;

      if (executorIds.length > 0) {
        const selectedPeople = allPeople.filter((p: any) => executorIds.includes(p.id));
        const orderedPeople: any[] = executorIds
          .map((eid: number) => selectedPeople.find((p: any) => p.id === eid))
          .filter(Boolean) as any[];

        if (orderedPeople.length > 0) {
          const firstPerson = orderedPeople[0];
          finalExecutors = [firstPerson.name];
          finalExecutorIds = [firstPerson.id];

          if (orderedPeople.length > 1) {
            allDepartmentExecutors = orderedPeople.slice(1).map((p: any) => p.name);
            allDepartmentExecutorIds = orderedPeople.slice(1).map((p: any) => p.id);
          } else {
            const personDeptId = firstPerson.departmentId;
            const otherDepts = recipientDepts.filter((d: any) => d.id !== personDeptId);
            allDepartmentExecutors = otherDepts.map((d: any) => d.name);
            allDepartmentExecutorIds = otherDepts.map((d: any) => d.id);
          }
        }
      } else {
        if (recipientDepts.length > 0) {
          finalExecutors = [recipientDepts[0].name];
          finalExecutorIds = [recipientDepts[0].id];

          if (recipientDepts.length > 1) {
            allDepartmentExecutors = recipientDepts.slice(1).map((d: any) => d.name);
            allDepartmentExecutorIds = recipientDepts.slice(1).map((d: any) => d.id);
          }
        }
      }

      const updatedData: any = {
        documentTypeId: req.body.documentTypeId ? parseInt(req.body.documentTypeId) : null,
        content: req.body.content || null,
        documentNumber: req.body.documentNumber || null,
        executors: finalExecutors,
        executorIds: finalExecutorIds,
        allDepartmentExecutors: allDepartmentExecutors,
        allDepartmentExecutorIds: allDepartmentExecutorIds,
        recipientIds: recipientIds,
        deadline: new Date(req.body.deadline),
      };

      const updated = await storage.updateAssignment(id, updatedData);
      if (!updated) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      const files = req.files as Express.Multer.File[] || [];
      for (const file of files) {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return res.status(400).json({ 
            error: `File type not allowed: ${file.originalname}` 
          });
        }
      }

      if (files.length > 0) {
        await Promise.all(
          files.map(file =>
            storage.createAssignmentAttachment({
              assignmentId: id,
              fileData: file.buffer,
              file_name: decodeFilename(file.originalname),
              fileSize: file.size,
              mimeType: file.mimetype,
            })
          )
        );
      }

      const finalAssignment = await storage.getAssignmentById(id);
      res.json(finalAssignment);
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark assignment as completed
  app.patch("/api/assignments/:id/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.markAssignmentAsCompleted(id);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      res.json(assignment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Approve or reject assignment (for sender/creator)
  app.patch("/api/assignments/:id/approve", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected"' });
      }
      
      const assignment = await storage.getAssignmentById(id);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      // Check if user is the sender (creator) of the assignment
      const userDepartmentId = req.session.userType === 'department' ? req.session.departmentId : null;
      if (!userDepartmentId || assignment.senderId !== userDepartmentId) {
        return res.status(403).json({ error: 'Only the assignment creator can approve or reject it' });
      }
      
      // Update the assignment with approval status
      const updateData: any = {
        approvalStatus: status,
        approvedByDepartmentId: userDepartmentId,
        approvedAt: new Date(),
      };
      if (status === 'approved') {
        updateData.isCompleted = true;
        updateData.completedAt = new Date();
      }
      const [updated] = await db
        .update(assignments)
        .set(updateData)
        .where(eq(assignments.id, id))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create assignment reply with attachments (Чавоб додан)
  app.post("/api/assignments/:id/replies", requireAuth, upload.array('files', 5), async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const { replyText, documentContent, documentFilename, responderPersonId } = req.body;
      
      if (!replyText || typeof replyText !== 'string' || replyText.trim() === '') {
        return res.status(400).json({ error: 'Reply text is required' });
      }
      
      // Get the assignment
      const assignment = await storage.getAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      // Get responder department ID from session
      const responderDepartmentId = req.session.userType === 'department' 
        ? req.session.departmentId 
        : null;
      
      if (!responderDepartmentId) {
        return res.status(403).json({ error: 'Only departments can reply to assignments' });
      }
      
      // Check if department is a recipient of this assignment
      const isRecipient = assignment.recipientIds?.includes(responderDepartmentId);
      if (!isRecipient) {
        return res.status(403).json({ error: 'Only recipient departments can reply to this assignment' });
      }
      
      // Create the reply (no documentContent stored as text - it will be converted to DOCX)
      const reply = await storage.createAssignmentReply({
        assignmentId,
        responderDepartmentId,
        responderPersonId: responderPersonId ? parseInt(responderPersonId) : null,
        replyText: replyText.trim(),
        documentContent: null, // Document content is now saved as DOCX attachment
      });
      
      // Handle file attachments
      const files = req.files as Express.Multer.File[];
      const attachmentsResult = [];
      
      // If documentContent is provided, convert to DOCX and save as attachment
      if (documentContent && documentContent.trim()) {
        const sanitizedContent = DOMPurify.sanitize(documentContent, { 
          ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
          ALLOWED_ATTR: ['colspan', 'rowspan'],
          ALLOW_DATA_ATTR: false,
          ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
        });
        
        // Convert HTML to DOCX
        const { Document, Packer, Paragraph, TextRun } = await import('docx');
        
        // Parse HTML and convert to DOCX paragraphs (simplified conversion)
        const textContent = sanitizedContent
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();
        
        const paragraphs = textContent.split(/\n+/).filter((p: string) => p.trim()).map((text: string) => 
          new Paragraph({
            children: [new TextRun({ text: text.trim(), size: 24 })],
          })
        );
        
        const doc = new Document({
          sections: [{
            properties: {},
            children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [new TextRun('')] })],
          }],
        });
        
        const docxBuffer = await Packer.toBuffer(doc);
        
        // Save as attachment with custom or default filename
        const safeFilename = (documentFilename || 'Ҳуҷҷат').replace(/[<>:"/\\|?*]/g, '_').trim() || 'Ҳуҷҷат';
        const docxAttachment = await storage.createAssignmentReplyAttachment({
          replyId: reply.id,
          filename: `${safeFilename}.docx`,
          fileData: Buffer.from(docxBuffer),
          fileSize: docxBuffer.byteLength,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        attachmentsResult.push({
          id: docxAttachment.id,
          filename: docxAttachment.filename,
          fileSize: docxAttachment.fileSize,
          mimeType: docxAttachment.mimeType,
        });
      }
      
      // Handle user-uploaded file attachments
      if (files && files.length > 0) {
        for (const file of files) {
          const attachment = await storage.createAssignmentReplyAttachment({
            replyId: reply.id,
            filename: file.originalname,
            fileData: file.buffer,
            fileSize: file.size,
            mimeType: file.mimetype,
          });
          attachmentsResult.push({
            id: attachment.id,
            filename: attachment.filename,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
          });
        }
      }
      
      res.status(201).json({ ...reply, attachments: attachmentsResult });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get assignment reply attachments with authorization
  app.get("/api/assignment-reply-attachments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const attachment = await storage.getAssignmentReplyAttachment(id);
      
      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }
      
      // Authorization check: verify user has access to the parent assignment
      const reply = await storage.getAssignmentReplyById(attachment.replyId);
      if (!reply) {
        return res.status(404).json({ error: 'Reply not found' });
      }
      
      const assignment = await storage.getAssignmentById(reply.assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      // Allow access for: admin, sender, or recipients
      const departmentId = req.session.departmentId;
      const isAdmin = req.session.userType === 'admin';
      const isSender = assignment.senderId === departmentId;
      const isRecipient = assignment.recipientIds?.includes(departmentId);
      
      if (!isAdmin && !isSender && !isRecipient) {
        return res.status(403).json({ error: 'Access denied to this attachment' });
      }
      
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.filename)}"`);
      res.send(attachment.fileData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete assignment (only creator can delete)
  app.delete("/api/assignments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get assignment to check creator
      const assignment = await storage.getAssignmentById(id);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      // Check permissions: only creator department or admins can delete
      if (req.session.departmentId) {
        // If senderId is null (legacy), allow any recipient with permission to delete
        if (assignment.senderId && assignment.senderId !== req.session.departmentId) {
          return res.status(403).json({ error: 'Only the creator can delete this assignment' });
        }
        // For null senderId (legacy), check if user has permission to create assignments
        if (!assignment.senderId) {
          const dept = await storage.getDepartmentById(req.session.departmentId);
          if (!dept || !dept.canCreateAssignment) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }
      } else if (!req.session.adminId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const deleted = await storage.deleteAssignment(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get assignment attachments
  app.get("/api/assignments/:id/attachments", requireAuth, async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.id);
      
      // Verify assignment exists and is not deleted
      const assignment = await storage.getAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      const attachments = await storage.getAssignmentAttachments(assignmentId);
      res.json(attachments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download assignment attachment
  app.get("/api/assignment-attachments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const attachment = await storage.getAssignmentAttachmentById(id);
      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Verify parent assignment exists and is not deleted
      const assignment = await storage.getAssignmentById(attachment.assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found or has been deleted' });
      }

      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.file_name)}"`);
      res.setHeader('Content-Length', attachment.fileSize.toString());
      res.send(attachment.fileData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trash endpoints for assignments
  app.get("/api/trash/assignments", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get all deleted assignments
      const deletedAssignments = await storage.listDeletedAssignments();
      
      // Filter: show if department is creator OR recipient (strict filtering for trash)
      if (req.session.departmentId) {
        const filteredAssignments = deletedAssignments.filter(assignment => 
          // Show if department is the creator (sender)
          assignment.senderId === req.session.departmentId ||
          // OR if department is in recipients list (including legacy assignments with NULL sender but valid recipients)
          (assignment.recipientIds && assignment.recipientIds.includes(req.session.departmentId as number))
        );
        return res.json(filteredAssignments);
      }
      
      // Admin sees all deleted assignments
      res.json(deletedAssignments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/trash/assignments/:id/restore", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the assignment from trash
      const deletedAssignments = await storage.listDeletedAssignments();
      const assignmentToRestore = deletedAssignments.find(a => a.id === id);
      
      if (!assignmentToRestore) {
        return res.status(404).json({ error: 'Assignment not found in trash' });
      }
      
      // Only creator or admin can restore
      if (req.session.departmentId) {
        // If senderId exists, only creator can restore
        if (assignmentToRestore.senderId && assignmentToRestore.senderId !== req.session.departmentId) {
          return res.status(403).json({ error: 'Only the creator can restore this assignment' });
        }
        // For null senderId (legacy), allow any recipient with permission to restore
        if (!assignmentToRestore.senderId) {
          const dept = await storage.getDepartmentById(req.session.departmentId);
          if (!dept || !dept.canCreateAssignment) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }
      } else if (!req.session.adminId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const restored = await storage.restoreAssignment(id);
      
      if (!restored) {
        return res.status(500).json({ error: 'Failed to restore assignment' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Permanently delete an assignment (Admin only)
  app.delete("/api/trash/assignments/:id/permanent", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only admins can permanently delete
      if (req.session.departmentId) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.permanentDeleteAssignment(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get deleted assignments for a specific department (Admin only)
  app.get("/api/trash/assignments/department/:deptId", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only admins can view trash for specific departments
      if (req.session.departmentId) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      const deptId = parseInt(req.params.deptId);
      const deletedAssignments = await storage.listDeletedAssignments();
      
      // Filter assignments where this department is sender or recipient
      const filtered = deletedAssignments.filter(assignment => 
        assignment.senderId === deptId ||
        (assignment.recipientIds && assignment.recipientIds.includes(deptId))
      );
      
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trash endpoints for announcements
  app.get("/api/trash/announcements", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get all deleted announcements
      const deletedAnnouncements = await storage.listDeletedAnnouncements();
      
      // Filter: show if department is recipient
      if (req.session.departmentId) {
        const filteredAnnouncements = deletedAnnouncements.filter(announcement => 
          // Show if no specific recipients (broadcast to all)
          !announcement.recipientIds || announcement.recipientIds.length === 0 ||
          // OR if department is in recipients list
          announcement.recipientIds.includes(req.session.departmentId as number)
        );
        return res.json(filteredAnnouncements);
      }
      
      // Admin sees all deleted announcements
      res.json(deletedAnnouncements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/trash/announcements/:id/restore", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Only admin can restore announcements
      if (!req.session.adminId) {
        return res.status(403).json({ error: 'Only admins can restore announcements' });
      }
      
      const restored = await storage.restoreAnnouncement(id);
      
      if (!restored) {
        return res.status(500).json({ error: 'Failed to restore announcement' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Permanently delete an announcement (Admin only)
  app.delete("/api/trash/announcements/:id/permanent", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only admins can permanently delete
      if (!req.session.adminId) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.permanentDeleteAnnouncement(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get deleted announcements for a specific department (Admin only)
  app.get("/api/trash/announcements/department/:deptId", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only admins can view trash for specific departments
      if (req.session.departmentId) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      const deptId = parseInt(req.params.deptId);
      const deletedAnnouncements = await storage.listDeletedAnnouncements();
      
      // Filter announcements where this department is a recipient or it's broadcast to all
      const filtered = deletedAnnouncements.filter(announcement => 
        !announcement.recipientIds || announcement.recipientIds.length === 0 ||
        announcement.recipientIds.includes(deptId)
      );
      
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ANNOUNCEMENTS ROUTES ====================
  
  // Get all announcements
  app.get("/api/announcements", requireAuth, async (req: Request, res: Response) => {
    try {
      // If department user, filter announcements by recipient
      const departmentId = req.session.departmentId;
      const announcements = await storage.getAnnouncements(departmentId);
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single announcement
  app.get("/api/announcements/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const announcement = await storage.getAnnouncementById(id);
      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create announcement (departments with canCreateAnnouncement permission or admins)
  app.post("/api/announcements", requireAuth, async (req: Request, res: Response) => {
    try {
      // Check permissions
      if (req.session.departmentId) {
        const dept = await storage.getDepartmentById(req.session.departmentId);
        if (!dept || !dept.canCreateAnnouncement) {
          return res.status(403).json({ error: 'No permission to create announcements' });
        }
      } else if (!req.session.adminId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Validate request body
      const validationResult = insertAnnouncementSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Invalid request data', details: validationResult.error.errors });
      }

      const announcement = await storage.createAnnouncement(validationResult.data);
      
      // Send push notifications to all recipients
      // Refetch announcement to get authoritative recipientIds
      const sendPushNotification = (app as any).sendPushNotification;
      if (sendPushNotification) {
        const createdAnnouncement = await storage.getAnnouncementById(announcement.id);
        if (!createdAnnouncement) {
          console.error('Failed to refetch announcement for push notifications, announcement ID:', announcement.id);
        } else {
          const finalRecipientIds = createdAnnouncement.recipientIds || [];
          
          if (finalRecipientIds.length > 0) {
            // Send notification to each recipient department
            const notificationPromises = finalRecipientIds.map(recipientId =>
              sendPushNotification(recipientId, 'department', {
                title: 'Эълони нав',
                body: createdAnnouncement.content.substring(0, 100),
                icon: 'https://ecodoc.cc/pwa-192.png',
                badge: 'https://ecodoc.cc/pwa-192.png',
                url: '/department/announcements',
              }).catch((err: any) => console.error('Push notification failed:', err))
            );
            
            // Wait for all notifications to complete
            await Promise.allSettled(notificationPromises);
          } else {
            console.error('No recipients for push notification after normalization, announcement ID:', announcement.id, 'recipientIds:', finalRecipientIds);
          }
        }
      }
      
      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete announcement (departments with canCreateAnnouncement permission or admins)
  app.delete("/api/announcements/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      // Check permissions (use same permission as create)
      if (req.session.departmentId) {
        const dept = await storage.getDepartmentById(req.session.departmentId);
        if (!dept || !dept.canCreateAnnouncement) {
          return res.status(403).json({ error: 'No permission to delete announcements' });
        }
      } else if (!req.session.adminId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAnnouncement(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get announcement attachments
  app.get("/api/announcements/:id/attachments", requireAuth, async (req: Request, res: Response) => {
    try {
      const announcementId = parseInt(req.params.id);
      const attachments = await storage.getAnnouncementAttachments(announcementId);
      res.json(attachments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download announcement attachment
  app.get("/api/announcement-attachments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const attachment = await storage.getAnnouncementAttachmentById(id);
      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.file_name)}"`);
      res.setHeader('Content-Length', attachment.fileSize.toString());
      res.send(attachment.fileData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark announcement as read
  app.post("/api/announcements/:id/mark-read", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const departmentId = req.session.departmentId;
      
      if (!departmentId) {
        return res.status(403).json({ error: 'Only departments can mark announcements as read' });
      }

      const announcement = await storage.markAnnouncementAsRead(id, departmentId);
      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get counters for department
  app.get("/api/counters", requireAuth, async (req: Request, res: Response) => {
    try {
      const departmentId = req.session.departmentId;
      
      if (!departmentId) {
        return res.status(403).json({ error: 'Only departments can access counters' });
      }

      const unreadAnnouncements = await storage.getUnreadAnnouncementsCount(departmentId);
      const uncompletedAssignments = await storage.getUncompletedAssignmentsCount(departmentId);
      
      res.json({
        unreadAnnouncements,
        uncompletedAssignments
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Export chat archive for admin (ZIP with folders per message)
  app.get("/api/admin/departments/:departmentId/archive/:direction", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const JSZip = (await import('jszip')).default;
      const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx');
      
      const departmentId = parseInt(req.params.departmentId);
      const direction = req.params.direction as 'inbox' | 'outbox';

      if (!['inbox', 'outbox'].includes(direction)) {
        return res.status(400).json({ error: 'Invalid direction' });
      }

      const department = await storage.getDepartmentById(departmentId);
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }

      // Get messages
      const allMessages = await storage.getMessagesByDepartment(departmentId);
      const messages = direction === 'inbox' ? allMessages.inbox : allMessages.outbox;

      const directionLabel = direction === 'inbox' ? 'Воридшуда' : 'Ирсолшуда';

      // Get all unique department IDs
      const allDeptIds = new Set<number>();
      messages.forEach(msg => {
        allDeptIds.add(msg.senderId);
        if (msg.recipientIds && msg.recipientIds.length > 0) {
          msg.recipientIds.forEach((id: number) => allDeptIds.add(id));
        }
        if (msg.recipientId) {
          allDeptIds.add(msg.recipientId);
        }
      });

      // Bulk fetch all departments
      const depts = await Promise.all(
        Array.from(allDeptIds).map(id => storage.getDepartmentById(id))
      );
      const deptMap = new Map(depts.filter(Boolean).map((d: any) => [d.id, d]));

      // Create ZIP archive
      const zip = new JSZip();

      // Process each message
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        
        const messageDate = message.documentDate 
          ? new Date(message.documentDate)
          : new Date(message.createdAt);

        // Safe date format: YYYY-MM-DD (no problematic characters)
        const year = messageDate.getFullYear();
        const month = String(messageDate.getMonth() + 1).padStart(2, '0');
        const day = String(messageDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // Get sender
        const sender = deptMap.get(message.senderId);

        // Get recipients
        const recipientIdsList = message.recipientIds && message.recipientIds.length > 0
          ? message.recipientIds
          : message.recipientId
            ? [message.recipientId]
            : [];
        const recipients = recipientIdsList.map((id: number) => deptMap.get(id)).filter(Boolean);

        // Create folder name with strict sanitization (prevent Zip Slip attack)
        const subject = message.subject || 'Мавзуъ нест';
        // Remove all potentially dangerous characters including path separators, parent directory references, and Windows-invalid chars
        const sanitizedSubject = subject
          .replace(/\.\./g, '')  // Remove parent directory references
          .replace(/[/\\?%*:|"<>\x00-\x1f]/g, '_')  // Remove path separators and invalid chars
          .trim()
          .substring(0, 50);  // Limit subject length
        
        const folderName = `${String(i + 1).padStart(3, '0')}_${dateStr}_${sanitizedSubject}`;

        // Create Word document for message
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'ПАЁМ',
                    bold: true,
                    size: 32,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Сана: ',
                    bold: true,
                  }),
                  new TextRun({
                    text: messageDate.toLocaleString('tg-TJ', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }),
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Аз: ',
                    bold: true,
                  }),
                  new TextRun({
                    text: sender?.name || 'Номаълум',
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Ба: ',
                    bold: true,
                  }),
                  new TextRun({
                    text: recipients.map((r: any) => r?.name).join(', ') || 'Номаълум',
                  }),
                ],
                spacing: { after: 200 },
              }),
              ...(message.subject ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Мавзуъ: ',
                      bold: true,
                    }),
                    new TextRun({
                      text: message.subject,
                    }),
                  ],
                  spacing: { after: 200 },
                }),
              ] : []),
              ...(message.documentNumber ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Рақами ҳуҷҷат: ',
                      bold: true,
                    }),
                    new TextRun({
                      text: message.documentNumber,
                    }),
                  ],
                  spacing: { after: 200 },
                }),
              ] : []),
              new Paragraph({
                children: [
                  new TextRun({
                    text: '',
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Матн:',
                    bold: true,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: message.content,
                  }),
                ],
                spacing: { after: 400 },
              }),
            ],
          }],
        });

        // Generate Word document buffer
        const docBuffer = await Packer.toBuffer(doc);
        
        // Add Word document to ZIP
        zip.folder(folderName)?.file('паём.docx', docBuffer);

        // Get and add attachments
        const attachments = await storage.getAttachmentsByMessageId(message.id);
        
        for (const attachment of attachments) {
          if (attachment.fileData) {
            // Sanitize attachment filename (prevent Zip Slip)
            const sanitizedFileName = attachment.file_name
              .replace(/\.\./g, '')
              .replace(/[/\\?%*:|"<>\x00-\x1f]/g, '_')
              .trim();
            
            // Add attachment to the message folder
            zip.folder(folderName)?.file(sanitizedFileName, attachment.fileData);
          }
        }
      }

      // Generate ZIP buffer
      const zipBuffer = await zip.generateAsync({ 
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Send ZIP file
      const filename = `${department.name}_${directionLabel}_${new Date().toISOString().split('T')[0]}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(zipBuffer);
    } catch (error: any) {
      console.error('Archive generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Export combined archive (both inbox and outbox) for admin
  app.get("/api/admin/departments/:departmentId/archive", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const JSZip = (await import('jszip')).default;
      const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx');
      
      const departmentId = parseInt(req.params.departmentId);

      const department = await storage.getDepartmentById(departmentId);
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }

      const allMessages = await storage.getMessagesByDepartment(departmentId);

      const allDeptIds = new Set<number>();
      [...allMessages.inbox, ...allMessages.outbox].forEach(msg => {
        allDeptIds.add(msg.senderId);
        if (msg.recipientIds && msg.recipientIds.length > 0) {
          msg.recipientIds.forEach((id: number) => allDeptIds.add(id));
        }
        if (msg.recipientId) {
          allDeptIds.add(msg.recipientId);
        }
      });

      const depts = await Promise.all(
        Array.from(allDeptIds).map(id => storage.getDepartmentById(id))
      );
      const deptMap = new Map(depts.filter(Boolean).map((d: any) => [d.id, d]));

      const zip = new JSZip();

      const processMessages = async (messages: any[], folderPrefix: string) => {
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          
          const messageDate = message.documentDate 
            ? new Date(message.documentDate)
            : new Date(message.createdAt);

          const year = messageDate.getFullYear();
          const month = String(messageDate.getMonth() + 1).padStart(2, '0');
          const day = String(messageDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          const sender = deptMap.get(message.senderId);

          const recipientIdsList = message.recipientIds && message.recipientIds.length > 0
            ? message.recipientIds
            : message.recipientId
              ? [message.recipientId]
              : [];
          const recipients = recipientIdsList.map((id: number) => deptMap.get(id)).filter(Boolean);

          const subject = message.subject || 'Мавзуъ нест';
          const sanitizedSubject = subject
            .replace(/\.\./g, '')
            .replace(/[/\\?%*:|"<>\x00-\x1f]/g, '_')
            .trim()
            .substring(0, 50);
          
          const folderName = `${folderPrefix}/${String(i + 1).padStart(3, '0')}_${dateStr}_${sanitizedSubject}`;

          const doc = new Document({
            sections: [{
              properties: {},
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'ПАЁМ', bold: true, size: 32 })],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Сана: ', bold: true }),
                    new TextRun({ text: messageDate.toLocaleString('tg-TJ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }),
                  ],
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Аз: ', bold: true }),
                    new TextRun({ text: sender?.name || 'Номаълум' }),
                  ],
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Ба: ', bold: true }),
                    new TextRun({ text: recipients.map((r: any) => r?.name).join(', ') || 'Номаълум' }),
                  ],
                  spacing: { after: 200 },
                }),
                ...(message.subject ? [new Paragraph({
                  children: [new TextRun({ text: 'Мавзуъ: ', bold: true }), new TextRun({ text: message.subject })],
                  spacing: { after: 200 },
                })] : []),
                ...(message.documentNumber ? [new Paragraph({
                  children: [new TextRun({ text: 'Рақами ҳуҷҷат: ', bold: true }), new TextRun({ text: message.documentNumber })],
                  spacing: { after: 200 },
                })] : []),
                new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 200 } }),
                new Paragraph({ children: [new TextRun({ text: 'Матн:', bold: true })], spacing: { after: 200 } }),
                new Paragraph({ children: [new TextRun({ text: message.content })], spacing: { after: 400 } }),
              ],
            }],
          });

          const docBuffer = await Packer.toBuffer(doc);
          zip.folder(folderName)?.file('паём.docx', docBuffer);

          const attachments = await storage.getAttachmentsByMessageId(message.id);
          for (const attachment of attachments) {
            if (attachment.fileData) {
              const sanitizedFileName = attachment.file_name
                .replace(/\.\./g, '')
                .replace(/[/\\?%*:|"<>\x00-\x1f]/g, '_')
                .trim();
              zip.folder(folderName)?.file(sanitizedFileName, attachment.fileData);
            }
          }
        }
      };

      await processMessages(allMessages.inbox, 'Воридшуда');
      await processMessages(allMessages.outbox, 'Ирсолшуда');

      const zipBuffer = await zip.generateAsync({ 
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const filename = `${department.name}_Архив_${new Date().toISOString().split('T')[0]}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(zipBuffer);
    } catch (error: any) {
      console.error('Combined archive generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Push Notifications Endpoints
  
  // Configure VAPID details from backend environment variables
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@ecodoc.tj';

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('⚠️ VAPID keys not configured. Push notifications will not work.');
    console.warn('Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.');
  } else {
    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );
    console.log('✅ Push notifications configured');
  }

  // Subscribe to push notifications
  app.post("/api/push/subscribe", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get user from session (set by requireAuth middleware)
      const req_any = req as any;
      const departmentId = req_any.session?.departmentId;
      const adminId = req_any.session?.adminId;
      
      console.log('[PUSH_SUBSCRIBE_HANDLER] Session check:', {
        hasDepartmentId: !!departmentId,
        hasAdminId: !!adminId,
        sessionKeys: req_any.session ? Object.keys(req_any.session) : 'NO_SESSION'
      });

      if (!departmentId && !adminId) {
        console.warn('[PUSH_SUBSCRIBE_HANDLER] Failed: No department or admin ID in session');
        return res.status(401).json({ error: "Не авторизован" });
      }

      const { endpoint, keys } = req.body;

      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ error: "Неверные данные подписки" });
      }

      const subscriptionData = {
        userId: departmentId || adminId,
        userType: departmentId ? 'department' : 'admin',
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      };

      const validated = insertPushSubscriptionSchema.parse(subscriptionData);

      // Check if subscription already exists
      const existing = await storage.getPushSubscriptionByEndpoint(endpoint);
      
      if (existing) {
        // Update existing subscription
        await storage.updatePushSubscription(existing.id, validated);
      } else {
        // Create new subscription
        await storage.createPushSubscription(validated);
      }

      console.log('[PUSH_SUBSCRIBE_HANDLER] Success: Subscription saved for user', {
        userId: subscriptionData.userId,
        userType: subscriptionData.userType,
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('[PUSH_SUBSCRIBE_HANDLER] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Unsubscribe from push notifications
  app.post("/api/push/unsubscribe", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get user from session (set by requireAuth middleware)
      const req_any = req as any;
      const departmentId = req_any.session?.departmentId;
      const adminId = req_any.session?.adminId;

      if (!departmentId && !adminId) {
        return res.status(401).json({ error: "Не авторизован" });
      }

      const userId = departmentId || adminId;
      const userType = departmentId ? 'department' : 'admin';
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint обязателен" });
      }

      // Verify ownership before deleting
      const subscription = await storage.getPushSubscriptionByEndpoint(endpoint);
      if (subscription && subscription.userId === userId && subscription.userType === userType) {
        await storage.deletePushSubscriptionByEndpoint(endpoint);
        res.json({ success: true });
      } else {
        res.status(403).json({ error: "Нет доступа к этой подписке" });
      }
    } catch (error: any) {
      console.error('Push unsubscribe error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Send push notification (helper function)
  async function sendPushNotification(userId: number, userType: string, payload: { title: string; body: string; url?: string }) {
    try {
      if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn('VAPID keys not configured, skipping push notification');
        return;
      }

      const subscriptions = await storage.getPushSubscriptionsByUser(userId, userType);
      
      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        url: payload.url || '/',
      });

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationPayload
          );
        } catch (error: any) {
          console.error('Failed to send push to subscription:', error);
          
          // If subscription is no longer valid, delete it
          if (error.statusCode === 410) {
            await storage.deletePushSubscriptionByEndpoint(sub.endpoint);
          }
        }
      });

      await Promise.all(sendPromises);
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }

  // Store sendPushNotification function for use in other routes
  (app as any).sendPushNotification = sendPushNotification;

  // ===== Department Files (Мубодила) Routes =====
  
  // Get all files for a department
  app.get("/api/department-files/:departmentId", requireAuth, async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const files = await storage.getDepartmentFiles(departmentId);
      
      // Return file metadata without the actual file data
      const filesMetadata = files.map(f => ({
        id: f.id,
        departmentId: f.departmentId,
        fileName: f.fileName,
        originalFileName: f.originalFileName,
        fileSize: f.fileSize,
        mimeType: f.mimeType,
        uploadedById: f.uploadedById,
        createdAt: f.createdAt,
      }));
      
      res.json(filesMetadata);
    } catch (error: any) {
      console.error('Error getting department files:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload a file to department storage
  app.post("/api/department-files/:departmentId", requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const req_any = req as any;
      const uploadedById = req_any.session?.departmentId;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const originalFileName = decodeFilename(req.file.originalname);
      const timestamp = Date.now();
      const fileName = `${timestamp}_${originalFileName}`;

      const fileData = {
        departmentId,
        fileName,
        originalFileName,
        fileData: req.file.buffer,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedById,
      };

      const savedFile = await storage.createDepartmentFile(fileData);

      res.json({
        id: savedFile.id,
        fileName: savedFile.fileName,
        originalFileName: savedFile.originalFileName,
        fileSize: savedFile.fileSize,
        mimeType: savedFile.mimeType,
        createdAt: savedFile.createdAt,
      });
    } catch (error: any) {
      console.error('Error uploading department file:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Download a department file
  app.get("/api/department-files/download/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getDepartmentFileById(id);

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.originalFileName)}`,
        'Content-Length': file.fileSize,
      });

      res.send(file.fileData);
    } catch (error: any) {
      console.error('Error downloading department file:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a department file
  app.delete("/api/department-files/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getDepartmentFileById(id);

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      const deleted = await storage.deleteDepartmentFile(id);
      
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to delete file' });
      }
    } catch (error: any) {
      console.error('Error deleting department file:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
