// Hybrid ACL system: Supabase Storage + Replit Object Storage (legacy)
import { File } from "@google-cloud/storage";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

// ============================================================================
// Types and Enums
// ============================================================================

export enum ObjectAccessGroupType {}

export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  id: string;
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

// ============================================================================
// Helper Functions
// ============================================================================

// Check if the requested permission is allowed based on the granted permission
function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }
  return granted === ObjectPermission.WRITE;
}

// Base class for access groups
abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  public abstract hasMember(userId: string): Promise<boolean>;
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  switch (group.type) {
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}

// ============================================================================
// Legacy Google Cloud Storage Functions
// ============================================================================

/**
 * Sets the ACL policy to the object metadata (Google Cloud Storage)
 */
export async function setObjectAclPolicy(
  objectFile: File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }

  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    },
  });
}

/**
 * Gets the ACL policy from the object metadata (Google Cloud Storage)
 */
export async function getObjectAclPolicy(
  objectFile: File,
): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy as string);
}

/**
 * Checks if the user can access the object (Google Cloud Storage File)
 */
export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile?: File;
  aclPolicy?: ObjectAclPolicy | null;
  requestedPermission?: ObjectPermission;
}): Promise<boolean> {
  // If objectFile is provided (legacy), use Google Cloud Storage ACL
  if (objectFile) {
    const aclPolicy = await getObjectAclPolicy(objectFile);
    if (!aclPolicy) {
      return false;
    }

    const permission = requestedPermission || ObjectPermission.READ;

    // Public objects are always accessible for read
    if (
      aclPolicy.visibility === "public" &&
      permission === ObjectPermission.READ
    ) {
      return true;
    }

    // Access control requires the user id
    if (!userId) {
      return false;
    }

    // The owner of the object can always access it
    if (aclPolicy.owner === userId) {
      return true;
    }

    // Go through the ACL rules to check if the user has the required permission
    for (const rule of aclPolicy.aclRules || []) {
      const accessGroup = createObjectAccessGroup(rule.group);
      if (
        (await accessGroup.hasMember(userId)) &&
        isPermissionAllowed(permission, rule.permission)
      ) {
        return true;
      }
    }

    return false;
  }

  // Fallback: if no objectFile, just check if user is authenticated
  return !!userId;
}
