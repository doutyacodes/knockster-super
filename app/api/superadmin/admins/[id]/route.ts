import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orgAdmin, auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/api-response';
import { z } from 'zod';

const updateAdminSchema = z.object({
  status: z.enum(['active', 'disabled']).optional(),
  organizationNodeId: z.string().uuid().optional(),
});

// GET - Get single admin by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const [admin] = await db
      .select()
      .from(orgAdmin)
      .where(eq(orgAdmin.id, params.id))
      .limit(1);

    if (!admin) {
      return notFoundResponse('Admin not found');
    }

    // Don't send password hash
    const { passwordHash: _, ...adminData } = admin;

    return successResponse(adminData);
  } catch (error) {
    console.error('Get admin error:', error);
    return errorResponse('Failed to fetch admin', 500);
  }
}

// PATCH - Update admin
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = updateAdminSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    // Check if admin exists
    const [existing] = await db
      .select()
      .from(orgAdmin)
      .where(eq(orgAdmin.id, params.id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Admin not found');
    }

    // Update admin
    await db
      .update(orgAdmin)
      .set(validation.data)
      .where(eq(orgAdmin.id, params.id));

    const [updated] = await db
      .select()
      .from(orgAdmin)
      .where(eq(orgAdmin.id, params.id))
      .limit(1);

    // Log audit
    await db.insert(auditLog).values({
      actorType: 'SuperAdmin',
      actorId: user.id,
      action: 'ADMIN_UPDATED',
      metadata: {
        adminId: updated.id,
        adminEmail: updated.email,
        changes: validation.data,
      },
    });

    // Don't send password hash
    const { passwordHash: _, ...adminData } = updated;

    return successResponse(adminData, 'Admin updated successfully');
  } catch (error) {
    console.error('Update admin error:', error);
    return errorResponse('Failed to update admin', 500);
  }
}

// DELETE - Delete admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    // Check if admin exists
    const [existing] = await db
      .select()
      .from(orgAdmin)
      .where(eq(orgAdmin.id, params.id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Admin not found');
    }

    // Delete admin (cascade will handle related records)
    await db
      .delete(orgAdmin)
      .where(eq(orgAdmin.id, params.id));

    // Log audit
    await db.insert(auditLog).values({
      actorType: 'SuperAdmin',
      actorId: user.id,
      action: 'ADMIN_DELETED',
      metadata: {
        adminId: existing.id,
        adminEmail: existing.email,
      },
    });

    return successResponse(null, 'Admin deleted successfully');
  } catch (error) {
    console.error('Delete admin error:', error);
    return errorResponse('Failed to delete admin', 500);
  }
}
