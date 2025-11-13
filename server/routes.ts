import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertDepartmentSchema, insertMessageSchema, insertAdminSchema, insertAssignmentSchema, insertAnnouncementSchema, insertPersonSchema } from "@shared/schema";
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

// Configure multer for file uploads (store in memory as Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
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
              code: department.accessCode,
              canMonitor: department.canMonitor,
              canCreateAssignmentFromMessage: department.canCreateAssignmentFromMessage,
              canCreateAssignment: department.canCreateAssignment,
              canCreateAnnouncement: department.canCreateAnnouncement,
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
              code: department.accessCode,
              canMonitor: department.canMonitor,
              canCreateAssignmentFromMessage: department.canCreateAssignmentFromMessage,
              canCreateAssignment: department.canCreateAssignment,
              canCreateAnnouncement: department.canCreateAnnouncement,
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
      // Cache for 5 minutes since departments rarely change
      res.setHeader('Cache-Control', 'private, max-age=300');
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
      
      // Decode executor (document number) if present
      if (parsedData.executor) {
        parsedData.executor = decodeFilename(parsedData.executor);
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
        replyToId: null,
      };

      // Ensure sender is the authenticated department
      if (req.session.departmentId && messageData.senderId !== req.session.departmentId) {
        return res.status(403).json({ error: 'Cannot send messages on behalf of other departments' });
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

      // Attach files to this single message
      if (files.length > 0) {
        await Promise.all(
          files.map(file =>
            storage.createAttachment({
              messageId: message.id,
              fileData: file.buffer,
              file_name: file.originalname,
              fileSize: file.size,
              mimeType: file.mimetype,
            })
          )
        );
      }

      res.json({
        success: true,
        messagesCreated: 1,
        messageIds: [message.id], // Single message with multiple recipients
        failedRecipients: [],
        filesAttached: files.length,
      });
    } catch (error: any) {
      console.error('Error in broadcast:', error);
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
      
      if (isDepartment && message.senderId !== req.session.departmentId && message.recipientId !== req.session.departmentId) {
        return res.status(403).json({ error: 'No permission to delete this message' });
      }
      
      const deleted = await storage.deleteMessage(id);
      
      if (!deleted) {
        return res.status(500).json({ error: 'Failed to delete message' });
      }
      
      res.json({ success: true });
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
      
      for (const messageId of messageIds) {
        try {
          // messageId is already validated as positive integer by Zod
          const message = await storage.getMessageById(messageId);
          
          if (!message) {
            deletedCount.failed++;
            continue;
          }
          
          // Check permissions - both departments and admins can delete
          const isDepartment = req.session.departmentId;
          const isAdmin = req.session.adminId;
          
          // Departments can only delete messages they sent or received
          if (isDepartment && message.senderId !== req.session.departmentId && message.recipientId !== req.session.departmentId) {
            deletedCount.failed++;
            continue;
          }
          
          // Admins can delete any message (no additional check needed)
          
          const deleted = await storage.deleteMessage(messageId);
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
      
      // First check if message exists in deleted messages visible to this department
      const deletedMessages = await storage.listDeletedMessages(departmentId);
      const messageToRestore = deletedMessages.find(m => m.id === id);
      
      if (!messageToRestore) {
        return res.status(404).json({ error: 'Message not found in trash or access denied' });
      }
      
      // Restore the message
      const restored = await storage.restoreMessage(id);
      
      if (!restored) {
        return res.status(500).json({ error: 'Failed to restore message' });
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
      const allAssignments = await storage.getAssignments();
      
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
        return res.json(filteredAssignments);
      }
      
      // Admin sees all assignments
      res.json(allAssignments);
    } catch (error: any) {
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

      // Validate and get executor names from executorIds
      const executors: string[] = [];
      if (executorIds.length > 0) {
        const people = await storage.getPeople();
        const selectedPeople = people.filter((p: any) => executorIds.includes(p.id));
        
        // Validate that all executorIds belong to selected departments
        for (const person of selectedPeople) {
          if (!person.departmentId || !recipientIds.includes(person.departmentId)) {
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
        topic: req.body.topic,
        content: req.body.content || null,
        documentNumber: req.body.documentNumber || null,
        executors: executors,
        executorIds: executorIds,
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

      res.json(assignment);
    } catch (error: any) {
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

  // ==================== ANNOUNCEMENTS ROUTES ====================
  
  // Get all announcements
  app.get("/api/announcements", requireAuth, async (req: Request, res: Response) => {
    try {
      const announcements = await storage.getAnnouncements();
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

  // Export chat archive for admin
  app.get("/api/admin/departments/:departmentId/archive/:direction", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
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

      // Format archive
      const directionLabel = direction === 'inbox' ? 'Воридшуда' : 'Ирсолшуда';
      const currentDate = new Date().toLocaleString('tg-TJ', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      let archive = `АРХИВИ ПАЁМҲО\n`;
      archive += `Шуъба: ${department.name}\n`;
      archive += `Самт: ${directionLabel}\n`;
      archive += `Сана: ${currentDate}\n`;
      archive += `\n========================================\n\n`;

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

      for (const message of messages) {
        const messageDate = message.documentDate 
          ? new Date(message.documentDate).toLocaleString('tg-TJ', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          : new Date(message.createdAt).toLocaleString('tg-TJ', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });

        // Get sender
        const sender = deptMap.get(message.senderId);

        // Get recipients (handle both new and legacy formats)
        const recipientIdsList = message.recipientIds && message.recipientIds.length > 0
          ? message.recipientIds
          : message.recipientId
            ? [message.recipientId]
            : [];
        const recipients = recipientIdsList.map((id: number) => deptMap.get(id)).filter(Boolean);

        archive += `Сана: ${messageDate}\n`;
        archive += `Аз: ${sender?.name || 'Номаълум'}\n`;
        archive += `Ба: ${recipients.map((r: any) => r?.name).join(', ') || 'Номаълум'}\n`;
        
        if (message.subject) {
          archive += `Мавзуъ: ${message.subject}\n`;
        }
        
        if (message.documentNumber) {
          archive += `Рақами ҳуҷҷат: ${message.documentNumber}\n`;
        }

        archive += `\n${message.content}\n`;

        // Get attachments
        const attachments = await storage.getAttachmentsByMessageId(message.id);
        if (attachments.length > 0) {
          archive += `\nЗамимаҳо:\n`;
          attachments.forEach((att: any, idx: number) => {
            archive += `  ${idx + 1}. ${att.file_name} (${(att.fileSize / 1024).toFixed(2)} KB)\n`;
          });
        }

        archive += `\n========================================\n\n`;
      }

      // Send as downloadable file
      const filename = `${department.name}_${directionLabel}_${new Date().toISOString().split('T')[0]}.txt`;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(Buffer.from(archive, 'utf-8'));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
