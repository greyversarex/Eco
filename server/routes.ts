import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertDepartmentSchema, insertMessageSchema, insertAdminSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";

// Allowed MIME types for file uploads
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/rtf',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/gzip',
  // Other
  'application/json',
  'text/csv',
];

// Configure multer for file uploads (store in memory as Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

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
  if (!req.session.departmentId && !req.session.adminId) {
    return res.status(401).json({ error: 'Not authenticated' });
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

      // Regenerate session to clear any previous data
      req.session.regenerate((err: any) => {
        if (err) {
          console.error('Session regenerate error:', err);
          return res.status(500).json({ error: 'Failed to create session' });
        }

        req.session.departmentId = department.id;
        req.session.userType = 'department';
        
        // Save the new session
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ error: 'Failed to save session' });
          }
          
          res.json({ 
            success: true, 
            department: {
              id: department.id,
              name: department.name,
              block: department.block,
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

      // Regenerate session to clear any previous data
      req.session.regenerate((err: any) => {
        if (err) {
          console.error('Session regenerate error:', err);
          return res.status(500).json({ error: 'Failed to create session' });
        }

        req.session.adminId = admin.id;
        req.session.userType = 'admin';
        
        // Save the new session
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ error: 'Failed to save session' });
          }
          
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
  app.get("/api/departments/list", requireAuth, async (req: Request, res: Response) => {
    try {
      const departments = await storage.getDepartments();
      // Return departments without access codes for security
      const sanitizedDepartments = departments.map(({ accessCode, ...dept }) => dept);
      res.json(sanitizedDepartments);
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
        // Department can only see messages they sent or received
        if (message.senderId !== req.session.departmentId && message.recipientId !== req.session.departmentId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (!req.session.adminId) {
        // If not department and not admin, deny access
        return res.status(403).json({ error: 'Access denied' });
      }
      // Admins can see all messages
      
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
      
      const message = await storage.createMessage(parsedData);
      res.json(message);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/messages/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const message = await storage.markMessageAsRead(id);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      res.json(message);
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

      const messages = await storage.getMessagesByDepartmentPair(req.session.departmentId, otherDeptId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // File attachment routes (PostgreSQL storage)

  // Upload file attachment to message
  app.post("/api/messages/:id/attachments", requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      
      if (isNaN(messageId)) {
        return res.status(400).json({ error: 'Invalid message ID' });
      }

      if (!req.file) {
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
        // Department can only upload to messages they sent or received
        if (message.senderId !== req.session.departmentId && message.recipientId !== req.session.departmentId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (!req.session.adminId) {
        // If not department and not admin, deny access
        return res.status(403).json({ error: 'Access denied' });
      }
      // Admins can upload to any message

      // Save file to database
      const attachment = await storage.createAttachment({
        messageId,
        filename: req.file.originalname,
        fileData: req.file.buffer,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      res.json({
        id: attachment.id,
        filename: attachment.filename,
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
        // Department can only see attachments for messages they sent or received
        if (message.senderId !== req.session.departmentId && message.recipientId !== req.session.departmentId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (!req.session.adminId) {
        // If not department and not admin, deny access
        return res.status(403).json({ error: 'Access denied' });
      }
      // Admins can see all attachments

      // Get attachments
      const attachments = await storage.getAttachmentsByMessageId(messageId);
      
      // Return without file data
      res.json(attachments.map(att => ({
        id: att.id,
        filename: att.filename,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        uploadedAt: att.uploadedAt,
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

      // Verify message exists and user has access
      const message = await storage.getMessageById(attachment.messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user has access to this message
      if (req.session.departmentId) {
        // Department can only download attachments for messages they sent or received
        if (message.senderId !== req.session.departmentId && message.recipientId !== req.session.departmentId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (!req.session.adminId) {
        // If not department and not admin, deny access
        return res.status(403).json({ error: 'Access denied' });
      }
      // Admins can download all attachments

      // Send file
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.filename)}"`);
      res.setHeader('Content-Length', attachment.fileSize.toString());
      res.send(attachment.fileData);
    } catch (error: any) {
      console.error('Error downloading attachment:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
