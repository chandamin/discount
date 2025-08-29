import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getMessaging, getToken, deleteToken } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

console.log("subscribe.js loaded");

const firebaseConfig = {
  apiKey: "AIzaSyBasB-CCcs1xGiWD76_oZTOE0mhBTZMdfY",
  authDomain: "variant-discounts.firebaseapp.com",
  projectId: "variant-discounts",
  storageBucket: "variant-discounts.firebasestorage.app",
  messagingSenderId: "188014171258",
  appId: "1:188014171258:web:6249cd3619a33142d297c3",
  measurementId: "G-PV99JF12V2"
};


const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const serviceWorkerUrl = "/apps/popup/fcm-sw";

const VAPID_KEY = "BLQc1ueaeH6o2JKTATJVqRSNP5IW73dEvy1YXnQcs4fZdEdx0NM10dQjhm7hO5qHacX4TnM-qBeS9hZuvmZjcLU";
const LS_KEY = "fcm_token";

// ---------- small helpers ----------
const getStoredToken = () => {
  try { return localStorage.getItem(LS_KEY); } catch { return null; }
};
const setStoredToken = (t) => {
  try { localStorage.setItem(LS_KEY, t); } catch {}
};
const clearStoredToken = () => {
  try { localStorage.removeItem(LS_KEY); } catch {}
};

async function syncSave(token) {
  try {
    const res = await fetch("/apps/popup/fcm-sw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      console.error("syncSave failed:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("syncSave error:", e);
    return false;
  }
}

async function syncDelete(token) {
  if (!token) return false;
  try {
    const res = await fetch("/apps/popup/fcm-sw", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      console.error("syncDelete failed:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("syncDelete error:", e);
    return false;
  }
}

async function waitForServiceWorkerActivation(reg) {
  if (reg?.active) return;
  const sw = reg?.installing || reg?.waiting;
  if (!sw) return;
  await new Promise((resolve) => {
    const onChange = () => {
      if (sw.state === "activated") {
        sw.removeEventListener("statechange", onChange);
        resolve();
      }
    };
    sw.addEventListener("statechange", onChange);
  });
}

// ---------- core: ensure DB is in sync on every load ----------
export async function ensureWebPushSyncedOnLoad() {
  const stored = getStoredToken();
  const perm = Notification.permission; // "granted" | "denied" | "default"
  console.log("[WebPush] onLoad: permission =", perm, "stored =", !!stored);

  // If user has BLOCKED notifications, delete any stored token from DB
  if (perm === "denied") {
    if (stored) {
      const ok = await syncDelete(stored);
      if (ok) {
        console.log("[WebPush] permission denied → deleted stored token from DB");
        clearStoredToken();
      } else {
        console.warn("[WebPush] permission denied → failed to delete stored token from DB");
      }
    }
    return { success: false, reason: "permission_denied_cleaned" };
  }

  // For granted/default, try to get/refresh the token & reconcile DB
  try {
    let reg = await navigator.serviceWorker.getRegistration(serviceWorkerUrl);
    if (!reg) {
      reg = await navigator.serviceWorker.register(serviceWorkerUrl);
    }
    await waitForServiceWorkerActivation(reg);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: reg,
    });

    if (!token) {
      // We couldn't obtain a token; if we previously stored one, it's now stale—clean DB
      if (stored) {
        const ok = await syncDelete(stored);
        if (ok) {
          console.log("[WebPush] getToken returned null → deleted stale token from DB");
          clearStoredToken();
        } else {
          console.warn("[WebPush] getToken null → failed to delete stale token from DB");
        }
      }
      return { success: false, reason: "no_token" };
    }

    // We have a token: if it changed, delete old & save new; otherwise just ensure it exists in DB
    if (stored && stored !== token) {
      await syncDelete(stored);
    }
    const saved = await syncSave(token);
    if (saved) setStoredToken(token);

    return saved
      ? { success: true, token }
      : { success: false, reason: "backend_error" };
  } catch (e) {
    console.error("[WebPush] ensure sync error:", e);
    // If we crash while having a stored token but no permission, attempt cleanup anyway
    if (perm !== "granted") {
      const stored2 = getStoredToken();
      if (stored2) {
        await syncDelete(stored2);
        clearStoredToken();
      }
    }
    return { success: false, reason: "unexpected_error", error: String(e?.message || e) };
  }
}

// ---------- subscribe on demand (still returns structured result) ----------
export async function requestNotificationPermission() {
  // First do a reconciliation pass, in case user previously blocked
  const recon = await ensureWebPushSyncedOnLoad();
  if (recon.success || Notification.permission === "denied") return recon;

  // If permission is default, ask now (auto-subscribe use case)
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      // If the user just denied, clean up any stored token
      const stored = getStoredToken();
      if (stored) {
        await syncDelete(stored);
        clearStoredToken();
      }
      return { success: false, reason: "permission_denied" };
    }
  } catch (e) {
    return { success: false, reason: "permission_request_failed", error: String(e?.message || e) };
  }

  // With permission granted now, ensure again (this will register SW, get token, save & store)
  return ensureWebPushSyncedOnLoad();
}

// ---------- explicit unsubscribe from your UI (if you add a button) ----------
export async function unsubscribeNotifications() {
  const stored = getStoredToken();

  try {
    const reg = await navigator.serviceWorker.getRegistration(serviceWorkerUrl);
    // Try to get a live token first (if permission is still granted)
    let liveToken = null;
    if (Notification.permission === "granted" && reg) {
      try {
        liveToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: reg,
        });
      } catch {}
    }

    // Delete from Firebase if we can
    try {
      await deleteToken(messaging);
    } catch (e) {
      // ignore; token may already be invalid
    }

    // Prefer deleting the live token in DB; otherwise fall back to stored token
    const toDelete = liveToken || stored;
    if (toDelete) {
      const ok = await syncDelete(toDelete);
      if (ok) {
        clearStoredToken();
        return { success: true, removedFromDB: true };
      }
      return { success: false, reason: "backend_delete_failed" };
    }

    return { success: false, reason: "no_token" };
  } catch (e) {
    return { success: false, reason: "unexpected_error", error: String(e?.message || e) };
  }
}

// ---------- (optional) react immediately when user flips permission while page is open ----------
export async function watchPermissionChanges() {
  try {
    if (!("permissions" in navigator) || !navigator.permissions?.query) return;
    const status = await navigator.permissions.query({ name: "notifications" });
    status.onchange = async () => {
      console.log("[WebPush] permission changed:", status.state);
      if (status.state === "denied") {
        const stored = getStoredToken();
        if (stored) {
          const ok = await syncDelete(stored);
          if (ok) clearStoredToken();
        }
      } else if (status.state === "granted") {
        // try to restore subscription/DB if needed
        await ensureWebPushSyncedOnLoad();
      }
    };
  } catch {}
}




