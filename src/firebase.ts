/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';
import { 
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  limit,
  orderBy,
  getDocFromServer,
  runTransaction
} from 'firebase/firestore';

import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard connection test (Mandatory guideline constraint)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Error Handling (Mandatory guideline constraint)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User bootstrapper to save profile in Firestore on login
export async function syncUserProfile(user: User, customNombre?: string): Promise<{ uid: string; email: string; nombre: string; esAdmin: boolean }> {
  const userDocRef = doc(db, 'usuarios', user.uid);
  try {
    const userSnapshot = await getDoc(userDocRef);
    const email = user.email || '';
    
    if (userSnapshot.exists()) {
      const data = userSnapshot.data();
      const currentEsAdmin = !!data.esAdmin;
      
      // If customNombre is provided and different, we update the name in Firestore
      if (customNombre && customNombre !== data.nombre) {
        try {
          await setDoc(userDocRef, { nombre: customNombre }, { merge: true });
        } catch (writeErr) {
          console.warn("Non-blocking warning: Failed to update customName in Firestore:", writeErr);
        }
        return {
          uid: user.uid,
          email: data.email || email,
          nombre: customNombre,
          esAdmin: currentEsAdmin
        };
      }
      return {
        uid: user.uid,
        email: data.email || email,
        nombre: data.nombre || user.displayName || 'Client',
        esAdmin: currentEsAdmin
      };
    } else {
      // Create profile
      const isDefaultAdmin = email.toLowerCase() === 'josyacosta07@gmail.com';
      const newProfile = {
        uid: user.uid,
        email: email,
        nombre: customNombre || user.displayName || 'Client',
        esAdmin: isDefaultAdmin
      };
      try {
        await setDoc(userDocRef, newProfile, { merge: true });
      } catch (writeErr) {
        console.warn("Non-blocking warning: Failed to save user profile in Firestore:", writeErr);
      }
      return newProfile;
    }
  } catch (error) {
    console.warn("Error in syncUserProfile (falling back to client memory profile):", error);
    // Return a local fallback profile instead of throwing, so login/signup NEVER fail!
    return {
      uid: user.uid,
      email: user.email || '',
      nombre: customNombre || user.displayName || 'Client',
      esAdmin: (user.email || '').toLowerCase() === 'josyacosta07@gmail.com'
    };
  }
}

export { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  limit, 
  orderBy,
  runTransaction,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
};
