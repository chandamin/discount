// node_modules/@shopify/shopify_function/run.ts
function run_default(userfunction) {
  try {
    ShopifyFunction;
  } catch (e) {
    throw new Error(
      "ShopifyFunction is not defined. Please rebuild your function using the latest version of Shopify CLI."
    );
  }
  const input_obj = ShopifyFunction.readInput();
  const output_obj = userfunction(input_obj);
  ShopifyFunction.writeOutput(output_obj);
}

// extensions/discount-function-js/src/cart_lines_discounts_generate_run.js
function cartLinesDiscountsGenerateRun(input) {
  if (!input.cart.lines.length) {
    throw new Error("No cart lines found");
  }
  const hasOrderDiscountClass = input.discount.discountClasses.includes("ORDER" /* Order */);
  const hasProductDiscountClass = input.discount.discountClasses.includes("PRODUCT" /* Product */);
  if (!hasOrderDiscountClass && !hasProductDiscountClass) {
    return { operations: [] };
  }
  const configRaw = input.discount?.metafield?.value;
  let config = {
    cartLinePercentage: 0,
    orderPercentage: 0,
    deliveryPercentage: 0,
    productIds: [],
    collectionIds: []
  };
  try {
    if (configRaw) {
      config = { ...config, ...JSON.parse(configRaw) };
    }
  } catch (_) {
  }
  const operations = [];
  if (hasOrderDiscountClass && config.orderPercentage > 0) {
    operations.push({
      orderDiscountsAdd: {
        candidates: [
          {
            message: `${config.orderPercentage}% OFF ORDER`,
            targets: [
              {
                orderSubtotal: {
                  excludedCartLineIds: []
                }
              }
            ],
            value: {
              percentage: {
                value: config.orderPercentage
              }
            }
          }
        ],
        selectionStrategy: "FIRST" /* First */
      }
    });
  }
  if (hasProductDiscountClass && config.cartLinePercentage > 0) {
    const applicableLines = input.cart.lines.filter((line) => {
      const productMatch = config.productIds.includes(line.merchandise?.product?.id);
      const collectionMatch = line.merchandise?.product?.inAnyCollection === true;
      return productMatch || collectionMatch;
    });
    if (applicableLines.length) {
      operations.push({
        productDiscountsAdd: {
          candidates: applicableLines.map((line) => ({
            message: `${config.cartLinePercentage}% OFF PRODUCT`,
            targets: [
              {
                cartLine: {
                  id: line.id
                }
              }
            ],
            value: {
              percentage: {
                value: config.cartLinePercentage
              }
            }
          })),
          selectionStrategy: "ALL" /* All */
        }
      });
    }
  }
  return {
    operations
  };
}

// extensions/discount-function-js/src/cart_delivery_options_discounts_generate_run.js
function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const deliveryGroups = input.cart.deliveryGroups || [];
  if (!deliveryGroups.length) {
    throw new Error("No delivery groups found");
  }
  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    "SHIPPING" /* Shipping */
  );
  let config = { deliveryPercentage: 0 };
  try {
    if (input.discount?.metafield?.value) {
      config = { ...config, ...JSON.parse(input.discount.metafield.value) };
    }
  } catch (_) {
  }
  if (!hasShippingDiscountClass || config.deliveryPercentage <= 0) {
    return { operations: [] };
  }
  const operations = [
    {
      deliveryDiscountsAdd: {
        candidates: deliveryGroups.map((group) => ({
          message: `${config.deliveryPercentage}% OFF DELIVERY`,
          targets: [
            {
              deliveryGroup: {
                id: group.id
              }
            }
          ],
          value: {
            percentage: {
              value: config.deliveryPercentage
            }
          }
        })),
        selectionStrategy: "ALL" /* All */
      }
    }
  ];
  return { operations };
}

// <stdin>
function cartLinesDiscountsGenerateRun2() {
  return run_default(cartLinesDiscountsGenerateRun);
}
function cartDeliveryOptionsDiscountsGenerateRun2() {
  return run_default(cartDeliveryOptionsDiscountsGenerateRun);
}
export {
  cartDeliveryOptionsDiscountsGenerateRun2 as cartDeliveryOptionsDiscountsGenerateRun,
  cartLinesDiscountsGenerateRun2 as cartLinesDiscountsGenerateRun
};
