import { Router } from "express";
import { auth } from "../middleware/auth.js";
import User from "../models/User.js";
import webpush from "../services/push.service.js";

const router = Router();
router.use(auth);

/**
 * GET /api/push/vapid-public-key
 * Returns the VAPID public key the browser needs to create a subscription.
 */
router.get("/vapid-public-key", (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({ error: "Push notifications are not configured on this server." });
  }
  res.json({ publicKey: key });
});

/**
 * POST /api/push/subscribe
 * Body: { subscription: PushSubscriptionJSON }
 * Stores the browser push subscription in the user's document.
 * Idempotent — won't duplicate if the same endpoint is re-sent.
 */
router.post("/subscribe", async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: "Invalid push subscription object" });
    }

    // Upsert: add only if endpoint doesn't already exist
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { "settings.pushSubscriptions": subscription },
    });

    // Send a welcome notification
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: "🔔 FinVault Alerts Active",
          body: "You will now receive real-time salary and expense notifications.",
          icon: "/icon-192.png",
          tag: "finvault-welcome",
          url: "/",
        })
      );
    } catch (_) {
      // Non-fatal — welcome notification failure is OK
    }

    res.json({ success: true, message: "Subscribed to push notifications" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/push/unsubscribe
 * Body: { endpoint: string }
 * Removes the subscription from the user's document.
 */
router.post("/unsubscribe", async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint is required" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { "settings.pushSubscriptions": { endpoint } },
    });

    res.json({ success: true, message: "Unsubscribed from push notifications" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
