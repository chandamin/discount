// // // app/routes/webhooks/discounts-create.tsx

// import type { ActionFunctionArgs } from "@remix-run/node";
// import prisma from "~/db.server";
// import { authenticate } from "~/shopify.server";
// import { sendPushNotification } from "~/utils/sendPushNotification.server";

// export const action = async ({ request }: ActionFunctionArgs) => {
//   console.log("📩 Webhook received: discounts/create");

//   try {
//     // Authenticate and parse the Shopify webhook
//     const { payload } = await authenticate.webhook(request);
  
//     if (!payload || !payload.admin_graphql_api_id) {
//       console.error("Invalid payload: missing admin_graphql_api_id", payload);
//       return new Response("Invalid webhook payload", { status: 400 });
//     }

//     // Extract useful data
//     const rawId = payload.admin_graphql_api_id;
//     const id = rawId.split("/").pop(); // e.g. gid://shopify/DiscountNode/1234567890 → "1234567890"

//     const title = payload.title || "Untitled Discount";
//     const status = payload.status || "ACTIVE";
//     const updatedAt = payload.updated_at || payload.updatedAt || new Date().toISOString();
//      console.log(payload,'payload')
//     // Save to DB using upsert (update if exists, create if not)
//     await prisma.discountPayload.upsert({
//       where: { id },
//       update: {
//         title,
//         status,
//         updatedAt: new Date(updatedAt),
//       },
//       create: {
//         id,
//         title,
//         status,
//         updatedAt: new Date(updatedAt),
//       },
//     });
//      console.log(payload,'payloaddddd')


//     const tokens = await prisma.fcmToken.findMany();
//     for (const t of tokens) {
//       await sendPushNotification(
//         t.token,
//         "New Discount Live 🎉",
//         `Discount: ${title}`,
//         "https://customizeproduc.myshopify.com/discounts"
//       );
//     }
  
//     console.log(` Stored discount with ID ${id}:`, title);

//     return new Response("Webhook processed", { status: 200 });
//   } catch (error) {
//     console.error(" Webhook processing error:", error);
//     return new Response(
//       JSON.stringify({ error: "Error processing discounts/create webhook" }),
//       { status: 500, headers: { "Content-Type": "application/json" } }
//     );
//   }
// };
// // // app/routes/webhooks/discounts-create.tsx




