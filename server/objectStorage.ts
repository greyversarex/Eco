// Hybrid Storage: Supabase (production) + Replit Object Storage (legacy support)
import { StorageClient, StorageError } from "@supabase/storage-js";
import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// ============================================================================
// Supabase Storage Client
// ============================================================================

let supabaseStorageClient: StorageClient | null = null;

function getSupabaseStorageClient(): StorageClient {
  if (!supabaseStorageClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set for new file uploads"
      );
    }

    supabaseStorageClient = new StorageClient(
      `${supabaseUrl}/storage/v1`,
      {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      }
    );
  }

  return supabaseStorageClient;
}

// ============================================================================
// Replit Object Storage Client (Legacy support)
// ============================================================================

let replitObjectStorageClient: Storage | null = null;

function getReplitObjectStorageClient(): Storage | null {
  // Only initialize if PRIVATE_OBJECT_DIR is set (Replit environment)
  if (!process.env.PRIVATE_OBJECT_DIR) {
    return null;
  }

  if (!replitObjectStorageClient) {
    replitObjectStorageClient = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token",
          },
        },
        universe_domain: "googleapis.com",
      },
      projectId: "",
    });
  }

  return replitObjectStorageClient;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine if a path is from legacy Replit Object Storage
 * Legacy paths: /objects/<bucket_id>/uploads/... (Google Cloud Storage format)
 * New paths: /objects/uploads/... (Supabase format)
 */
function isLegacyPath(objectPath: string): boolean {
  if (!objectPath.startsWith("/objects/")) {
    return false;
  }

  const pathAfterObjects = objectPath.slice("/objects/".length);
  
  // Legacy format: /objects/<bucket_id>/uploads/...
  // New format: /objects/uploads/...
  // Legacy paths have bucket ID before "uploads/"
  const parts = pathAfterObjects.split('/');
  
  // If second part is "uploads", it's new format (Supabase)
  // If first part is bucket ID (starts with replit-objstore-), it's legacy
  if (parts[0] === 'uploads') {
    return false; // Supabase format
  }
  
  if (parts[0] && parts[0].startsWith('replit-objstore-')) {
    return true; // Legacy Replit format
  }

  // Default: treat as Supabase if unclear
  return false;
}

/**
 * Parse object path into bucket and object name (for Google Cloud Storage)
 */
function parseObjectPath(fullPath: string): {
  bucketName: string;
  objectName: string;
} {
  // Format: /<bucket_name>/<object_name>
  const parts = fullPath.split("/").filter(Boolean);
  const bucketName = parts[0];
  const objectName = parts.slice(1).join("/");
  return { bucketName, objectName };
}

/**
 * Sign URL for Google Cloud Storage (legacy)
 */
async function signObjectURL({
  method,
  bucketName,
  objectName,
  ttl,
}: {
  method: string;
  bucketName: string;
  objectName: string;
  ttl?: number;
}): Promise<string> {
  const client = getReplitObjectStorageClient();
  if (!client) {
    throw new Error("Replit Object Storage not available (PRIVATE_OBJECT_DIR not set)");
  }

  const bucket = client.bucket(bucketName);
  const file = bucket.file(objectName);

  const [url] = await file.getSignedUrl({
    version: "v4",
    action: method === "PUT" ? "write" : "read",
    expires: Date.now() + (ttl || 15 * 60 * 1000), // Default 15 minutes
    contentType: "application/octet-stream",
  });

  return url;
}

// ============================================================================
// Errors
// ============================================================================

export class ObjectNotFoundError extends Error {
  constructor(message?: string) {
    super(message || "Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class LegacyFileUnavailableError extends Error {
  constructor() {
    super(
      "This file was uploaded using legacy storage and is no longer accessible. " +
      "Please re-upload the file to make it available."
    );
    this.name = "LegacyFileUnavailableError";
    Object.setPrototypeOf(this, LegacyFileUnavailableError.prototype);
  }
}

// ============================================================================
// Object Storage Service
// ============================================================================

export class ObjectStorageService {
  private bucketName: string;

  constructor() {
    // Get bucket name from environment (for Supabase)
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || "ecotajikistan-files";
  }

  /**
   * Get private object directory for legacy Replit storage
   */
  getPrivateObjectDir(): string | null {
    return process.env.PRIVATE_OBJECT_DIR || null;
  }

  /**
   * Generate a presigned upload URL for a new file
   * Always uses Supabase Storage for new uploads
   */
  async getObjectEntityUploadURL(): Promise<string> {
    const client = getSupabaseStorageClient();
    
    // Generate unique filename
    const objectId = randomUUID();
    const objectPath = `uploads/${objectId}`;

    try {
      // Create a signed upload URL (valid for 15 minutes)
      const { data, error } = await client
        .from(this.bucketName)
        .createSignedUploadUrl(objectPath);

      if (error) {
        console.error('Supabase upload URL error:', error);
        throw new Error(`Failed to create upload URL: ${error.message}`);
      }

      if (!data || !data.signedUrl) {
        throw new Error('No signed URL returned from Supabase');
      }

      return data.signedUrl;
    } catch (error: any) {
      console.error('Error creating upload URL:', error);
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
  }

  /**
   * Normalize object path from full URL to internal format
   */
  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith('http://') && !rawPath.startsWith('https://')) {
      // Already normalized
      return rawPath;
    }

    try {
      const url = new URL(rawPath);
      const pathname = url.pathname;

      // Supabase format: /object/public/bucket/uploads/123
      const bucketPattern = new RegExp(`/object/(?:public|sign|authenticated)/${this.bucketName}/`);
      const match = pathname.match(bucketPattern);

      if (match) {
        const objectPath = pathname.slice(pathname.indexOf(match[0]) + match[0].length);
        return `/objects/${objectPath}`;
      }

      // Google Cloud Storage format (legacy)
      // Format: https://storage.googleapis.com/<bucket>/<path>
      if (url.hostname === 'storage.googleapis.com') {
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          return `/objects/${parts.join('/')}`;
        }
      }

      // Fallback: return as is if pattern doesn't match
      console.warn('Could not normalize path:', rawPath);
      return rawPath;
    } catch (error) {
      console.error('Error normalizing path:', error);
      return rawPath;
    }
  }

  /**
   * Get a file (supports both Supabase and legacy Replit storage)
   */
  async getObjectEntityFile(objectPath: string): Promise<{
    bucket: string;
    path: string;
    isLegacy: boolean;
    legacyFile?: File;
  }> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const isLegacy = isLegacyPath(objectPath);

    // Handle legacy Replit Object Storage files
    if (isLegacy) {
      const replitClient = getReplitObjectStorageClient();
      
      if (!replitClient) {
        // Legacy file but Replit storage not available (production server)
        throw new LegacyFileUnavailableError();
      }

      // Extract full path: /objects/<bucket>/<object>
      const fullPath = objectPath.slice("/objects/".length);
      const { bucketName, objectName } = parseObjectPath("/" + fullPath);
      
      const bucket = replitClient.bucket(bucketName);
      const file = bucket.file(objectName);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new ObjectNotFoundError("Legacy file not found in Replit storage");
      }

      return {
        bucket: bucketName,
        path: objectName,
        isLegacy: true,
        legacyFile: file,
      };
    }

    // Handle new Supabase Storage files
    const filePath = objectPath.slice("/objects/".length);
    const client = getSupabaseStorageClient();
    
    try {
      const { data, error } = await client
        .from(this.bucketName)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          limit: 100,
          search: filePath.split('/').pop()
        });

      if (error || !data || data.length === 0) {
        throw new ObjectNotFoundError("File not found in Supabase storage");
      }

      return {
        bucket: this.bucketName,
        path: filePath,
        isLegacy: false,
      };
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        throw error;
      }
      console.error('Error checking file existence:', error);
      throw new ObjectNotFoundError();
    }
  }

  /**
   * Set ACL policy for an object (supports both storage types)
   */
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const isLegacy = isLegacyPath(normalizedPath);

    try {
      if (isLegacy) {
        // Legacy: Use Google Cloud Storage ACL
        const replitClient = getReplitObjectStorageClient();
        if (!replitClient) {
          console.warn('Cannot set ACL for legacy file: Replit storage not available');
          return normalizedPath;
        }

        const fullPath = normalizedPath.slice("/objects/".length);
        const { bucketName, objectName } = parseObjectPath("/" + fullPath);
        const bucket = replitClient.bucket(bucketName);
        const file = bucket.file(objectName);

        await setObjectAclPolicy(file, aclPolicy);
      } else {
        // New: Store ACL in Supabase metadata
        const filePath = normalizedPath.slice("/objects/".length);
        const client = getSupabaseStorageClient();

        const { error } = await client
          .from(this.bucketName)
          .update(filePath, new Blob(['placeholder']), {
            upsert: false,
            cacheControl: '3600',
            metadata: {
              aclPolicy: JSON.stringify(aclPolicy)
            }
          });

        if (error && error.message !== 'The resource already exists') {
          console.warn('Could not set ACL policy (non-critical):', error.message);
        }
      }

      return normalizedPath;
    } catch (error: any) {
      // Non-critical error - file can still be used
      console.warn('Error setting ACL policy:', error.message);
      return normalizedPath;
    }
  }

  /**
   * Check if a user can access a specific object
   */
  async canAccessObjectEntity({
    userId,
    objectFile,
  }: {
    userId?: string;
    objectFile: { bucket: string; path: string; isLegacy: boolean; legacyFile?: File };
  }): Promise<boolean> {
    if (objectFile.isLegacy && objectFile.legacyFile) {
      // Use legacy ACL check
      return await canAccessObject({
        userId,
        objectFile: objectFile.legacyFile,
      });
    }

    // For Supabase: allow access if user is authenticated
    return !!userId;
  }

  /**
   * Generate a signed download URL for an object
   * Supports both Supabase and legacy Replit storage
   */
  async getObjectEntityDownloadURL(objectPath: string): Promise<string> {
    const objectFile = await this.getObjectEntityFile(objectPath);

    if (objectFile.isLegacy) {
      // Legacy: Use Google Cloud Storage signed URL
      const fullPath = objectPath.slice("/objects/".length);
      const { bucketName, objectName } = parseObjectPath("/" + fullPath);

      return await signObjectURL({
        method: "GET",
        bucketName,
        objectName,
        ttl: 60 * 60 * 1000, // 1 hour
      });
    }

    // New: Use Supabase signed URL
    const client = getSupabaseStorageClient();

    try {
      const { data, error } = await client
        .from(this.bucketName)
        .createSignedUrl(objectFile.path, 3600); // 1 hour

      if (error) {
        console.error('Supabase signed URL error:', error);
        throw new Error(`Failed to create download URL: ${error.message}`);
      }

      if (!data || !data.signedUrl) {
        throw new Error('No signed URL returned from Supabase');
      }

      return data.signedUrl;
    } catch (error: any) {
      console.error('Error creating download URL:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * Get the public URL for a file (Supabase only, new files)
   */
  getPublicUrl(filePath: string): string {
    const client = getSupabaseStorageClient();
    const { data } = client
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Download a file and stream it to the response
   * Supports both storage types
   */
  async downloadObject(
    objectFile: { bucket: string; path: string; isLegacy: boolean; legacyFile?: File },
    res: Response,
    cacheTtlSec: number = 3600
  ): Promise<void> {
    try {
      if (objectFile.isLegacy && objectFile.legacyFile) {
        // Legacy: Stream from Google Cloud Storage
        const file = objectFile.legacyFile;
        const [metadata] = await file.getMetadata();
        const aclPolicy = await getObjectAclPolicy(file);
        const isPublic = aclPolicy?.visibility === "public";

        res.set({
          "Content-Type": metadata.contentType || "application/octet-stream",
          "Content-Length": metadata.size,
          "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
        });

        const stream = file.createReadStream();

        stream.on("error", (err) => {
          console.error("Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error streaming file" });
          }
        });

        stream.pipe(res);
        return;
      }

      // New: Download from Supabase
      const client = getSupabaseStorageClient();

      const { data, error } = await client
        .from(objectFile.bucket)
        .download(objectFile.path);

      if (error || !data) {
        throw new Error(error?.message || 'Failed to download file');
      }

      // Get file metadata for content type
      const extension = objectFile.path.split('.').pop()?.toLowerCase();
      const contentType = getContentType(extension);

      // Set headers
      res.set({
        'Content-Type': contentType,
        'Content-Length': data.size,
        'Cache-Control': `private, max-age=${cacheTtlSec}`,
        'Content-Disposition': `attachment; filename="${objectFile.path.split('/').pop()}"`,
      });

      // Convert blob to stream and pipe to response
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Error downloading file' });
      }
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get content type based on file extension
 */
function getContentType(extension?: string): string {
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    txt: 'text/plain',
    csv: 'text/csv',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
  };

  return types[extension || ''] || 'application/octet-stream';
}
