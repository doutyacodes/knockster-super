import { NextRequest } from 'next/server';
import { db } from '@/db';
import { subscriptionPlan, auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';
import { z } from 'zod';

const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  allowL1: z.boolean().default(true),
  allowL2: z.boolean().default(false),
  allowL3: z.boolean().default(false),
  allowL4: z.boolean().default(false),
  maxGuards: z.number().min(1, 'Must allow at least 1 guard'),
  maxGuestPasses: z.number().min(1, 'Must allow at least 1 guest pass'),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
});

// GET - List all subscription plans
export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const plans = await db.select().from(subscriptionPlan);

    return successResponse(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    return errorResponse('Failed to fetch subscription plans', 500);
  }
}

// POST - Create new subscription plan
export async function POST(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = createPlanSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    // Generate UUID for the new plan
    const newPlanId = crypto.randomUUID();

    // Insert plan (MySQL: .returning() unavailable)
    await db
      .insert(subscriptionPlan)
      .values({
        id: newPlanId,
        ...validation.data,
      });

    // Fetch inserted record
    const [newPlan] = await db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.id, newPlanId))
      .limit(1);

    if (!newPlan) {
      return errorResponse('Failed to retrieve created plan', 500);
    }

    // Log audit
    await db.insert(auditLog).values({
      actorType: 'SuperAdmin',
      actorId: user.id,
      action: 'PLAN_CREATED',
      metadata: {
        planId: newPlan.id,
        planName: newPlan.name,
      },
    });

    return successResponse(newPlan, 'Subscription plan created successfully');
  } catch (error) {
    console.error('Create plan error:', error);
    return errorResponse('Failed to create subscription plan', 500);
  }
}
