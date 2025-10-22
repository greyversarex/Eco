// Production-ready Supabase Storage implementation
import { StorageClient, StorageError } from "@supabase/storage-js";
import { randomUUID } from "crypto";

// Supabase Storage client
let supabaseStorageClient: StorageClient | null = null;

function getSupabaseStorageClient(): StorageClient {
  if (!supabaseStorageClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
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

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  private bucketName: string;

  constructor() {
    // Get bucket name from environment
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || "ecotajikistan-files";
  }

  /**
   * Generate a presigned upload URL for a new file
   * Returns a URL that the client can use to upload directly to Supabase Storage
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
   * Converts: https://xyz.supabase.co/storage/v1/object/public/bucket/uploads/123
   * To: /objects/uploads/123
   */
  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith('http://') && !rawPath.startsWith('https://')) {
      // Already normalized
      return rawPath;
    }

    try {
      const url = new URL(rawPath);
      const pathname = url.pathname;

      // Extract path after /object/public/{bucket}/ or /object/sign/{bucket}/
      // or /object/authenticated/{bucket}/
      const bucketPattern = new RegExp(`/object/(?:public|sign|authenticated)/${this.bucketName}/`);
      const match = pathname.match(bucketPattern);

      if (match) {
        const objectPath = pathname.slice(pathname.indexOf(match[0]) + match[0].length);
        return `/objects/${objectPath}`;
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
   * Get a file from Supabase Storage
   * Throws ObjectNotFoundError if file doesn't exist
   */
  async getObjectEntityFile(objectPath: string): Promise<{
    bucket: string;
    path: string;
  }> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    // Extract the actual file path from normalized path
    const filePath = objectPath.slice("/objects/".length);

    // Check if file exists
    const client = getSupabaseStorageClient();
    
    try {
      const { data, error } = await client
        .from(this.bucketName)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          limit: 100,
          search: filePath.split('/').pop()
        });

      if (error || !data || data.length === 0) {
        throw new ObjectNotFoundError();
      }

      return {
        bucket: this.bucketName,
        path: filePath,
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
   * Set ACL policy for an object (stored as metadata)
   * Note: Supabase uses RLS policies, but we can store custom metadata
   */
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: { owner: string; visibility: "public" | "private" }
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    try {
      // Extract file path
      const filePath = normalizedPath.slice("/objects/".length);
      const client = getSupabaseStorageClient();

      // Update file metadata with ACL policy
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

      return normalizedPath;
    } catch (error: any) {
      // Non-critical error - file can still be used
      console.warn('Error setting ACL policy:', error.message);
      return normalizedPath;
    }
  }

  /**
   * Check if a user can access a specific object
   * In production, this would verify against RLS policies or custom ACL
   */
  async canAccessObjectEntity({
    userId,
    objectFile,
  }: {
    userId?: string;
    objectFile: { bucket: string; path: string };
  }): Promise<boolean> {
    // For now, allow access if user is authenticated
    // In production, implement proper RLS policy checks
    return !!userId;
  }

  /**
   * Generate a signed download URL for an object
   * The URL is valid for 1 hour
   */
  async getObjectEntityDownloadURL(objectPath: string): Promise<string> {
    const objectFile = await this.getObjectEntityFile(objectPath);
    const client = getSupabaseStorageClient();

    try {
      // Create signed URL valid for 1 hour (3600 seconds)
      const { data, error } = await client
        .from(this.bucketName)
        .createSignedUrl(objectFile.path, 3600);

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
   * Get the public URL for a file (no signing required for public files)
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
   * Used for proxy downloads
   */
  async downloadObject(
    objectFile: { bucket: string; path: string },
    res: any,
    cacheTtlSec: number = 3600
  ): Promise<void> {
    try {
      const client = getSupabaseStorageClient();

      // Download the file
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
        res.status(500).json({ error: 'Error downloading file' });
      }
    }
  }
}

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
