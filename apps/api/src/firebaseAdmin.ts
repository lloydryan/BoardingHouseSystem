import admin from "firebase-admin";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getCredential() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    return cert(JSON.parse(serviceAccountJson));
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return applicationDefault();
  }

  return undefined;
}

export function getFirebaseAdminApp() {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const projectId = process.env.FIREBASE_PROJECT_ID ?? "boarding-housems";
  const credential = getCredential();

  return initializeApp({
    projectId,
    credential,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "boarding-housems.firebasestorage.app"
  });
}

export function getDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function isFirestoreEnabled() {
  return process.env.BH_DATA_SOURCE === "firestore";
}

export { admin };
