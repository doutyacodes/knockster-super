import { NextRequest } from 'next/server';
import { db } from '@/db';
import { auditLog } from '@/db/schema';
import { desc, and, eq, gte, lte } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';

// GET - List audit logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Filters
    const actorType = searchParams.get('actorType');
    const actorId = searchParams.get('actorId');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where conditions
    const conditions = [];

    if (actorType) {
      conditions.push(eq(auditLog.actorType, actorType as any));
    }

    if (actorId) {
      conditions.push(eq(auditLog.actorId, actorId));
    }

    if (action) {
      conditions.push(eq(auditLog.action, action));
    }

    if (startDate) {
      conditions.push(gte(auditLog.timestamp, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(auditLog.timestamp, new Date(endDate)));
    }

    // Fetch logs
    const logs = await db
      .select()
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.timestamp))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: auditLog.id })
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return successResponse({
      logs,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return errorResponse('Failed to fetch audit logs', 500);
  }
}
