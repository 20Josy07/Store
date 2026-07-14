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
    
    if (userSnapshot.exists()) {
      const data = userSnapshot.data();
      // If customNombre is provided and different, we update it
      if (customNombre && customNombre !== data.nombre) {
        await updateDoc(userDocRef, { nombre: customNombre });
        return {
          uid: user.uid,
          email: data.email || user.email || '',
          nombre: customNombre,
          esAdmin: !!data.esAdmin
        };
      }
      return {
        uid: user.uid,
        email: data.email || user.email || '',
        nombre: data.nombre || user.displayName || 'Client',
        esAdmin: !!data.esAdmin
      };
    } else {
      // Create profile
      const newProfile = {
        uid: user.uid,
        email: user.email || '',
        nombre: customNombre || user.displayName || 'Client',
        esAdmin: false
      };
      await setDoc(userDocRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `usuarios/${user.uid}`);
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
