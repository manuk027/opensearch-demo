import openSearchClient from "../config/opensearch";
import { Product } from "../types/product";

const PRODUCT_INDEX = "products";

export const indexProduct = async (product: Product) => {
  const response = await openSearchClient.index({
    index: PRODUCT_INDEX,
    id: product.id,
    body: product,
    refresh: true,
  });

  return response.body;
};

export const getProductById = async (id: string) => {
  const response = await openSearchClient.get({
    index: PRODUCT_INDEX,
    id,
  });
  return response.body;
};

export const createProduct = async (product: Product) => {
  const response = await openSearchClient.index({
    index: PRODUCT_INDEX,
    id: product.id,
    body: product,
    refresh: true,
  });

  return response.body;
};

export const searchProducts = async (query: string) => {
  const response = await openSearchClient.search({
    index: PRODUCT_INDEX,
    body: {
      query: {
        multi_match: {
          query,
          fields: [
            "name^3",
            "description",
            "category^2",
          ],
        },
      },
    },
  });
  return response.body.hits.hits.map((hit: any) => ({
    id: hit._id,
    ...hit._source,
  }));
};