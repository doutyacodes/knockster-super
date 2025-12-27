import { NextRequest } from 'next/server';
import { db } from '@/db';
import { organizationPlan, organizationNode, subscriptionPlan, auditLog } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/api-response';
import { z } from 'zod';

const assignPlanSchema = z.object({
  subscriptionPlanId: z.string().uuid('Invalid plan ID'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').nullable().optional(),
});

// GET - Get all plans assigned to an organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const { id } = await params;

    // Verify organization exists
    const [org] = await db
      .select()
      .from(organizationNode)
      .where(eq(organizationNode.id, id))
      .limit(1);

    if (!org) {
      return notFoundResponse('Organization not found');
    }

    // Get all plans for this organization with plan details
    const plans = await db
      .select({
        id: organizationPlan.id,
        organizationNodeId: organizationPlan.organizationNodeId,
        subscriptionPlanId: organizationPlan.subscriptionPlanId,
        startDate: organizationPlan.startDate,
        endDate: organizationPlan.endDate,
        status: organizationPlan.status,
        createdAt: organizationPlan.createdAt,
        planName: subscriptionPlan.name,
        planPrice: subscriptionPlan.price,
        allowL1: subscriptionPlan.allowL1,
        allowL2: subscriptionPlan.allowL2,
        allowL3: subscriptionPlan.allowL3,
        allowL4: subscriptionPlan.allowL4,
        maxGuards: subscriptionPlan.maxGuards,
        maxGuestPasses: subscriptionPlan.maxGuestPasses,
      })
      .from(organizationPlan)
      .leftJoin(subscriptionPlan, eq(organizationPlan.subscriptionPlanId, subscriptionPlan.id))
      .where(eq(organizationPlan.organizationNodeId, id));

    return successResponse(plans);
  } catch (error) {
    console.error('Get organization plans error:', error);
    return errorResponse('Failed to fetch organization plans', 500);
  }
}

// POST - Assign a plan to an organization
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const body = await request.json();
    const validation = assignPlanSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    const { subscriptionPlanId, startDate, endDate } = validation.data;

    // Verify organization exists
    const [org] = await db
      .select()
      .from(organizationNode)
      .where(eq(organizationNode.id, id))
      .limit(1);

    if (!org) {
      return notFoundResponse('Organization not found');
    }

    // Verify subscription plan exists
    const [plan] = await db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.id, subscriptionPlanId))
      .limit(1);

    if (!plan) {
      return notFoundResponse('Subscription plan not found');
    }

    // Generate UUID for the new organization plan
    const newOrgPlanId = crypto.randomUUID();

    // Insert organization plan assignment (MySQL: .returning() unavailable)
    await db
      .insert(organizationPlan)
      .values({
        id: newOrgPlanId,
        organizationNodeId: id,
        subscriptionPlanId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: 'active',
      });

    // Fetch inserted record with plan details
    const [newOrgPlan] = await db
      .select({
        id: organizationPlan.id,
        organizationNodeId: organizationPlan.organizationNodeId,
        subscriptionPlanId: organizationPlan.subscriptionPlanId,
        startDate: organizationPlan.startDate,
        endDate: organizationPlan.endDate,
        status: organizationPlan.status,
        createdAt: organizationPlan.createdAt,
        planName: subscriptionPlan.name,
        planPrice: subscriptionPlan.price,
      })
      .from(organizationPlan)
      .leftJoin(subscriptionPlan, eq(organizationPlan.subscriptionPlanId, subscriptionPlan.id))
      .where(eq(organizationPlan.id, newOrgPlanId))
      .limit(1);

    if (!newOrgPlan) {
      return errorResponse('Failed to retrieve created organization plan', 500);
    }

    // Log audit
    await db.insert(auditLog).values({
      actorType: 'SuperAdmin',
      actorId: user.id,
      action: 'ORG_PLAN_ASSIGNED',
      metadata: {
        organizationId: org.id,
        organizationName: org.name,
        planId: plan.id,
        planName: plan.name,
        startDate,
        endDate,
      },
    });

    return successResponse(newOrgPlan, 'Plan assigned to organization successfully');
  } catch (error) {
    console.error('Assign plan to organization error:', error);
    return errorResponse('Failed to assign plan to organization', 500);
  }
}
