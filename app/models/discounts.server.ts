import {
  CREATE_CODE_DISCOUNT,
  CREATE_AUTOMATIC_DISCOUNT,
  UPDATE_CODE_DISCOUNT,
  UPDATE_AUTOMATIC_DISCOUNT,
  GET_DISCOUNT,
  GET_ALL_DISCOUNT,
  DISCOUNT_CODE_ACTIVATE,
  DISCOUNT_CODE_DEACTIVATE,
  DISCOUNT_AUTOMATIC_ACTIVATE,
  DISCOUNT_AUTOMATIC_DEACTIVATE,
} from "../graphql/discounts";
import { authenticate } from "../shopify.server";
import type { DiscountClass } from "../types/admin.types";
import { DiscountMethod } from "../types/types";
import { Prisma } from "@prisma/client";
import { GraphQLClient } from "graphql-request";


type DiscountNode = {
  id: string;
  discount?: {
    title?: string;
    status?: string;
    __typename?: string;
    combinesWith?: string;
    asyncUsageCount?: number;
  }
}
interface BaseDiscount {
  functionId?: string;
  title: string;
  discountClasses: DiscountClass[];
  combinesWith: {
    orderDiscounts: boolean;
    productDiscounts: boolean;
    shippingDiscounts: boolean;
  };
  startsAt: Date;
  endsAt: Date | null;
}


interface DiscountConfiguration {
  cartLinePercentage: number;
  orderPercentage: number;
  deliveryPercentage: number;
  collectionIds?: string[];
  productIds?: string[];
}

interface UserError {
  code?: string;
  message: string;
  field?: string[];
}

// ShopifyCustomerQuery
interface ShopifyCustomerQueryResponse {
  customers: {
    edges: {
      node: {
        email: string | null;
      };
    }[];
  };
}

export async function createCodeDiscount(
  request: Request,
  baseDiscount: BaseDiscount,
  code: string,
  usageLimit: number | null,
  appliesOncePerCustomer: boolean,
  configuration: DiscountConfiguration,
) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(CREATE_CODE_DISCOUNT, {
    variables: {
      codeAppDiscount: {
        ...baseDiscount,
        title: code,
        code,
        usageLimit,
        appliesOncePerCustomer,
        functionId: baseDiscount.functionId, // Make sure this is present!
        combinesWith: baseDiscount.combinesWith, // Must be present and valid
        startsAt: baseDiscount.startsAt,
        metafields: [
          {
            namespace: "$app:example-discounts--ui-extension",
            key: "function-configuration",
            type: "json",
            value: JSON.stringify({
              cartLinePercentage: configuration.cartLinePercentage,
              orderPercentage: configuration.orderPercentage,
              deliveryPercentage: configuration.deliveryPercentage,
              collectionIds: configuration.collectionIds || [],
              productIds: configuration.productIds || [],
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();
  const createdDiscount = responseJson.data.discountCreate?.codeAppDiscount;
  

   if (!createdDiscount || responseJson.data.discountCreate?.userErrors.length) {
    return {
      discountId: null,
      errors: responseJson.data.discountCreate?.userErrors as UserError[],
    };
  }

  console.log()

  return {
   discountId: createdDiscount.discountId,
   errors: responseJson.data.discountCreate?.userErrors as UserError[],
  };
}

export async function createAutomaticDiscount(
  request: Request,
  baseDiscount: BaseDiscount,
  configuration: DiscountConfiguration,
) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(CREATE_AUTOMATIC_DISCOUNT, {
    variables: {
      discount: {
        ...baseDiscount,
        metafields: [
          {
            namespace: "$app:example-discounts--ui-extension",
            key: "function-configuration",
            type: "json",
            value: JSON.stringify({
              cartLinePercentage: configuration.cartLinePercentage,
              orderPercentage: configuration.orderPercentage,
              deliveryPercentage: configuration.deliveryPercentage,
              collectionIds: configuration.collectionIds || [],
              productIds: configuration.productIds || [],
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();
  const createdDiscount = responseJson.data.discountCreate?.automaticAppDiscount;

  return {
    errors: responseJson.data.discountCreate?.userErrors as UserError[],
    discountId: createdDiscount.discountId,
  };
}

export async function updateCodeDiscount(
  request: Request,
  id: string,
  baseDiscount: BaseDiscount,
  code: string,
  usageLimit: number | null,
  appliesOncePerCustomer: boolean,
  configuration: {
    metafieldId: string;
    cartLinePercentage: number;
    orderPercentage: number;
    deliveryPercentage: number;
    collectionIds?: string[];
    productIds?: string[];
  },
) {
  const { admin,session } = await authenticate.admin(request);
  const discountId = id.includes("gid://")
    ? id
    : `gid://shopify/DiscountCodeNode/${id}`;

  const response = await admin.graphql(UPDATE_CODE_DISCOUNT, {
    variables: {
      id: discountId,
      discount: {
        ...baseDiscount,
        title: code,
        code,
        usageLimit,
        appliesOncePerCustomer,
        metafields: [
          {
            id: configuration.metafieldId,
            value: JSON.stringify({
              cartLinePercentage: configuration.cartLinePercentage,
              orderPercentage: configuration.orderPercentage,
              deliveryPercentage: configuration.deliveryPercentage,
              collectionIds:
                configuration.collectionIds?.map((id) =>
                  id.includes("gid://") ? id : `gid://shopify/Collection/${id}`,
                ) || [],
              productIds:
                configuration.productIds?.map((id) =>
                  id.includes("gid://") ? id : `gid://shopify/Product/${id}`,
                ) || [],
            }),
          },
        ],
      },
    },
  });

  // const responseJson = await response.json();
  // return {
  //   errors: responseJson.data.discountUpdate?.userErrors as UserError[],
  // };
  const responseJson = await response.json();
  const errors = responseJson.data.discountUpdate?.userErrors as UserError[];

  if(errors?.length){
    return {errors};
  }

  await prisma.discount.update({
    where: { id },
    data: {
      shop: session.shop, // save shop reference
      functionId: baseDiscount.functionId!,
      title: baseDiscount.title,
      code,
      method: "CODE",
      startsAt: new Date(baseDiscount.startsAt),
      endsAt: baseDiscount.endsAt ? new Date(baseDiscount.endsAt) : null,
      productPercentage: configuration.cartLinePercentage,
      orderPercentage: configuration.orderPercentage,
      deliveryPercentage: configuration.deliveryPercentage,
      products: (configuration.productIds || []) as unknown as Prisma.InputJsonValue,
      collections: (configuration.collectionIds || []) as unknown as Prisma.InputJsonValue,
    },
  });

  return { errors: [] };
}

export async function updateAutomaticDiscount(
  request: Request,
  id: string,
  baseDiscount: BaseDiscount,
  configuration: {
    metafieldId: string;
    cartLinePercentage: number;
    orderPercentage: number;
    deliveryPercentage: number;
    collectionIds?: string[];
    productIds?: string[];
  },
){
  const { admin, session } = await authenticate.admin(request);
  const discountId = id.includes("gid://")
    ? id
    : `gid://shopify/DiscountAutomaticApp/${id}`;

  const response = await admin.graphql(UPDATE_AUTOMATIC_DISCOUNT, {
    variables: {
      id: discountId,
      discount: {
        ...baseDiscount,
        metafields: [
          {
            id: configuration.metafieldId,
            value: JSON.stringify({
              cartLinePercentage: configuration.cartLinePercentage,
              orderPercentage: configuration.orderPercentage,
              deliveryPercentage: configuration.deliveryPercentage,
              collectionIds:
                configuration.collectionIds?.map((id) =>
                  id.includes("gid://") ? id : `gid://shopify/Collection/${id}`,
                ) || [],
              productIds:
              configuration.productIds?.map((id) =>
                id.includes("gid://") ? id : `gid://shopify/Product/${id}`,
              ) || [],
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();
  // return {
  //   errors: responseJson.data.discountUpdate?.userErrors as UserError[],
  // };
  const errors = responseJson.data.discountUpdate?.userErrors as UserError[];
  if(errors?.length){
    return {errors}
  }

  await prisma.discount.update({
    where: { id },
    data: {
      shop: session.shop,
      functionId: baseDiscount.functionId!,
      title: baseDiscount.title,
      code: null, // no code for automatic discounts
      method: "AUTOMATIC",
      startsAt: new Date(baseDiscount.startsAt),
      endsAt: baseDiscount.endsAt ? new Date(baseDiscount.endsAt) : null,
      productPercentage: configuration.cartLinePercentage,
      orderPercentage: configuration.orderPercentage,
      deliveryPercentage: configuration.deliveryPercentage,
      products: (configuration.productIds || []) as unknown as Prisma.InputJsonValue,
      collections: (configuration.collectionIds || []) as unknown as Prisma.InputJsonValue,
    },
  });

  return { errors: [] };
}

// Delete Discount
export async function deleteDiscount(request: Request, id: string, type: "code" | "automatic") {
  const { admin } = await authenticate.admin(request);

  try {
    // Shopify API: Delete Discount
    if (type === "code") {
      await admin.graphql(`
        mutation discountCodeDelete($id: ID!) {
          discountCodeDelete(id: $id) {
            deletedCodeDiscountId
            userErrors {
              field
              message
            }
          }
        }
      `, { variables: {id} });
    } else {
      await admin.graphql(`
        mutation discountAutomaticDelete($id: ID!) {
          discountAutomaticDelete(id: $id) {
            deletedAutomaticDiscountId
            userErrors {
              field
              message
            }
          }
        }
      `, { variables: {id} });
    }
    console.log("id",id);
    const numericId = id.split("/").pop();
    console.log("NumericId", numericId);
    // Delete from DB
    await prisma.discountPayload.deleteMany({ where: { id: numericId } });
    await prisma.discount.deleteMany({ where: { id: numericId }});

    return { success: true };
  } catch (error) {
    console.error("Failed to delete discount:", error);
    throw new Error("Failed to delete discount");
  }
}



export async function getDiscount(request: Request, id: string) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(GET_DISCOUNT, {
    variables: {
      id: `gid://shopify/DiscountNode/${id}`,
    },
  });

  const responseJson = await response.json();
  if (
    !responseJson.data.discountNode ||
    !responseJson.data.discountNode.discount
  ) {
    return { discount: null };
  }
  const status = responseJson.data.discountNode.discount.status;
  const method =
    responseJson.data.discountNode.discount.__typename === "DiscountCodeApp"
      ? DiscountMethod.Code
      : DiscountMethod.Automatic;

  const {
    title,
    codes,
    combinesWith,
    usageLimit,
    appliesOncePerCustomer,
    startsAt,
    endsAt,
    discountClasses,
  } = responseJson.data.discountNode.discount;
  const configuration = JSON.parse(
    responseJson.data.discountNode.configurationField.value,
  );

  return {
    discount: {
      id: responseJson.data.discountNode.id,
      status,
      title,
      method,
      code: codes?.nodes[0]?.code ?? "",
      combinesWith,
      discountClasses,
      usageLimit: usageLimit ?? null,
      appliesOncePerCustomer: appliesOncePerCustomer ?? false,
      startsAt,
      endsAt,
      configuration: {
        ...configuration,
        metafieldId: responseJson.data.discountNode.configurationField.id,
      },
    },
  };
}

//View All Discounts

export async function getAllDiscounts(request: Request,after?: string | null, first = 10){
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(GET_ALL_DISCOUNT, {
    variables: {
      first,
      after
    },
  });

  const responseJson = await response.json();

  if (
    !responseJson.data ||
    !responseJson.data.discountNodes ||
    !responseJson.data.discountNodes.nodes
  ) {
    return { discounts: [], hasNextPage: false,hasPreviousPage: false,startCursor:null, endCursor: null };
  }

  const { nodes, pageInfo } = responseJson.data.discountNodes;

  return {
    discounts: nodes.map((node: DiscountNode) => ({
      id: node.id,
      title: node.discount?.title ?? "Untitled",
      status: node.discount?.status ?? "UNKNOWN",
      type:
        node.discount?.__typename === "DiscountCodeApp" ||
        node.discount?.__typename === "DiscountCodeBasic"
          ? "code"
          : "automatic",
      method:
        node.discount?.__typename === "DiscountCodeApp" ||
        node.discount?.__typename === "DiscountCodeBasic"
          ? "Code"
          : "Automatic",
      combinations: node.discount?.combinesWith ?? "NO Combinations",
      used: node.discount?.asyncUsageCount ?? 0,
    })),
    hasNextPage: pageInfo.hasNextPage ?? false,
    hasPreviousPage: pageInfo.hasPreviousPage ?? false,
    endCursor: pageInfo.endCursor ?? null,
    startCursor: pageInfo.startCursor ?? null,
  };
}

//handle Status (Activate/Deactivate Discounts)



export async function updateDiscountStatus(
  request: Request,
  id: string,
  type: "code" | "automatic",
  action: "activate" | "deactivate"
) {
   if (!id || typeof id !== "string") {
    throw new Error("Discount ID is required and must be a string.");
  }
  const { admin } = await authenticate.admin(request);
 
  // Ensure the id is a GID
  const discountId = id.includes("gid://") ? id : (
    type === "code"
      ? `gid://shopify/DiscountCodeApp/${id}`
      : `gid://shopify/DiscountAutomaticApp/${id}`
  );

  let mutation;
  if (type === "code") {
    mutation = action === "activate" ? DISCOUNT_CODE_ACTIVATE : DISCOUNT_CODE_DEACTIVATE;
  } else {
    mutation = action === "activate" ? DISCOUNT_AUTOMATIC_ACTIVATE : DISCOUNT_AUTOMATIC_DEACTIVATE;
  }

  const response = await admin.graphql(mutation, { variables: { id: discountId } });
  const responseJson = await response.json();

  // Extract user errors for both types
  let userErrors = [];
  if (type === "code") {
    userErrors = responseJson.data.discountCodeActivate?.userErrors
      || responseJson.data.discountCodeDeactivate?.userErrors
      || [];
  } else {
    userErrors = responseJson.data.discountAutomaticActivate?.userErrors
      || responseJson.data.discountAutomaticDeactivate?.userErrors
      || [];
  }

  return {
    errors: userErrors,
    status:
      type === "code"
        ? responseJson.data.discountCodeActivate?.codeDiscountNode?.codeDiscount?.status
          || responseJson.data.discountCodeDeactivate?.codeDiscountNode?.codeDiscount?.status
        : responseJson.data.discountAutomaticActivate?.automaticDiscountNode?.automaticDiscount?.status
          || responseJson.data.discountAutomaticDeactivate?.automaticDiscountNode?.automaticDiscount?.status,
  };
}


// Get Customer Details

export async function getCustomerEmails(shop: string, accessToken: string) {
  const client = new GraphQLClient(`https://${shop}/admin/api/2025-01/graphql.json`, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json"
    }
  });

  const query = `
    query getCustomers($first: Int!) {
      customers(first: $first) {
        edges {
          node {
            email
          }
        }
      }
    }
  `;

  const data = await client.request<ShopifyCustomerQueryResponse>(query, { first: 100 }); // Shopify limit
  return data.customers.edges
    .map((edge) => edge.node.email)
    .filter((email): email is string => Boolean(email)); // removes nulls & narrows type
}
