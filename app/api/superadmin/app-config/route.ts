import { NextRequest } from 'next/server';
import { db } from '@/db';
import { appConfig, auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';
import { z } from 'zod';

const updateConfigSchema = z.object({
  guestAppMaintenance: z.boolean().optional(),
  guestAppMaintenanceMessage: z.string().nullable().optional(),
  securityAppMaintenance: z.boolean().optional(),
  securityAppMaintenanceMessage: z.string().nullable().optional(),
  guestAppForceUpdate: z.boolean().optional(),
  guestAppMinVersion: z.string().nullable().optional(),
  securityAppForceUpdate: z.boolean().optional(),
  securityAppMinVersion: z.string().nullable().optional(),
});

// GET - Get current app configuration
export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    // Fetch the first (and should be only) config record
    const [config] = await db
      .select()
      .from(appConfig)
      .limit(1);

    // If no config exists, create default one
    if (!config) {
      const newConfigId = crypto.randomUUID();
      await db.insert(appConfig).values({
        id: newConfigId,
        guestAppMaintenance: false,
        guestAppMaintenanceMessage: null,
        securityAppMaintenance: false,
        securityAppMaintenanceMessage: null,
        guestAppForceUpdate: false,
        guestAppMinVersion: null,
        securityAppForceUpdate: false,
        securityAppMinVersion: null,
      });

      const [newConfig] = await db
        .select()
        .from(appConfig)
        .where(eq(appConfig.id, newConfigId))
        .limit(1);

      return successResponse(newConfig);
    }

    return successResponse(config);
  } catch (error) {
    console.error('Get app config error:', error);
    return errorResponse('Failed to fetch app configuration', 500);
  }
}

// PATCH - Update app configuration
export async function PATCH(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = updateConfigSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    // Get existing config
    const [existingConfig] = await db
      .select()
      .from(appConfig)
      .limit(1);

    let configId: string;

    if (!existingConfig) {
      // Create new config if doesn't exist
      configId = crypto.randomUUID();
      await db.insert(appConfig).values({
        id: configId,
        guestAppMaintenance: validation.data.guestAppMaintenance ?? false,
        guestAppMaintenanceMessage: validation.data.guestAppMaintenanceMessage ?? null,
        securityAppMaintenance: validation.data.securityAppMaintenance ?? false,
        securityAppMaintenanceMessage: validation.data.securityAppMaintenanceMessage ?? null,
        guestAppForceUpdate: validation.data.guestAppForceUpdate ?? false,
        guestAppMinVersion: validation.data.guestAppMinVersion ?? null,
        securityAppForceUpdate: validation.data.securityAppForceUpdate ?? false,
        securityAppMinVersion: validation.data.securityAppMinVersion ?? null,
      });
    } else {
      configId = existingConfig.id;
      // Update existing config
      await db
        .update(appConfig)
        .set({
          ...validation.data,
          updatedAt: new Date(),
        })
        .where(eq(appConfig.id, configId));
    }

    // Fetch updated config
    const [updatedConfig] = await db
      .select()
      .from(appConfig)
      .where(eq(appConfig.id, configId))
      .limit(1);

    if (!updatedConfig) {
      return errorResponse('Failed to retrieve updated configuration', 500);
    }

    // Log audit
    await db.insert(auditLog).values({
      actorType: 'SuperAdmin',
      actorId: user.id,
      action: 'APP_CONFIG_UPDATED',
      metadata: validation.data,
    });

    return successResponse(updatedConfig, 'App configuration updated successfully');
  } catch (error) {
    console.error('Update app config error:', error);
    return errorResponse('Failed to update app configuration', 500);
  }
}
