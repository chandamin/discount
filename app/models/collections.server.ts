//collections.server.ts  Collection Picker
import { GET_COLLECTIONS } from "../graphql/collections";
import { authenticate } from "../shopify.server";

interface Collection {
  id: string;
  title: string;
  handle: string; // add handle for URL
  url: string;    // computed field
}

// export async function getCollectionsByIds(
//   request: Request,
//   collectionIds: string[],
// ) {
//   const { admin } = await authenticate.admin(request);

//   const response = await admin.graphql(GET_COLLECTIONS, {
//     variables: {
//       ids: collectionIds.map((id: string) =>
//         id.includes("gid://") ? id : `gid://shopify/Collection/${id}`,
//       ),
//     },
//   });

//   const { data } = await response.json();
//   return data.nodes.filter(Boolean) as Collection[];
// }

export async function getCollectionsByIds(
  request: Request,
  collectionIds: string[],
): Promise<Collection[]> {
  const { admin,session } = await authenticate.admin(request);
  const shop = session.shop;
  const response = await admin.graphql(GET_COLLECTIONS, {
    variables: {
      ids: collectionIds.map((id: string) =>
        id.includes("gid://") ? id : `gid://shopify/Collection/${id}`,
      ),
    },
  });

  const { data } = await response.json();

  return data.nodes
    .filter(Boolean)
    .map((p: any) => ({
      id: p.id,
      title: p.title,
      url: `https://${shop}/collections/${p.handle}`,
    }));
}