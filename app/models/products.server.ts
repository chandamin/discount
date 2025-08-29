// products.server.ts  Product Picker
import { GET_PRODUCTS } from "../graphql/products";
import { authenticate } from "../shopify.server";

interface Product {
  id: string;
  title: string;
  handle: string; // add handle for URL
  url: string;    // computed field
}

// export async function getProductsByIds(
//   request: Request,
//   productIds: string[],
// ) {
//   const { admin } = await authenticate.admin(request);

//   const response = await admin.graphql(GET_PRODUCTS, {
//     variables: {
//       ids: productIds.map((id: string) =>
//         id.includes("gid://") ? id : `gid://shopify/Product/${id}`,
//       ),
//     },
//   });

//   const { data } = await response.json();
//   return data.nodes.filter(Boolean) as Product[];
// }

export async function getProductsByIds(
  request: Request,
  productIds: string[],
): Promise<Product[]> {

  if (!productIds || productIds.length === 0) return [];

  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(GET_PRODUCTS, {
    variables: {
      ids: productIds.map((id: string) =>
        id.includes("gid://") ? id : `gid://shopify/Product/${id}`,
      ),
    },
  });



  const { data } = await response.json();
    
  if (!data?.nodes) return [];

  return data.nodes
    .filter(Boolean)
    .map((c: any) => ({
      id: c.id,
      title: c.title,
      url: `https://${process.env.SHOPIFY_SHOP}/products/${c.handle}`,
    }));

  //  Cast to Prisma.JsonValue so Prisma accepts it
}
