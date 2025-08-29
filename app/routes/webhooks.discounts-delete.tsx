import type { ActionFunction } from "@remix-run/node";
import prisma from "~/db.server";
import { verifyShopifyWebhook } from "~/utils/verifyWebhook.server"; // create utils file

export const action: ActionFunction = async ({ request }) => {
  const env = process.env.SHOPIFY_API_SECRET;
  if(!env){
    throw new Error("Missing shopify secret key")
  }
  const { verified, body } = await verifyShopifyWebhook(request, env);

  if (!verified) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = JSON.parse(body);
    console.log("Discount delete webhook payload:", payload);

    // Shopify usually gives id like "gid://shopify/Discount/123456"
    const discountId = payload.admin_graphql_api_id || payload.id;
    if (!discountId) {
      return new Response("No discount id", { status: 400 });
    }

    const deleteId = discountId.split("/").pop(); 
    if(deleteId){
      await prisma.discountPayload.deleteMany({
        where: { id: deleteId},
      });
      await prisma.discount.deleteMany({
        where: { id: deleteId},
      });
    }
    console.log("discountId",discountId);
    console.log(`Deleted discount ${discountId} from DB`);
    return new Response("ok");
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Server error", { status: 500 });
  }
};
