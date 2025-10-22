// Simplified ACL system for Supabase Storage
// In production, Supabase RLS (Row Level Security) policies handle access control

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

// The ACL policy of the object
export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

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

// Checks if the user can access the object
// In Supabase, this is primarily handled by RLS policies
export async function canAccessObject({
  userId,
  aclPolicy,
  requestedPermission,
}: {
  userId?: string;
  aclPolicy?: ObjectAclPolicy | null;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  // If no ACL policy, deny access
  if (!aclPolicy) {
    return false;
  }

  // Public objects are always accessible for read
  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
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
    // In a full implementation, you would check group membership here
    // For now, we rely on message-level access control in routes.ts
    if (isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }

  return false;
}
