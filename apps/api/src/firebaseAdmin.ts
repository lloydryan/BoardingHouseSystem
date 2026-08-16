import admin from "firebase-admin";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function getCredential() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    return cert(JSON.parse(serviceAccountJson));
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    return cert(JSON.parse(readFileSync(resolve(serviceAccountPath), "utf8")));
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
    ...(credential ? { credential } : {}),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "boarding-housems.firebasestorage.app"
  });
}

export function getDb() {
  const databaseId = process.env.FIRESTORE_DATABASE_ID;
  return databaseId ? getFirestore(getFirebaseAdminApp(), databaseId) : getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function isFirestoreEnabled() {
  return process.env.BH_DATA_SOURCE === "firestore";
}

export { admin };
