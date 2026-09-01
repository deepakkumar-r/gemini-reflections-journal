import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalEntry, InteractionRecord } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Firestore instance with configured database ID
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Strict Undefined-Stripping Utility (Zero-Crash Payload Hygiene)
 * Ensures no undefined values are sent to Firestore.
 */
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (value === undefined ? null : value))
  );
}

/**
 * Federated Google Sign-In
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In failed:', error);
    // Throw user-friendly error
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Firebase Auth: This domain (localhost) is not added to Authorized Domains in your Firebase Console project. You can click "Instant Live Preview Vault" below to use the app in guest mode, or add "localhost" under Firebase Console -> Authentication -> Settings -> Authorized domains.');
    }
    throw new Error(error.message || 'Failed to authenticate with Google.');
  }
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen to Auth State Changes
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Save or create a Journal Entry in Firestore
 * Stored strictly under `/users/{userId}/entries/{entryId}`
 */
export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error('User ID is required to save journal entry.');
  const cleanPayload = sanitizeForFirestore({
    ...entry,
    userId,
    updatedAt: Date.now()
  });
  const entryRef = doc(db, 'users', userId, 'entries', entry.id);
  await setDoc(entryRef, cleanPayload, { merge: true });
}

/**
 * Update an existing Journal Entry
 */
export async function updateJournalEntry(
  userId: string, 
  entryId: string, 
  updates: Partial<JournalEntry>
): Promise<void> {
  if (!userId || !entryId) throw new Error('User ID and Entry ID are required.');
  const cleanUpdates = sanitizeForFirestore({
    ...updates,
    updatedAt: Date.now()
  });
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await updateDoc(entryRef, cleanUpdates);
}

/**
 * Delete a Journal Entry
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error('User ID and Entry ID are required.');
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}

/**
 * Real-time subscription to a user's isolated journal entries
 */
export function subscribeToUserEntries(
  userId: string,
  onData: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void
) {
  if (!userId) {
    onData([]);
    return () => {};
  }

  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((doc) => {
        entries.push(doc.data() as JournalEntry);
      });
      onData(entries);
    },
    (err) => {
      console.error('Firestore entries subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Log individual AI interactions under `/users/{userId}/interactions/{interactionId}`
 */
export async function logUserInteraction(userId: string, record: InteractionRecord): Promise<void> {
  if (!userId) return;
  try {
    const cleanRecord = sanitizeForFirestore({
      ...record,
      userId
    });
    const recordRef = doc(db, 'users', userId, 'interactions', record.id);
    await setDoc(recordRef, cleanRecord);
  } catch (error) {
    console.warn('Failed to log interaction record to Firestore:', error);
  }
}
