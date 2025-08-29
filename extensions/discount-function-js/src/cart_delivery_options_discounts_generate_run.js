import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

/**
  * @typedef {import("../generated/api").DeliveryInput} RunInput
  * @typedef {import("../generated/api").CartDeliveryOptionsDiscountsGenerateRunResult} CartDeliveryOptionsDiscountsGenerateRunResult
  */

/**
  * @param {RunInput} input
  * @returns {CartDeliveryOptionsDiscountsGenerateRunResult}
  */

export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const deliveryGroups = input.cart.deliveryGroups || [];
  if (!deliveryGroups.length) {
    throw new Error("No delivery groups found");
  }

  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Shipping,
  );
  let config = { deliveryPercentage: 0 };

  try {
    if (input.discount?.metafield?.value) {
      config = { ...config, ...JSON.parse(input.discount.metafield.value) };
    }
  } catch (_) {
    // fallback to default
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
                id: group.id,
              },
            },
          ],
          value: {
            percentage: {
              value: config.deliveryPercentage,
            },
          },
        })),
        selectionStrategy: DeliveryDiscountSelectionStrategy.All,
      },
    },
  ];
  return { operations };
}