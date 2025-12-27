import { NextRequest } from 'next/server';
import { db } from '@/db';
import { organizationNode, auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';
import { z } from 'zod';

const createOrgSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['techpark', 'block', 'building', 'company', 'gate', 'custom']),
  parentId: z.string().uuid().nullable().optional(),
  planOverrideLevel: z.number().min(1).max(4).nullable().optional(),
});

// GET - List all organizations or get organization tree
export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const includeChildren = searchParams.get('includeChildren') === 'true';

    let organizations;

    if (parentId) {
      organizations = await db
        .select()
        .from(organizationNode)
        .where(eq(organizationNode.parentId, parentId));
    } else if (includeChildren) {
      organizations = await db.select().from(organizationNode);
    } else {
      organizations = await db
        .select()
        .from(organizationNode)
        .where(eq(organizationNode.parentId, null as any));
    }

    return successResponse(organizations);
  } catch (error) {
    console.error('Get organizations error:', error);
    return errorResponse('Failed to fetch organizations', 500);
  }
}

// POST - Create new organization node
export async function POST(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = createOrgSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    const { name, type, parentId, planOverrideLevel } = validation.data;

    // If parentId provided, verify it exists
    if (parentId) {
      const [parent] = await db
        .select()
        .from(organizationNode)
        .where(eq(organizationNode.id, parentId))
        .limit(1);

      if (!parent) {
        return errorResponse('Parent organization not found', 404);
      }
    }

    // Generate UUID for the new organization
    const newOrgId = crypto.randomUUID();

    // Insert organization (MySQL: .returning() unavailable)
    await db
      .insert(organizationNode)
      .values({
        id: newOrgId,
        name,
        type,
        parentId: parentId || null,
        planOverrideLevel: planOverrideLevel || null,
        status: 'active',
      });

    // Fetch inserted record
    const [newOrg] = await db
      .select()
      .from(organizationNode)
      .where(eq(organizationNode.id, newOrgId))
      .limit(1);

    if (!newOrg) {
      return errorResponse('Failed to retrieve created organization', 500);
    }

    // Insert audit log
    await db.insert(auditLog).values({
      actorType: 'SuperAdmin',
      actorId: user.id,
      action: 'ORG_NODE_CREATED',
      metadata: {
        organizationId: newOrg.id,
        organizationName: newOrg.name,
        type: newOrg.type,
      },
    });

    return successResponse(newOrg, 'Organization created successfully');
  } catch (error) {
    console.error('Create organization error:', error);
    return errorResponse('Failed to create organization', 500);
  }
}
