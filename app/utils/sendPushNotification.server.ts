import admin from "./fcm.server";

export async function sendPushNotification(token: string, title: string, body: string, link?: string) {
  await admin.messaging().send({
    token,
    notification: { title, body },
    webpush: {
      fcmOptions: { link: link || "https://customizeproduc.myshopify.com/discounts" },
    },
  });
}
