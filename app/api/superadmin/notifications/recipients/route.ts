import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { guest, securityPersonnel, notificationTokens } from '@/db/schema';
import { eq, and, isNotNull, or, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse('Super admin access required');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'guest' or 'security'

    if (!type || !['guest', 'security'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid recipient type. Must be "guest" or "security"' },
        { status: 400 }
      );
    }

    let totalUsers = 0;
    let totalTokens = 0;

    if (type === 'guest') {
      // Count total guests with tokens
      const result = await db
        .select({
          userCount: sql<number>`COUNT(DISTINCT ${guest.id})`,
          tokenCount: sql<number>`COUNT(${notificationTokens.id})`,
        })
        .from(guest)
        .innerJoin(
          notificationTokens,
          and(
            eq(notificationTokens.guestId, guest.id),
            isNotNull(notificationTokens.deviceToken)
          )
        );

      totalUsers = result[0]?.userCount || 0;
      totalTokens = result[0]?.tokenCount || 0;
    } else if (type === 'security') {
      // Count total security personnel with tokens
      const result = await db
        .select({
          userCount: sql<number>`COUNT(DISTINCT ${securityPersonnel.id})`,
          tokenCount: sql<number>`COUNT(${notificationTokens.id})`,
        })
        .from(securityPersonnel)
        .innerJoin(
          notificationTokens,
          and(
            eq(notificationTokens.securityPersonnelId, securityPersonnel.id),
            isNotNull(notificationTokens.deviceToken)
          )
        );

      totalUsers = result[0]?.userCount || 0;
      totalTokens = result[0]?.tokenCount || 0;
    }

    return successResponse({
      totalUsers,
      totalTokens,
    });
  } catch (error) {
    console.error('Get recipients error:', error);
    return serverErrorResponse();
  }
}
