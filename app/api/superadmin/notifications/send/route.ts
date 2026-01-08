import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notificationTokens, notifications, auditLog } from '@/db/schema';
import { eq, and, inArray, isNotNull, or } from 'drizzle-orm';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response';
import { v4 as uuidv4 } from 'uuid';
import { sendMulticastFCMNotification } from '@/lib/firebase-admin';

// Create Expo SDK client
const expo = new Expo();

// Validation schema
const sendNotificationSchema = z.object({
  recipientType: z.enum(['guest', 'security']),
  title: z.string().min(1, 'Title is required').max(100),
  body: z.string().min(1, 'Message is required').max(500),
  type: z.enum(['general', 'alert', 'system', 'invitation', 'scan']).default('general'),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate super admin
    const user = authenticateRequest(request);
    if (!user || user.role !== 'superadmin') {
      return unauthorizedResponse('Super admin access required');
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = sendNotificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { recipientType, title, body: messageBody, type } = validation.data;

    // Fetch ALL notification tokens for the recipient type
    let tokens: any[] = [];

    if (recipientType === 'guest') {
      tokens = await db
        .select()
        .from(notificationTokens)
        .where(
          and(
            isNotNull(notificationTokens.guestId),
            isNotNull(notificationTokens.deviceToken)
          )
        );
    } else {
      tokens = await db
        .select()
        .from(notificationTokens)
        .where(
          and(
            isNotNull(notificationTokens.securityPersonnelId),
            isNotNull(notificationTokens.deviceToken)
          )
        );
    }

    if (tokens.length === 0) {
      return NextResponse.json(
        { error: `No ${recipientType} users with notification tokens found` },
        { status: 400 }
      );
    }

    // Separate Expo tokens and FCM tokens
    const expoTokens: string[] = [];
    const fcmTokens: string[] = [];

    for (const tokenRecord of tokens) {
      const pushToken = tokenRecord.deviceToken;
      if (!pushToken) continue;

      if (Expo.isExpoPushToken(pushToken)) {
        expoTokens.push(pushToken);
      } else {
        // Assume it's an FCM token
        fcmTokens.push(pushToken);
      }
    }

    let sentCount = 0;
    let failedCount = 0;

    // Send to Expo tokens if any
    if (expoTokens.length > 0) {
      const messages: ExpoPushMessage[] = expoTokens.map((token) => ({
        to: token,
        sound: 'default',
        title: title,
        body: messageBody,
        data: {
          type: type,
          recipientType: recipientType,
        },
        priority: 'high',
        channelId: 'default',
      }));

      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending Expo notification chunk:', error);
        }
      }

      for (const ticket of tickets) {
        if (ticket.status === 'ok') {
          sentCount++;
        } else {
          failedCount++;
          console.error('Expo notification error:', ticket);
        }
      }
    }

    // Send to FCM tokens if any
    if (fcmTokens.length > 0) {
      const fcmResult = await sendMulticastFCMNotification(
        fcmTokens,
        {
          title,
          body: messageBody,
          data: {
            type,
            recipientType,
          },
        },
        recipientType
      );

      sentCount += fcmResult.successCount;
      failedCount += fcmResult.failureCount;
    }

    // Store notification record in database (broadcast style)
    const notificationId = uuidv4();
    await db.insert(notifications).values({
      id: notificationId,
      title: title,
      body: messageBody,
      recipientType: recipientType,
      notificationType: type,
      relatedEntityId: null,
      sentAt: new Date(),
    });

    // Log audit trail
    await db.insert(auditLog).values({
      actorType: 'SuperAdmin',
      actorId: user.id,
      action: 'SEND_NOTIFICATION',
      metadata: {
        notificationId,
        recipientType,
        title,
        type,
        sentCount,
        failedCount,
        totalTokens: tokens.length,
        expoTokenCount: expoTokens.length,
        fcmTokenCount: fcmTokens.length,
      },
    });

    return successResponse({
      success: true,
      message: `Notification sent successfully to ${sentCount} device(s)`,
      sentCount,
      failedCount,
      totalTokens: tokens.length,
      breakdown: {
        expo: expoTokens.length,
        fcm: fcmTokens.length,
      },
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return serverErrorResponse();
  }
}
