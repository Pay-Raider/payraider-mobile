import notifee, { AndroidImportance } from '@notifee/react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { z } from 'zod';

// Schema for the notification payload we expect from the backend.
// Any field absent or of the wrong type causes the message to be dropped
// rather than crashing the handler.
const NotificationPayloadSchema = z.object({
  notification: z
    .object({
      title: z.string().optional(),
      body: z.string().optional(),
    })
    .optional(),
  data: z.record(z.string()).optional(),
});

type ValidatedPayload = z.infer<typeof NotificationPayloadSchema>;

function parsePayload(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): ValidatedPayload | null {
  const result = NotificationPayloadSchema.safeParse(remoteMessage);
  if (!result.success) {
    console.warn(
      '[Notifications] Dropping malformed payload:',
      result.error.flatten(),
    );
    return null;
  }
  return result.data;
}

export async function setupNotifications(): Promise<void> {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log('[Notifications] Permission denied');
    return;
  }

  const token = await messaging().getToken();
  console.log('[Notifications] FCM token registered');

  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });
  }

  messaging().onMessage(async remoteMessage => {
    const payload = parsePayload(remoteMessage);
    if (!payload) {
      return;
    }

    await notifee.displayNotification({
      title: payload.notification?.title,
      body: payload.notification?.body,
      android: {
        channelId: 'default',
        smallIcon: 'ic_launcher',
      },
    });
  });
}
