import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertDepartmentSchema, insertMessageSchema, insertAdminSchema, insertAssignmentSchema, insertAnnouncementSchema } from "@shared/schema";
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

      // Create messages for all recipients
      const createdMessages: number[] = [];
      const failedRecipients: number[] = [];

      for (const recipientId of recipientIds) {
        try {
          const fullMessageData: any = {
            ...messageData,
            recipientId,
          };
          const message = await storage.createMessage(fullMessageData);
          createdMessages.push(message.id);

          // Attach files to this message
          for (const file of files) {
            await storage.createAttachment({
              messageId: message.id,
              fileData: file.buffer,
              file_name: file.originalname,
              fileSize: file.size,
              mimeType: file.mimetype,
            });
          }
        } catch (error) {
          console.error(`Failed to create message for recipient ${recipientId}:`, error);
          failedRecipients.push(recipientId);
        }
      }

      res.json({
        success: true,
        messagesCreated: createdMessages.length,
        messageIds: createdMessages,
        failedRecipients,
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
  
  // Get all assignments
  app.get("/api/assignments", requireAuth, async (req: Request, res: Response) => {
    try {
      const assignments = await storage.getAssignments();
      res.json(assignments);
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

  // Create assignment (only for specific department)
  app.post("/api/assignments", requireAuth, upload.array('files', 5), async (req: Request, res: Response) => {
    try {
      // Check if user is from the authorized department
      if (req.session.departmentId) {
        const dept = await storage.getDepartmentById(req.session.departmentId);
        if (!dept || dept.name !== 'Раёсати кадрҳо, коргузорӣ ва назорат') {
          return res.status(403).json({ error: 'Only Раёсати кадрҳо department can create assignments' });
        }
      } else if (!req.session.adminId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Parse executors from JSON field
      const executorsRaw = JSON.parse(req.body.executors || '[]');
      if (!Array.isArray(executorsRaw)) {
        return res.status(400).json({ error: 'Executors must be an array' });
      }

      // Prepare assignment data
      const assignmentData = {
        topic: req.body.topic,
        content: req.body.content || null,
        executors: executorsRaw,
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

      // Attach files
      for (const file of files) {
        await storage.createAssignmentAttachment({
          assignmentId: assignment.id,
          fileData: file.buffer,
          file_name: decodeFilename(file.originalname),
          fileSize: file.size,
          mimeType: file.mimetype,
        });
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

  // Delete assignment
  app.delete("/api/assignments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if user is from authorized departments for deletion
      if (req.session.departmentId) {
        const dept = await storage.getDepartmentById(req.session.departmentId);
        const allowedDepts = [
          'Раёсати назорати давлатии истифода ва ҳифзи ҳавои атмосфера',
          'Раёсати кадрҳо, коргузорӣ ва назорат'
        ];
        if (!dept || !allowedDepts.includes(dept.name)) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (!req.session.adminId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const id = parseInt(req.params.id);
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

      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.file_name)}"`);
      res.setHeader('Content-Length', attachment.fileSize.toString());
      res.send(attachment.fileData);
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

  // Create announcement (only for specific department)
  app.post("/api/announcements", requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if user is from the authorized department
      if (req.session.departmentId) {
        const dept = await storage.getDepartmentById(req.session.departmentId);
        if (!dept || dept.name !== 'Раёсати кадрҳо, коргузорӣ ва назорат') {
          return res.status(403).json({ error: 'Only Раёсати кадрҳо department can create announcements' });
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

  // Delete announcement
  app.delete("/api/announcements/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if user is from authorized departments for deletion
      if (req.session.departmentId) {
        const dept = await storage.getDepartmentById(req.session.departmentId);
        const allowedDepts = [
          'Раёсати назорати давлатии истифода ва ҳифзи ҳавои атмосфера',
          'Раёсати кадрҳо, коргузорӣ ва назорат'
        ];
        if (!dept || !allowedDepts.includes(dept.name)) {
          return res.status(403).json({ error: 'Access denied' });
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
      const uncompletedAssignments = await storage.getUncompletedAssignmentsCount();
      
      res.json({
        unreadAnnouncements,
        uncompletedAssignments
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
