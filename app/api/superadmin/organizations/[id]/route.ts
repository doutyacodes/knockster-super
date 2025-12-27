import { NextRequest } from 'next/server';
import { db } from '@/db';
import { organizationNode, auditLog } from '@/db/schema';
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


const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['techpark', 'block', 'building', 'company', 'gate', 'custom']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  planOverrideLevel: z.number().min(1).max(4).nullable().optional(),
});

// GET - Get single organization by ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext<{ id: string }>
) {
  const { id } = await params;

  const user = authenticateRequest(request);
  if (!user || user.role !== 'superadmin') {
    return unauthorizedResponse();
  }

  const [org] = await db
    .select()
    .from(organizationNode)
    .where(eq(organizationNode.id, id))
    .limit(1);

  if (!org) {
    return notFoundResponse('Organization not found');
  }

  return successResponse(org);
}

// PATCH - Update organization
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
  const validation = updateOrgSchema.safeParse(body);

  if (!validation.success) {
    return errorResponse(validation.error.errors[0].message);
  }

  const [existing] = await db
    .select()
    .from(organizationNode)
    .where(eq(organizationNode.id, id))
    .limit(1);

  if (!existing) {
    return notFoundResponse('Organization not found');
  }

  await db
    .update(organizationNode)
    .set(validation.data)
    .where(eq(organizationNode.id, id));

  const [updated] = await db
    .select()
    .from(organizationNode)
    .where(eq(organizationNode.id, id))
    .limit(1);

  if (!updated) {
    return errorResponse('Failed to retrieve updated organization', 500);
  }

  await db.insert(auditLog).values({
    actorType: 'SuperAdmin',
    actorId: user.id,
    action: 'ORG_NODE_UPDATED',
    metadata: {
      organizationId: updated.id,
      organizationName: updated.name,
      changes: validation.data,
    },
  });

  return successResponse(updated, 'Organization updated successfully');
}

// DELETE - Delete organization
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
    .from(organizationNode)
    .where(eq(organizationNode.id, id))
    .limit(1);

  if (!existing) {
    return notFoundResponse('Organization not found');
  }

  const children = await db
    .select()
    .from(organizationNode)
    .where(eq(organizationNode.parentId, id))
    .limit(1);

  if (children.length > 0) {
    return errorResponse(
      'Cannot delete organization with child nodes. Delete children first.',
      400
    );
  }

  await db
    .delete(organizationNode)
    .where(eq(organizationNode.id, id));

  await db.insert(auditLog).values({
    actorType: 'SuperAdmin',
    actorId: user.id,
    action: 'ORG_NODE_DELETED',
    metadata: {
      organizationId: existing.id,
      organizationName: existing.name,
    },
  });

  return successResponse(null, 'Organization deleted successfully');
}
