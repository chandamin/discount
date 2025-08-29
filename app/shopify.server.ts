import "@shopify/shopify-app-remix/adapters/node";
import { restResources} from "@shopify/shopify-api/rest/admin/2023-07";
import { shopifyApi } from '@shopify/shopify-api';
import {
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  ApiVersion,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";

import prisma from "./db.server";

const rawShopifyApi = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: ApiVersion.Unstable,
  isEmbeddedApp: true, //  REQUIRED
  hostName: process.env.SHOPIFY_APP_URL!.replace(/^https?:\/\//, ""), //  REQUIRED
  restResources,
});

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.Unstable,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    DISCOUNTS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/discounts-update",
    },
    DISCOUNTS_DELETE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/discounts-delete",
    }

  },
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });

      const assetClient = new rawShopifyApi.rest.Asset({ session });
      try {
      await assetClient.Asset.create({
        session,
        key: "snippets/firebase-config.liquid",
        value: `
          {% assign firebase_api_key = "${process.env.FIREBASE_PUBLIC_API_KEY}" %}
          {% assign firebase_auth_domain = "${process.env.FIREBASE_AUTH_DOMAIN}" %}
          {% assign firebase_project_id = "${process.env.FIREBASE_PROJECT_ID}" %}
          {% assign firebase_messaging_sender_id = "${process.env.FIREBASE_MESSAGING_SENDER_ID}" %}
          {% assign firebase_app_id = "${process.env.FIREBASE_APP_ID}" %}
          {% assign firebase_vapid_key = "${process.env.FIREBASE_VAPID_KEY}" %}
        `
      });

      console.log("Firebase config snippet created in theme.");
    } catch (error) {
      console.error("Failed to upload firebase-config.liquid snippet:", error);
    }
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.Unstable;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
