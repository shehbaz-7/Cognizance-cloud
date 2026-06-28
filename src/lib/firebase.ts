import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, OAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported, Messaging } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (SSR friendly)
let app: any = null;
let auth: any = null;

const mockAuth: any = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    callback(null);
    return () => {};
  },
  onIdTokenChanged: (callback: any) => {
    callback(null);
    return () => {};
  }
};

const isValidConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== "placeholder" && firebaseConfig.apiKey.trim() !== "";

if (isValidConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase client initialization error, falling back to mock auth:", error);
    auth = mockAuth;
  }
} else {
  console.warn("Firebase client API key is missing or placeholder. Firebase Auth will operate in offline/mock mode.");
  auth = mockAuth;
}

// Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
const githubProvider = new GithubAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');

// Initialize Analytics (Browser-only)
if (app && typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

// Initialize Messaging lazily (Browser-only)
let messaging: Messaging | null = null;
if (app && typeof window !== "undefined" && typeof navigator !== "undefined") {
  isMessagingSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

export { app, auth, googleProvider, githubProvider, microsoftProvider, messaging };
