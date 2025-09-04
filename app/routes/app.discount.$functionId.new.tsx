//app.discount.$functionId.new.tsx  Discount create form
import { useEffect } from "react";
import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
// import { json, LoaderFunctionArgs } from "@remix-run/node";
import prisma from "~/db.server";
import { Page } from "@shopify/polaris";

import { DiscountForm} from "../components/DiscountForm/DiscountForm";
import {
  createCodeDiscount,
  createAutomaticDiscount,
} from "../models/discounts.server";
import { DiscountMethod } from "../types/types";

import { getProductsByIds } from "~/models/products.server";
import { getCollectionsByIds } from "~/models/collections.server";
import { Prisma } from "@prisma/client";
import { authenticate } from "~/shopify.server";


interface ActionData {
  errors?: {
    code?: string;
    message: string;
    field: string[];
  }[];
  success?: boolean;
  discounts?: { id: string; title: string; code?: string | null }[];   //Discounts Validation
}

interface LoaderData {
  collections: { id: string; title: string }[];
  products: { id: string; title: string }[];
  discounts: {
    id: string;
    title: string;
    code: string | null;
    method: string;
    startsAt: string;
    endsAt: string | null;
  }[];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // get authenticated shop from Shopify session
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // fetch only discounts for this shop
  const discounts = await prisma.discount.findMany({
    where: { shop },
    orderBy: { startsAt: "desc" },
  });

  // normalize discounts to match DiscountFormProps
  const normalizedDiscounts = discounts.map((d) => ({
    id: d.id,
    title: d.title,
    code: d.code ?? undefined, // null → undefined
  }));

  return json({
    discounts: normalizedDiscounts,
    collections: [],
    products: [],
  });
};
// [START build-the-ui.add-action]
export const action = async ({ params, request }: ActionFunctionArgs) => {

  const { session } = await authenticate.admin(request); //get authenticated shop
  const shop = session.shop;

  const { functionId } = params;
  const formData = await request.formData();
  const discountData = formData.get("discount");
  // if (!discountData || typeof discountData !== "string")
  //   throw new Error("No discount data provided");
  if (!discountData || typeof discountData !== "string") {
    return json<ActionData>(
      {
        errors: [
          { code: "invalid_input", message: "No discount data provided", field: ["discount"] },
        ],
      },
      { status: 400 }
    );
  }

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

  // if (!discountNodeId) {
  //   throw new Error("Failed to get Shopify discountNode id");
  // }
    if (!discountNodeId) {
      return json<ActionData>(
        {
          errors: [
            {
              code: "invalid_discount",
              message: "Failed to get Shopify discountNode id",
              field: ["discountId"],
            },
          ],
        },
        { status: 400 }
      );
    }

  // check if discount already exists with same title or code for this shop
  //try {
  //   await prisma.discount.create({
  //     data: {
  //       id: discountNodeId,
  //       shop,
  //       functionId: functionId ?? "",
  //       title,
  //       code,
  //       method,
  //       startsAt: new Date(startsAt),
  //       endsAt: endsAt ? new Date(endsAt) : null,
  //       productPercentage: parseFloat(configuration.cartLinePercentage) || 0,
  //       orderPercentage: parseFloat(configuration.orderPercentage) || 0,
  //       deliveryPercentage: parseFloat(configuration.deliveryPercentage) || 0,
  //       products: products as unknown as Prisma.InputJsonValue,
  //       collections: collections as unknown as Prisma.InputJsonValue,
  //     },
  //   });
  //} 
  try {
    await prisma.discount.upsert({
      where: { id: discountNodeId },
      update: {
        shop,
        functionId: functionId ?? "",
        title,
        code,
        method,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        productPercentage: parseFloat(configuration.cartLinePercentage) || 0,
        orderPercentage: parseFloat(configuration.orderPercentage) || 0,
        deliveryPercentage: parseFloat(configuration.deliveryPercentage) || 0,
        products: products as unknown as Prisma.InputJsonValue,
        collections: collections as unknown as Prisma.InputJsonValue,
      },
      create: {
        id: discountNodeId,
        shop,
        functionId: functionId ?? "",
        title,
        code,
        method,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        productPercentage: parseFloat(configuration.cartLinePercentage) || 0,
        orderPercentage: parseFloat(configuration.orderPercentage) || 0,
        deliveryPercentage: parseFloat(configuration.deliveryPercentage) || 0,
        products: products as unknown as Prisma.InputJsonValue,
        collections: collections as unknown as Prisma.InputJsonValue,
      },
    });
  } 
  catch (err: any) {
    if (err.code === "P2002") {
      return json<ActionData>(
        {
          errors: [
            {
              code: "duplicate",
              message: "Discount with this title or code already exists",
              field: ["title", "code"],
            },
          ],
        },
        { status: 400 }
      );
    }
    throw err;
  }



  if (result.errors?.length > 0) {
    return { errors: result.errors };
  }
  // return { success: true };
  return json<ActionData>({ success: true });
};
// [END build-the-ui.add-action]


// interface LoaderData {

//   collections: { id: string; title: string }[];
//   products: { id: string; title: string }[];
// }

export default function VolumeNew() {
  const actionData = useActionData<ActionData>();
  const { collections, products, discounts } = useLoaderData<LoaderData>();
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
        discounts={discounts} 
      />
    </Page>
  );
}
