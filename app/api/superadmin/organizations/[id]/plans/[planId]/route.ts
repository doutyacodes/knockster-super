import { NextRequest } from 'next/server';
import { db } from '@/db';
import { organizationPlan, subscriptionPlan, auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/api-response';
import { z } from 'zod';

const updatePlanSchema = z.object({
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').nullable().optional(),
  status: z.enum(['active', 'expired', 'cancelled']).optional(),
});

// PATCH - Update organization plan assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const { id, planId } = await params;

    const body = await request.json();
    const validation = updatePlanSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    // Check if organization plan exists
    const [existing] = await db
      .select()
      .from(organizationPlan)
      .where(eq(organizationPlan.id, planId))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Organization plan assignment not found');
    }

    // Prepare update data
    const updateData: any = {};
    if (validation.data.startDate) {
      updateData.startDate = new Date(validation.data.startDate);
    }
    if (validation.data.endDate !== undefined) {
      updateData.endDate = validation.data.endDate ? new Date(validation.data.endDate) : null;
    }
    if (validation.data.status) {
      updateData.status = validation.data.status;
    }

    // Update organization plan (MySQL: .returning() unavailable)
    await db
      .update(organizationPlan)
      .set(updateData)
      .where(eq(organizationPlan.id, planId));

    // Fetch updated record with plan details
    const [updated] = await db
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
      .where(eq(organizationPlan.id, planId))
      .limit(1);

    if (!updated) {
      return errorResponse('Failed to retrieve updated organization plan', 500);
    }

    // Log audit
    await db.insert(auditLog).values({
      actorType: 'SuperAdmin',
      actorId: user.id,
      action: 'ORG_PLAN_UPDATED',
      metadata: {
        organizationPlanId: updated.id,
        organizationNodeId: updated.organizationNodeId,
        changes: validation.data,
      },
    });

    return successResponse(updated, 'Organization plan updated successfully');
  } catch (error) {
    console.error('Update organization plan error:', error);
    return errorResponse('Failed to update organization plan', 500);
  }
}

// DELETE - Remove plan assignment from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const { id, planId } = await params;

    // Check if organization plan exists
    const [existing] = await db
      .select()
      .from(organizationPlan)
      .where(eq(organizationPlan.id, planId))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Organization plan assignment not found');
    }

    // Delete organization plan
    await db
      .delete(organizationPlan)
      .where(eq(organizationPlan.id, planId));

    // Log audit
    await db.insert(auditLog).values({
      actorType: 'SuperAdmin',
      actorId: user.id,
      action: 'ORG_PLAN_REMOVED',
      metadata: {
        organizationPlanId: existing.id,
        organizationNodeId: existing.organizationNodeId,
        subscriptionPlanId: existing.subscriptionPlanId,
      },
    });

    return successResponse(null, 'Plan removed from organization successfully');
  } catch (error) {
    console.error('Delete organization plan error:', error);
    return errorResponse('Failed to remove plan from organization', 500);
  }
}
