import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize apps lazily
let guestApp: admin.app.App | null = null;
let securityApp: admin.app.App | null = null;

function getGuestApp(): admin.app.App {
  if (guestApp) return guestApp;

  try {
    guestApp = admin.app('guest');
  } catch {
    let serviceAccount;

    // Try to load from environment variable first (Vercel/Production)
    if (process.env.FIREBASE_GUEST_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_GUEST_SERVICE_ACCOUNT);
      } catch (error) {
        console.error('Failed to parse FIREBASE_GUEST_SERVICE_ACCOUNT from env:', error);
        throw error;
      }
    } else {
      // Fallback to file system (Local Development)
      const serviceAccountPath = join(
        process.cwd(),
        'firebase-admins',
        'guest',
        'knockster-user-firebase-adminsdk-fbsvc-c68f742c14.json'
      );
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    }

    guestApp = admin.initializeApp(
      {
        credential: admin.credential.cert(serviceAccount),
        projectId: 'knockster-user',
      },
      'guest'
    );
  }

  return guestApp;
}

function getSecurityApp(): admin.app.App {
  if (securityApp) return securityApp;

  try {
    securityApp = admin.app('security');
  } catch {
    let serviceAccount;

    // Try to load from environment variable first (Vercel/Production)
    if (process.env.FIREBASE_SECURITY_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SECURITY_SERVICE_ACCOUNT);
      } catch (error) {
        console.error('Failed to parse FIREBASE_SECURITY_SERVICE_ACCOUNT from env:', error);
        throw error;
      }
    } else {
      // Fallback to file system (Local Development)
      const serviceAccountPath = join(
        process.cwd(),
        'firebase-admins',
        'security',
        'knockstersecurity-firebase-adminsdk-fbsvc-1ac8e47396.json'
      );
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    }

    securityApp = admin.initializeApp(
      {
        credential: admin.credential.cert(serviceAccount),
        projectId: 'knockstersecurity',
      },
      'security'
    );
  }

  return securityApp;
}

export interface FCMNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface FCMSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send notification to a single device token
 */
export async function sendFCMNotification(
  token: string,
  payload: FCMNotificationPayload,
  appType: 'guest' | 'security'
): Promise<FCMSendResult> {
  try {
    const app = appType === 'guest' ? getGuestApp() : getSecurityApp();
    const messaging = admin.messaging(app);

    // Check if it's an Expo token or FCM token
    const isExpoToken = token.startsWith('ExponentPushToken[');

    if (isExpoToken) {
      // Expo tokens can't be sent via FCM directly
      console.warn('Expo token detected. Use Expo push service for these tokens.');
      return {
        success: false,
        error: 'Expo tokens require Expo push service',
      };
    }

    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const messageId = await messaging.send(message);

    return {
      success: true,
      messageId,
    };
  } catch (error: any) {
    console.error('FCM send error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification',
    };
  }
}

/**
 * Send notifications to multiple device tokens
 */
export async function sendFCMNotifications(
  tokens: string[],
  payload: FCMNotificationPayload,
  appType: 'guest' | 'security'
): Promise<{
  successCount: number;
  failureCount: number;
  results: FCMSendResult[];
}> {
  const results = await Promise.all(
    tokens.map((token) => sendFCMNotification(token, payload, appType))
  );

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  return {
    successCount,
    failureCount,
    results,
  };
}

/**
 * Send to multiple tokens using multicast (more efficient for large batches)
 */
export async function sendMulticastFCMNotification(
  tokens: string[],
  payload: FCMNotificationPayload,
  appType: 'guest' | 'security'
): Promise<{
  successCount: number;
  failureCount: number;
}> {
  try {
    const app = appType === 'guest' ? getGuestApp() : getSecurityApp();
    const messaging = admin.messaging(app);

    // Filter out Expo tokens
    const fcmTokens = tokens.filter((token) => !token.startsWith('ExponentPushToken['));

    if (fcmTokens.length === 0) {
      return { successCount: 0, failureCount: tokens.length };
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('Multicast send error:', error);
    return {
      successCount: 0,
      failureCount: tokens.length,
    };
  }
}
