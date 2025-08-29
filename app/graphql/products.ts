export const GET_PRODUCTS = `
    query GetProducts($ids: [ID!]!){
        nodes(ids: $ids){
            ... on Product {
                id
                title
                handle
                onlineStoreUrl
            }
        }
    }
`;