//app.discount.$functionId.new.tsx  Discount create form
import { useEffect } from "react";
import { ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import prisma from "~/db.server";
import { Page } from "@shopify/polaris";

import { DiscountForm } from "../components/DiscountForm/DiscountForm";
import {
  createCodeDiscount,
  createAutomaticDiscount,
} from "../models/discounts.server";
import { DiscountMethod } from "../types/types";
// import { returnToDiscounts } from "../utils/navigation";
// import { useAppBridge } from "@shopify/app-bridge-react";
// import { Redirect } from "@shopify/app-bridge/actions";
import { getProductsByIds } from "~/models/products.server";
import { getCollectionsByIds } from "~/models/collections.server";
import { Prisma } from "@prisma/client";

export const loader = async () => {
  // Initially load with empty collections and products since none are selected yet
  return { collections: [], products: [] };
};

// [START build-the-ui.add-action]
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { functionId } = params;
  const formData = await request.formData();
  const discountData = formData.get("discount");
  if (!discountData || typeof discountData !== "string")
    throw new Error("No discount data provided");

  const {
    title,
    method,
    code,
    combinesWith,
    usageLimit,
    appliesOncePerCustomer,
    startsAt,
    endsAt,
    discountClasses,
    configuration,
  } = JSON.parse(discountData);

  const baseDiscount = {
    functionId,
    title,
    combinesWith,
    discountClasses,
    startsAt: new Date(startsAt),
    endsAt: endsAt && new Date(endsAt),
  };

  let result;

  if (method === DiscountMethod.Code) {
    result = await createCodeDiscount(
      request,
      baseDiscount,
      code,
      usageLimit,
      appliesOncePerCustomer,
      {
        cartLinePercentage: parseFloat(configuration.cartLinePercentage),
        orderPercentage: parseFloat(configuration.orderPercentage),
        deliveryPercentage: parseFloat(configuration.deliveryPercentage),
        collectionIds: configuration.collectionIds || [],
        productIds: configuration.productIds || [],
      },
    );
  } else {
    result = await createAutomaticDiscount(request, baseDiscount, {
      cartLinePercentage: parseFloat(configuration.cartLinePercentage),
      orderPercentage: parseFloat(configuration.orderPercentage),
      deliveryPercentage: parseFloat(configuration.deliveryPercentage),
      collectionIds: configuration.collectionIds || [],
      productIds: configuration.productIds || [],
    });
  }

const products = await getProductsByIds(request, configuration.productIds || []);
const collections = await getCollectionsByIds(request, configuration.collectionIds || []);

const rawDiscountId = result.discountId;
const discountNodeId = rawDiscountId
  ? rawDiscountId.split("/").pop() // takes "1234567890"
  : null;

if (!discountNodeId) {
  throw new Error("Failed to get Shopify discountNode id");
}

await prisma.discount.create({
  data: {
    id: discountNodeId, // Shopify discountNode.id stored as our primary key
    shop: process.env.SHOPIFY_SHOP!, // or session
    functionId: functionId ?? "",
    title,
    code,
    method,
    startsAt: new Date(startsAt),
    endsAt: endsAt ? new Date(endsAt): null,
    productPercentage: parseFloat(configuration.cartLinePercentage) || 0,
    orderPercentage: parseFloat(configuration.orderPercentage) || 0,
    deliveryPercentage: parseFloat(configuration.deliveryPercentage) || 0,
    products: products as unknown as Prisma.InputJsonValue,
    collections: collections as unknown as Prisma.InputJsonValue,
  },
});

  if (result.errors?.length > 0) {
    return { errors: result.errors };
  }
  return { success: true };
};
// [END build-the-ui.add-action]

interface ActionData {
  errors?: {
    code?: string;
    message: string;
    field: string[];
  }[];
  success?: boolean;
}

interface LoaderData {
  collections: { id: string; title: string }[];
  products: { id: string; title: string }[];
}

export default function VolumeNew() {
  const actionData = useActionData<ActionData>();
  const { collections, products } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isLoading = navigation.state === "submitting";
  const submitErrors = actionData?.errors || [];

  useEffect(() => {
    if (actionData?.success) {
      navigate("/app/discounts");
    }
  }, [actionData, navigate]);

  // if (actionData?.success) {
  //   navigate("/app/discounts");
  // }

  const initialData = {
    title: "",
    method: DiscountMethod.Code,
    code: "",
    discountClasses: [],
    combinesWith: {
      orderDiscounts: false,
      productDiscounts: false,
      shippingDiscounts: false,
    },
    usageLimit: null,
    appliesOncePerCustomer: false,
    startsAt: new Date(),
    endsAt: null,
    configuration: {
      cartLinePercentage: "0",
      orderPercentage: "0",
      deliveryPercentage: "0",
      collectionIds: [],
      productIds: [],
    },
  };

  return (
    <Page>
      <ui-title-bar title="Create Discount">
        {/* <button variant="breadcrumb" onClick={returnToDiscounts}>
          Discounts
        </button> */}
      </ui-title-bar>

      <DiscountForm
        initialData={initialData}
        collections={collections}
        products={products}
        isLoading={isLoading}
        submitErrors={submitErrors}
        success={actionData?.success}
      />
    </Page>
  );
}
