import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertDepartmentSchema, insertMessageSchema, insertAdminSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

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

      req.session.departmentId = department.id;
      req.session.userType = 'department';
      
      // Save session explicitly to ensure it's persisted
      req.session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
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

      req.session.adminId = admin.id;
      req.session.userType = 'admin';
      
      // Save session explicitly to ensure it's persisted
      req.session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
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
        if (message.senderId !== req.session.departmentId && message.recipientId !== req.session.departmentId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
      
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
      
      const objectStorageService = new ObjectStorageService();
      
      // Normalize attachments array if present
      if (parsedData.attachments && Array.isArray(parsedData.attachments)) {
        parsedData.attachments = parsedData.attachments.map((att: any) => ({
          url: objectStorageService.normalizeObjectEntityPath(att.url),
          name: att.name,
        }));
      }
      
      // Normalize old single attachmentUrl if present (for backward compatibility)
      if (parsedData.attachmentUrl && typeof parsedData.attachmentUrl === 'string') {
        parsedData.attachmentUrl = objectStorageService.normalizeObjectEntityPath(parsedData.attachmentUrl);
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

  // Object Storage routes (file upload/download)
  
  // Get presigned URL for file upload
  app.post("/api/objects/upload", requireAuth, async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get presigned URL for file download
  app.post("/api/objects/download", requireAuth, async (req: Request, res: Response) => {
    try {
      const { messageId, fileUrl } = req.body;
      
      if (!messageId) {
        return res.status(400).json({ error: 'messageId is required' });
      }

      if (!fileUrl) {
        return res.status(400).json({ error: 'fileUrl is required' });
      }

      // Validate messageId is a valid integer
      const parsedMessageId = parseInt(messageId);
      if (isNaN(parsedMessageId) || !Number.isInteger(parsedMessageId) || parsedMessageId <= 0) {
        return res.status(400).json({ error: 'Invalid messageId' });
      }

      // Get the message to verify access
      const message = await storage.getMessageById(parsedMessageId);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user has access to this message
      if (req.session.departmentId) {
        if (message.senderId !== req.session.departmentId && message.recipientId !== req.session.departmentId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
      // Admin users can access all files (already checked by requireAuth middleware)

      // Verify that the fileUrl belongs to this message
      const objectStorageService = new ObjectStorageService();
      const normalizedFileUrl = objectStorageService.normalizeObjectEntityPath(fileUrl);
      
      let fileFound = false;
      
      // Check in new attachments array
      if (message.attachments && Array.isArray(message.attachments)) {
        fileFound = message.attachments.some((att: any) => {
          const normalizedAttUrl = objectStorageService.normalizeObjectEntityPath(att.url);
          return normalizedAttUrl === normalizedFileUrl;
        });
      }
      
      // Fallback: check old single attachment for backward compatibility
      if (!fileFound && message.attachmentUrl) {
        const normalizedOldUrl = objectStorageService.normalizeObjectEntityPath(message.attachmentUrl);
        fileFound = normalizedOldUrl === normalizedFileUrl;
      }
      
      if (!fileFound) {
        return res.status(404).json({ error: 'Attachment not found in message' });
      }

      const downloadURL = await objectStorageService.getObjectEntityDownloadURL(normalizedFileUrl);
      res.json({ downloadURL });
    } catch (error: any) {
      console.error('Error getting download URL:', error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: 'File not found' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Save attachment info to message after upload
  app.post("/api/messages/:id/attachment", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { attachmentUrl, attachmentName } = req.body;

      if (!attachmentUrl || !attachmentName) {
        return res.status(400).json({ error: 'attachmentUrl and attachmentName are required' });
      }

      // Normalize the uploaded URL to internal path format
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(attachmentUrl);

      // Set ACL policy for the uploaded file
      const userId = req.session.departmentId?.toString() || req.session.adminId?.toString() || 'unknown';
      await objectStorageService.trySetObjectEntityAclPolicy(attachmentUrl, {
        owner: userId,
        visibility: "private", // Files in messages are private by default
      });

      // Update message with attachment info
      const message = await storage.updateMessageAttachment(id, normalizedPath, attachmentName);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      res.json(message);
    } catch (error: any) {
      console.error('Error saving attachment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Direct file download through proxy (with ACL check)
  app.get("/objects/:objectPath(*)", requireAuth, async (req: Request, res: Response) => {
    try {
      const objectPath = `/objects/${req.params.objectPath}`;
      const objectStorageService = new ObjectStorageService();
      
      // Get the object file
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      
      // Check if user has access to this object
      const userId = req.session.departmentId?.toString() || req.session.adminId?.toString();
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Download the object
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error('Error downloading object:', error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: 'File not found' });
      }
      return res.status(500).json({ error: error.message });
    }
  });
  
  // Legacy endpoint removed for security - use POST /api/objects/download instead
  // which properly verifies message access before allowing downloads
}
