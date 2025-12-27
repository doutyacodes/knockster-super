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

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['techpark', 'block', 'building', 'company', 'gate', 'custom']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  planOverrideLevel: z.number().min(1).max(4).nullable().optional(),
});

// GET - Get single organization by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const [org] = await db
      .select()
      .from(organizationNode)
      .where(eq(organizationNode.id, params.id))
      .limit(1);

    if (!org) {
      return notFoundResponse('Organization not found');
    }

    return successResponse(org);
  } catch (error) {
    console.error('Get organization error:', error);
    return errorResponse('Failed to fetch organization', 500);
  }
}

// PATCH - Update organization
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
    const validation = updateOrgSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    // Check if organization exists
    const [existing] = await db
      .select()
      .from(organizationNode)
      .where(eq(organizationNode.id, params.id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Organization not found');
    }

    // Update organization (MySQL: .returning() unavailable)
    await db
      .update(organizationNode)
      .set(validation.data)
      .where(eq(organizationNode.id, params.id));

    // Fetch updated record
    const [updated] = await db
      .select()
      .from(organizationNode)
      .where(eq(organizationNode.id, params.id))
      .limit(1);

    if (!updated) {
      return errorResponse('Failed to retrieve updated organization', 500);
    }

    // Log audit
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
  } catch (error) {
    console.error('Update organization error:', error);
    return errorResponse('Failed to update organization', 500);
  }
}

// DELETE - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    // Check if organization exists
    const [existing] = await db
      .select()
      .from(organizationNode)
      .where(eq(organizationNode.id, params.id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Organization not found');
    }

    // Check if it has children
    const children = await db
      .select()
      .from(organizationNode)
      .where(eq(organizationNode.parentId, params.id))
      .limit(1);

    if (children.length > 0) {
      return errorResponse(
        'Cannot delete organization with child nodes. Delete children first.',
        400
      );
    }

    // Delete organization (cascade will handle related records)
    await db
      .delete(organizationNode)
      .where(eq(organizationNode.id, params.id));

    // Log audit
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
  } catch (error) {
    console.error('Delete organization error:', error);
    return errorResponse('Failed to delete organization', 500);
  }
}
