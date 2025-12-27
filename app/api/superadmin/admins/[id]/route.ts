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

type RouteContext<T> = {
  params: Promise<T>;
};

const updateAdminSchema = z.object({
  status: z.enum(['active', 'disabled']).optional(),
  organizationNodeId: z.string().uuid().optional(),
});

// GET - Get single admin by ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext<{ id: string }>
) {
  const { id } = await params;

  const user = authenticateRequest(request);
  if (!user || user.role !== 'superadmin') {
    return unauthorizedResponse();
  }

  const [admin] = await db
    .select()
    .from(orgAdmin)
    .where(eq(orgAdmin.id, id))
    .limit(1);

  if (!admin) {
    return notFoundResponse('Admin not found');
  }

  const { passwordHash: _, ...adminData } = admin;
  return successResponse(adminData);
}


// PATCH - Update admin
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<{ id: string }>
) {
  const { id } = await params;

  const user = authenticateRequest(request);
  if (!user || user.role !== 'superadmin') {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const validation = updateAdminSchema.safeParse(body);

  if (!validation.success) {
    return errorResponse(validation.error.errors[0].message);
  }

  const [existing] = await db
    .select()
    .from(orgAdmin)
    .where(eq(orgAdmin.id, id))
    .limit(1);

  if (!existing) {
    return notFoundResponse('Admin not found');
  }

  await db
    .update(orgAdmin)
    .set(validation.data)
    .where(eq(orgAdmin.id, id));

  const [updated] = await db
    .select()
    .from(orgAdmin)
    .where(eq(orgAdmin.id, id))
    .limit(1);

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

  const { passwordHash: _, ...adminData } = updated;
  return successResponse(adminData, 'Admin updated successfully');
}

// DELETE - Delete admin
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<{ id: string }>
) {
  const { id } = await params;

  const user = authenticateRequest(request);
  if (!user || user.role !== 'superadmin') {
    return unauthorizedResponse();
  }

  const [existing] = await db
    .select()
    .from(orgAdmin)
    .where(eq(orgAdmin.id, id))
    .limit(1);

  if (!existing) {
    return notFoundResponse('Admin not found');
  }

  await db.delete(orgAdmin).where(eq(orgAdmin.id, id));

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
}

