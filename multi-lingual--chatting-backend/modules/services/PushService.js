import webpush from "web-push";
import { User } from "../models/User.js";

const configureWebPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(
    process.env.PUSH_CONTACT_EMAIL || "mailto:admin@example.com",
    publicKey,
    privateKey,
  );

  return true;
};

const canSendPush = configureWebPush();

const isValidSubscription = (subscription) =>
  subscription?.endpoint && subscription?.keys?.p256dh && subscription?.keys?.auth;

const sendPushToUser = async (userId, payload) => {
  if (!canSendPush) {
    return;
  }

  const user = await User.findById(userId).select("push_subscriptions");
  if (!user || !Array.isArray(user.push_subscriptions)) {
    return;
  }

  const validSubscriptions = [];

  for (const subscription of user.push_subscriptions) {
    if (!isValidSubscription(subscription)) {
      continue;
    }

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      validSubscriptions.push(subscription);
    } catch (error) {
      const status = error?.statusCode || error?.statusCode === 0 ? error.statusCode : null;
      if (status && status !== 404 && status !== 410) {
        validSubscriptions.push(subscription);
      }
    }
  }

  if (validSubscriptions.length !== user.push_subscriptions.length) {
    user.push_subscriptions = validSubscriptions;
    await user.save();
  }
};

export { sendPushToUser };
