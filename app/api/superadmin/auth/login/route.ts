import { NextRequest } from 'next/server';
import { db } from '@/db';
import { superAdmin } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    const { email, password } = validation.data;

    // Find super admin by email
    const [admin] = await db
      .select()
      .from(superAdmin)
      .where(eq(superAdmin.email, email))
      .limit(1);

    if (!admin) {
      return unauthorizedResponse('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, admin.passwordHash);
    if (!isValidPassword) {
      return unauthorizedResponse('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: 'superadmin',
    });

    return successResponse({
      token,
      user: {
        id: admin.id,
        email: admin.email,
        twoFactorEnabled: admin.twoFactorEnabled,
      },
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('An error occurred during login', 500);
  }
}
