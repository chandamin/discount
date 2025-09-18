import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

/**
  * @typedef {import("../generated/api").CartInput} RunInput
  * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
  */

/**
  * @param {RunInput} input
  * @returns {CartLinesDiscountsGenerateRunResult}
  */
export function cartLinesDiscountsGenerateRun(input) {
  if (!input.cart.lines.length) {
    throw new Error('No cart lines found');
  }

  const hasOrderDiscountClass = input.discount.discountClasses.includes(DiscountClass.Order);
  const hasProductDiscountClass = input.discount.discountClasses.includes(DiscountClass.Product);

  if (!hasOrderDiscountClass && !hasProductDiscountClass) {
    return { operations: [] };
  }

  // Parse merchant configuration
  const configRaw = input.discount?.metafield?.value;
  let config = {
    cartLinePercentage: 0,
    orderPercentage: 0,
    deliveryPercentage: 0,
    productIds: [],
    collectionIds: [],
    message: configRaw.message,
  };
  console.log(configRaw, "Metafield");


  try {
    if (configRaw) {
      config = { ...config, ...JSON.parse(configRaw) };
    }
  } catch (_) {
    // fallback config already applied
  }

  const operations = [];

  if (hasOrderDiscountClass && config.orderPercentage > 0) {
    operations.push({
      orderDiscountsAdd: {
        candidates: [
          {
            message: `${config.message}`,
            targets: [
              {
                orderSubtotal: {
                  excludedCartLineIds: [],
                },
              },
            ],
            value: {
              percentage: {
                value: config.orderPercentage,
              },
            },
          },
        ],
        selectionStrategy: OrderDiscountSelectionStrategy.First,
      },
    });
  }

  if (hasProductDiscountClass && config.cartLinePercentage > 0) {
    // Filter applicable cart lines by productId or collectionId
    const applicableLines = input.cart.lines.filter((line) => {
      const productMatch = config.productIds.includes(line.merchandise?.product?.id);
      const collectionMatch = line.merchandise?.product?.inAnyCollection === true;

      return productMatch || collectionMatch;
    });
      


    if (applicableLines.length) {
      operations.push({
        productDiscountsAdd: {
          candidates: applicableLines.map((line) => ({
            message: `${config.message}`,
            targets: [
              {
                cartLine: {
                  id: line.id,
                },
              },
            ],
            value: {
              percentage: {
                value: config.cartLinePercentage,
              },
            },
          })),
          selectionStrategy: ProductDiscountSelectionStrategy.All,
        },
      });
    }
  }

  return {
    operations,
  };
}