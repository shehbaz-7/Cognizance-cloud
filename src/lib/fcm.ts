import { messaging, firebaseConfig, app } from './firebase';
import { getToken, onMessage, isSupported } from 'firebase/messaging';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY_HERE';

export async function requestPushPermission(userId?: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    if (!supported || !messaging) {
      console.warn('Push notifications are not supported in this browser.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Register custom service worker with dynamic config
      const swUrl = `/firebase-messaging-sw.js?config=${encodeURIComponent(JSON.stringify(firebaseConfig))}`;
      const registration = await navigator.serviceWorker.register(swUrl);
      
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (currentToken) {
        if (userId) {
          await saveTokenToSupabase(userId, currentToken);
        }
        return currentToken;
      } else {
        console.warn('No registration token available. Request permission to generate one.');
        return null;
      }
    } else {
      console.log('Notification permission denied or dismissed.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token:', err);
    return null;
  }
}

export function onForegroundMessage(handler: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {};
  
  isSupported().then(supported => {
    if (supported && messaging) {
      onMessage(messaging, handler);
    }
  });
}

// Persist the token to Supabase for the active user
async function saveTokenToSupabase(userId: string, token: string) {
  try {
    // Attempt to upsert the token into a `fcm_tokens` table.
    // Ensure this table exists in your Supabase project:
    // create table fcm_tokens ( id serial primary key, user_id uuid not null, token text not null unique );
    const res = await fetch('/api/db/fcm-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, token })
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      console.warn('Could not save FCM token. Ensure table "fcm_tokens" exists.', data.error);
    }
  } catch (e) {
    console.error('Error saving FCM Token', e);
  }
}
