import prisma from "@/lib/prisma";

// ─── Audit Logging for Sensitive Operations ────────────────
// Records security-relevant events for compliance and forensics.

export type AuditAction =
  | "api_key_created"
  | "api_key_deleted"
  | "data_export"
  | "account_deleted"
  | "role_changed"
  | "user_verified"
  | "user_created_webhook"
  | "user_deleted_webhook";

export type AuditTargetType =
  | "user"
  | "api_key"
  | "export"
  | "webhook";

interface AuditLogParams {
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  performedById?: string; // Optional — null for system actions or deleted users
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry for a sensitive operation.
 * Never throws — logs errors silently so the main operation is not affected.
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata
        ? JSON.stringify(params.metadata)
        : null,
    };

    // Use relation connect when we have a performedById
    if (params.performedById) {
      data.performedBy = { connect: { id: params.performedById } };
    }

    await prisma.auditLog.create({ data });
  } catch (error) {
    // Log but don't fail the main operation
    console.error("[Audit] Failed to create audit log:", error);
  }
}
