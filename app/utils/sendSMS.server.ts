// app/utils/sendSMS.server.ts
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSMS(to: string, body: string) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
      body,
    });
    console.log(`📲 SMS sent to ${to}: SID ${message.sid}`);
    return message;
  } catch (err) {
    console.error(`❌ Failed to send SMS to ${to}`, err);
  }
}
