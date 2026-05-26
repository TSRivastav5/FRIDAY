import webpush from "web-push";
import User from "../models/User.js";

// Initialize VAPID credentials once on import
// Auto-prepend mailto: if the env var was set as a bare email address
const rawEmail = process.env.VAPID_EMAIL || "admin@friday.ai";
const vapidSubject = rawEmail.startsWith("mailto:") || rawEmail.startsWith("https://")
  ? rawEmail
  : `mailto:${rawEmail}`;

webpush.setVapidDetails(
  vapidSubject,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to all active subscriptions belonging to a user.
 * Silently removes stale/expired subscriptions (410 Gone).
 */
export async function sendPushToUser(userId, { title, body, icon, tag, url }) {
  try {
    const user = await User.findById(userId).select("settings.pushSubscriptions");
    const subs = user?.settings?.pushSubscriptions || [];
    if (subs.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/logo.svg",
      tag: tag || "friday",
      url: url || "/",
    });

    const results = await Promise.allSettled(
      subs.map((sub) => webpush.sendNotification(sub, payload))
    );

    // Clean up expired subscriptions (status 410 = Gone)
    const expiredEndpoints = [];
    results.forEach((result, idx) => {
      if (
        result.status === "rejected" &&
        result.reason?.statusCode === 410
      ) {
        expiredEndpoints.push(subs[idx].endpoint);
      }
    });

    if (expiredEndpoints.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: {
          "settings.pushSubscriptions": {
            endpoint: { $in: expiredEndpoints },
          },
        },
      });
    }
  } catch (err) {
    // Non-fatal — push failures should never break the main API response
    console.error("⚠️ Push notification error:", err.message);
  }
}

export default webpush;
