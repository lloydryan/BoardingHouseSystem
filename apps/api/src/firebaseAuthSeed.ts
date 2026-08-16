import "dotenv/config";
import { getDb, getFirebaseAuth } from "./firebaseAdmin.js";
import { loadSeedFromFirestore, saveSeedDoc } from "./firestoreStore.js";
import { seed } from "./seed.js";

await loadSeedFromFirestore();

const auth = getFirebaseAuth();

async function ensureAuthUser(user: (typeof seed.users)[number], password: string) {
  try {
    await auth.updateUser(user.id, {
      email: user.email,
      password,
      displayName: user.fullName,
      disabled: false
    });
    return user.id;
  } catch (error: any) {
    if (error?.code !== "auth/user-not-found") throw error;
  }

  try {
    const existing = await auth.getUserByEmail(user.email);
    await auth.updateUser(existing.uid, {
      password,
      displayName: user.fullName,
      disabled: false
    });
    return existing.uid;
  } catch (error: any) {
    if (error?.code !== "auth/user-not-found") throw error;
  }

  const created = await auth.createUser({
    uid: user.id,
    email: user.email,
    password,
    displayName: user.fullName,
    disabled: false
  });
  return created.uid;
}

try {
  for (const user of seed.users) {
    const password = user.demoPassword ?? "password123";
    const claims = {
      role: user.role,
      ...(user.landlordId ? { landlordId: user.landlordId } : {})
    };

    const uid = await ensureAuthUser(user, password);
    await auth.setCustomUserClaims(uid, claims);
    await saveSeedDoc("users", uid, { ...user, id: uid });
    if (uid !== user.id) await getDb().collection("users").doc(user.id).delete();
    console.log(`Firebase Auth user ready: ${user.email} (${user.role})`);
  }
} catch (error: any) {
  console.error("Firebase Auth seed failed.");
  console.error(error?.message ?? String(error));
  console.error("Enable Firebase Console > Authentication > Sign-in method > Email/Password, then run this command again.");
  process.exitCode = 1;
}
