import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orgAdmin, organizationNode, auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, hashPassword } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';
import { z } from 'zod';

const createAdminSchema = z.object({
  organizationNodeId: z.string().uuid('Invalid organization ID'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// GET - List all org admins
export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const organizationNodeId = searchParams.get('organizationNodeId');

    let admins;

    if (organizationNodeId) {
      // Get admins for specific organization
      admins = await db
        .select({
          id: orgAdmin.id,
          email: orgAdmin.email,
          status: orgAdmin.status,
          createdAt: orgAdmin.createdAt,
          organizationNodeId: orgAdmin.organizationNodeId,
          organizationName: organizationNode.name,
        })
        .from(orgAdmin)
        .leftJoin(organizationNode, eq(orgAdmin.organizationNodeId, organizationNode.id))
        .where(eq(orgAdmin.organizationNodeId, organizationNodeId));
    } else {
      // Get all admins
      admins = await db
        .select({
          id: orgAdmin.id,
          email: orgAdmin.email,
          status: orgAdmin.status,
          createdAt: orgAdmin.createdAt,
          organizationNodeId: orgAdmin.organizationNodeId,
          organizationName: organizationNode.name,
        })
        .from(orgAdmin)
        .leftJoin(organizationNode, eq(orgAdmin.organizationNodeId, organizationNode.id));
    }

    return successResponse(admins);
  } catch (error) {
    console.error('Get admins error:', error);
    return errorResponse('Failed to fetch admins', 500);
  }
}

// POST - Create new org admin
export async function POST(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = createAdminSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    const { organizationNodeId, email, password } = validation.data;

    // Verify organization exists
    const [org] = await db
      .select()
      .from(organizationNode)
      .where(eq(organizationNode.id, organizationNodeId))
      .limit(1);

    if (!org) {
      return errorResponse('Organization not found', 404);
    }

    // Check if email already exists
    const [existingAdmin] = await db
      .select()
      .from(orgAdmin)
      .where(eq(orgAdmin.email, email))
      .limit(1);

    if (existingAdmin) {
      return errorResponse('Email already in use', 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate UUID for the new admin
    const newAdminId = crypto.randomUUID();

    // Create admin (MySQL: .returning() unavailable)
    await db
      .insert(orgAdmin)
      .values({
        id: newAdminId,
        organizationNodeId,
        email,
        passwordHash,
        status: 'active',
      });

    // Fetch inserted record
    const [newAdmin] = await db
      .select()
      .from(orgAdmin)
      .where(eq(orgAdmin.id, newAdminId))
      .limit(1);

    if (!newAdmin) {
      return errorResponse('Failed to retrieve created admin', 500);
    }

    // Log audit
    await db.insert(auditLog).values({
      actorType: 'SuperAdmin',
      actorId: user.id,
      action: 'ADMIN_CREATED',
      metadata: {
        adminId: newAdmin.id,
        adminEmail: newAdmin.email,
        organizationNodeId,
      },
    });

    // Return admin without password hash
    const { passwordHash: _, ...adminData } = newAdmin;

    return successResponse(adminData, 'Admin created successfully');
  } catch (error) {
    console.error('Create admin error:', error);
    return errorResponse('Failed to create admin', 500);
  }
}
