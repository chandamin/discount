import crypto from "crypto";

export function verifyShopifyWebhook(request: Request, secret: string): Promise<{ verified: boolean; body: string }> {
  return new Promise(async (resolve) => {
    const body = await request.text();
    const hmac = request.headers.get("X-Shopify-Hmac-Sha256") || "";

    const digest = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("base64");

    resolve({ verified: crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac)), body });
  });
}
