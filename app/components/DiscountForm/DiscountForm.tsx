import { Form } from "@remix-run/react";
import {
  Banner,
  Card,
  Text,
  Layout,
  PageActions,
  TextField,
  BlockStack,
  Box,
  Checkbox,
  Select,
  InlineStack,
  RadioButton,
} from "@shopify/polaris";
import { returnToDiscounts } from "app/utils/navigation";
import { useCallback, useMemo, useState } from "react";

import { combineDateTime, useDiscountForm } from "../../hooks/useDiscountForm";
import { DiscountClass } from "../../types/admin.types.d";
import { DiscountMethod } from "../../types/types";
import { ProductPicker } from "../ProductPicker/ProductPicker";
import { CollectionPicker } from "../CollectionPicker/CollectionPicker";
import { DatePickerField } from "../DatePickerField/DatePickerField";

interface SubmitError {
  message: string;
  field: string[];
}

interface DiscountFormProps {
  initialData?: {
    title: string;
    method: DiscountMethod;
    code: string;
    combinesWith: {
      orderDiscounts: boolean;
      productDiscounts: boolean;
      shippingDiscounts: boolean;
    };
    discountClasses: DiscountClass[];
    usageLimit: number | null;
    appliesOncePerCustomer: boolean;
    startsAt: string | Date;
    endsAt: string | Date | null;
    configuration: {
      cartLinePercentage: string;
      orderPercentage: string;
      deliveryPercentage: string;
      metafieldId?: string;
      collectionIds?: string[];
      productIds?: string[];
    };
  };
  collections: { id: string; title: string }[];
  products: {id: string; title: string}[];
  isEditing?: boolean;
  submitErrors?: SubmitError[];
  isLoading?: boolean;
  success?: boolean;
}

const methodOptions = [
  { label: "Discount code", value: DiscountMethod.Code },
  { label: "Automatic discount", value: DiscountMethod.Automatic },
];

export function DiscountForm({
  initialData,
  collections: initialCollections,
  products: initialProducts,
  isEditing = false,
  submitErrors = [],
  isLoading = false,
  success = false,
}: DiscountFormProps) {
  const { formState, setField, setConfigField, setCombinesWith, submit } =
    useDiscountForm({
      initialData,
    });

  const [collections, setCollections] = useState<DiscountFormProps["collections"]>(initialCollections);
  const [products, setProducts] = useState<DiscountFormProps["products"]>(initialProducts);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [showErrors, setShowErrors] = useState(false);
  

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const getDateTime = (date: Date | string, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const validateEndDate = useCallback(
    (endDate: Date) => {
      if (!formState.startDate || !formState.startTime || !formState.endTime)
        return undefined;

      const start = getDateTime(formState.startDate, formState.startTime);
      const end = getDateTime(endDate, formState.endTime);

      return end <= start ? "End time must be after start time" : undefined;
    },
    [formState.startDate, formState.startTime, formState.endTime],
  );

  const handleEndDateChange = useCallback(
    (date: Date) => {
      const error = validateEndDate(date);
      if (!error) {
        setField("endDate", date);
      }
    },
    [validateEndDate, setField],
  );


  // const errorBanner = useMemo(
  //   () =>
  //     submitErrors.length > 0 ? (
  //       <Layout.Section>
  //         <Banner tone="critical">
  //           <p>There were some issues with your form submission:</p>
  //           <ul>
  //             {submitErrors.map(({ message, field }, index) => (
  //               <li key={index}>
  //                 {field.join(".")} {message}
  //               </li>
  //             ))}
  //           </ul>
  //         </Banner>
  //       </Layout.Section>
  //     ) : null,
  //   [submitErrors],
  // );

  // const successBanner = useMemo(
  //   () =>
  //     success ? (
  //       <Layout.Section>
  //         <Banner tone="success">
  //           <p>Discount saved successfully</p>
  //         </Banner>
  //       </Layout.Section>
  //     ) : null,
  //   [success],
  // );

  const handleCollectionSelect = useCallback(
    async (selectedCollections: { id: string; title: string }[]) => {
      setConfigField(
        "collectionIds",
        selectedCollections.map((collection) => collection.id),
      );
      setCollections(selectedCollections);
    },
    [setConfigField],
  );

  const handleProductSelect = useCallback(
    async (selectedProducts: { id: string; title: string }[]) => {
      setConfigField(
        "productIds",
        selectedProducts.map((product) => product.id),
      );
      setProducts(selectedProducts);
    },
    [setConfigField],
  );

  const handleDiscountClassChange = useCallback(
    (discountClassValue: DiscountClass, checked: boolean) => {
      setField(
        "discountClasses",
        checked
          ? [...formState.discountClasses, discountClassValue]
          : formState.discountClasses.filter(
              (discountClass) => discountClass !== discountClassValue,
            ),
      );
    },
    [formState.discountClasses, setField],
  );

const handleEndDateCheckboxChange = useCallback(
  (checked: boolean) => {
    if (!checked) {
      setField("endDate", null);
      return;
    }

    if (!formState.endDate) {
      const tomorrow = new Date(formState.startDate || today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setField("endDate", tomorrow);
    }

    // Ensure endTime is set when the checkbox gets enabled
    if (!formState.endTime || formState.endTime.trim() === "") {
      setField("endTime", formState.startTime || "23:59");
    }
   },

  [formState.startDate, formState.endDate, formState.startTime, formState.endTime, today, setField],
);

  // VALIDATE FORM
  // Validation function
const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Method-specific fields
    if (formState.method === DiscountMethod.Automatic && !formState.title.trim()) {
      errors.title = "Title is required";
    }
    if (formState.method === DiscountMethod.Code && !formState.code.trim()) {
      errors.code = "Discount code is required";
    }

    // Discount class validation
    const hasProduct = formState.discountClasses.includes(DiscountClass.Product);
    const hasOrder = formState.discountClasses.includes(DiscountClass.Order);
    const hasShipping = formState.discountClasses.includes(DiscountClass.Shipping);

    const validProduct = hasProduct && parseFloat(formState.configuration.cartLinePercentage) > 0;
    const validOrder = hasOrder && parseFloat(formState.configuration.orderPercentage) > 0;
    const validShipping = hasShipping && parseFloat(formState.configuration.deliveryPercentage) > 0;

    if (!(validProduct || validOrder || validShipping)) {
      errors.discountClasses = "At least one discount class must have a percentage > 0";
    }

    // Collection / Product Validation
    if (formState.discountClasses.includes(DiscountClass.Product)) {
      if (formState.target === 'collections') {
        const selectedCollections = formState.configuration.collectionIds || [];
        if (selectedCollections.length === 0) {
          errors.collections = "Select at least one collection.";
        }
      }

      if (formState.target === 'products') {
        const selectedProducts = formState.configuration.productIds || [];
        if (selectedProducts.length === 0) {
          errors.products = "Select at least one product.";
        }
      }
    }


    // Start date & time
    if (!formState.startDate) {
      errors.startDate = "Start date is required";
    }
    if (!formState.startTime) {
      errors.startTime = "Start time is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    setShowErrors(true);
    if (validateForm()) {
      submit();
    }
  };


  // Error Banner
  const summaryBanner = showErrors && Object.keys(validationErrors).length > 0 && (
    <Layout.Section>
      <Banner tone="critical">
        <p>Please fix the following errors before continuing:</p>
        <ul>
          {Object.entries(validationErrors).map(([key, value]) => (
            <li key={key}>{value}</li>
          ))}
        </ul>
      </Banner>
    </Layout.Section>
  );


  return (
    <Layout>
      {/* {errorBanner}
      {successBanner} */}
      {summaryBanner}

      {success && (
        <Layout.Section>
          <Banner tone="success">
            <p>Discount saved successfully</p>
          </Banner>
        </Layout.Section>
      )}

      <Layout.Section>
        <Form method="post" id="discount-form">
          <input
            type="hidden"
            name="discount"
            value={JSON.stringify({
              title: formState.title,
              method: formState.method,
              code: formState.code,
              combinesWith: formState.combinesWith,
              discountClasses: formState.discountClasses,
              usageLimit:
                formState.usageLimit === ""
                  ? null
                  : parseInt(formState.usageLimit, 10),
              appliesOncePerCustomer: formState.appliesOncePerCustomer,
              startsAt: combineDateTime(formState.startDate, formState.startTime || ""),
              endsAt: formState.endDate
                ? combineDateTime(formState.endDate, formState.endTime || "")
                : null,
              configuration: {
                ...(formState.configuration.metafieldId
                  ? { metafieldId: formState.configuration.metafieldId }
                  : {}),
                cartLinePercentage: parseFloat(
                  formState.configuration.cartLinePercentage,
                ),
                orderPercentage: parseFloat(
                  formState.configuration.orderPercentage,
                ),
                deliveryPercentage: parseFloat(
                  formState.configuration.deliveryPercentage,
                ),
                collectionIds: formState.configuration.collectionIds || [],
                productIds: formState.configuration.productIds || [],
              },
            })}
          />
          <BlockStack gap="400">
            {/* Method section */}
            <Card>
              <Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">
                    {isEditing ? "Edit discount" : "Create discount"}
                  </Text>

                  <Select
                    label="Discount type"
                    options={methodOptions}
                    value={formState.method}
                    onChange={(value: DiscountMethod) =>
                      setField("method", value)
                    }
                    disabled={isEditing}
                  />

                  {formState.method === DiscountMethod.Automatic ? (
                    <TextField
                      label="Discount title"
                      autoComplete="off"
                      value={formState.title}
                      onChange={(value) => setField("title", value)}
                      // error={!formState.title.trim() ? "Title is required" : undefined}
                      error = {showErrors ? validationErrors.title : undefined}
                    />
                  ) : (
                    <TextField
                      label="Discount code"
                      autoComplete="off"
                      value={formState.code}
                      onChange={(value) => setField("code", value)}
                      helpText="Customers will enter this discount code at checkout."
                      // error={!formState.code.trim() ? "Discount code is required" : undefined}
                      error={showErrors ? validationErrors.code : undefined}
                    />
                  )}
                </BlockStack>
              </Box>
            </Card>

          {/* Discount classes section */}
            <Card>
              <Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">
                    Discount Classes
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Select which types of discounts to apply
                  </Text>

                  <BlockStack gap="200">
                    <Checkbox
                      label="Product discount"
                      checked={formState.discountClasses.includes(
                        DiscountClass.Product,
                      )}
                      // onChange={(checked) =>
                      //   handleDiscountClassChange(
                      //     DiscountClass.Product,
                      //     checked,
                      //   )
                      // }
                      onChange={(checked) =>
                        handleDiscountClassChange(DiscountClass.Product, checked)
                      }
                    />
                    
                    <Checkbox
                      label="Order discount"
                      checked={formState.discountClasses.includes(
                        DiscountClass.Order,
                      )}
                      // onChange={(checked) =>
                      //   handleDiscountClassChange(DiscountClass.Order, checked)
                      // }
                      onChange={(checked) =>
                        handleDiscountClassChange(DiscountClass.Order, checked)
                      }
                    />
                    <Checkbox
                      label="Shipping discount"
                      checked={formState.discountClasses.includes(
                        DiscountClass.Shipping,
                      )}
                      // onChange={(checked) =>
                      //   handleDiscountClassChange(
                      //     DiscountClass.Shipping,
                      //     checked,
                      //   )
                      // }
                      onChange={(checked) =>
                        handleDiscountClassChange(DiscountClass.Shipping, checked)
                      }
                    />

                    {/* {discountClassError && (
                      <Text as="p" tone="critical" variant="bodySm">
                        {discountClassError}
                      </Text>
                    )} */}
                    {showErrors && validationErrors.discountClasses && (
                    <Text as="p" tone="critical" variant="bodySm">{validationErrors.discountClasses}</Text>
                    )}
                  </BlockStack>
                </BlockStack>
              </Box>
            </Card>
            {/* [END discount-classes] */}

            {/* [START discount-configuration] */}
            <Card>
              <Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">
                    Discount Configuration
                  </Text>

                  <BlockStack gap="400">
                    {formState.discountClasses?.includes(
                      DiscountClass.Product,
                    ) ? (
                      <>
                        <TextField
                          label="Product discount percentage"
                          autoComplete="on"
                          type="number"
                          min="1"
                          max="100"
                          suffix="%"
                          value={formState.configuration.cartLinePercentage}
                          onChange={(value) =>
                            setConfigField("cartLinePercentage", value)
                          }
                          helpText="Percentage discount for products"
                        />
                        
                        <RadioButton
                          label="Apply to collections"
                          checked={formState.target === 'collections'}
                          id="apply-to-collections"
                          name="discount-target"
                          onChange={() => {
                            setField('target', 'collections');
                            setConfigField('productIds', []); // optional: clear opposite field
                          }}
                        />

                        {formState.target === 'collections' && (
                          <>
                            <CollectionPicker
                              onSelect={handleCollectionSelect}
                              selectedCollectionIds={
                                formState.configuration.collectionIds || []
                              }
                              collections={
                                formState.configuration.collections || collections
                              }
                              buttonText="Select collections for discount"
                            />
                            {showErrors && validationErrors.collections && (
                              <Text as="p"tone="critical" variant="bodySm">
                                {validationErrors.collections}
                              </Text>
                            )}
                          </>
                          
                        )}

                        <RadioButton
                          label = "Apply to products"
                          checked = {formState.target === 'products'}
                          id="apply-to-products"
                          name="discount-target"
                          onChange = {() => {
                            setField('target', 'products');
                            setConfigField('collectionIds', []);
                          }}
                        />

                        {formState.target === 'products' && (
                          <>
                            <ProductPicker 
                              onSelect={handleProductSelect}
                              selectedProductIds={
                                formState.configuration.productIds || [] 
                              }
                              products={
                                formState.configuration.products || products
                              }
                            />
                            {showErrors && validationErrors.products && (
                              <Text as="p" tone="critical" variant="bodySm">
                                {validationErrors.products}
                              </Text>
                            )}
                          </>
                        )}

                      </>
                    ) : null}

                    {formState.discountClasses?.includes(
                      DiscountClass.Order,
                    ) ? (
                      <TextField
                        label="Order discount percentage"
                        autoComplete="on"
                        type="number"
                        min="0"
                        max="100"
                        suffix="%"
                        value={formState.configuration.orderPercentage}
                        onChange={(value) =>
                          setConfigField("orderPercentage", value)
                        }
                        helpText="Percentage discount for orders"
                      />
                    ) : null}

                    {formState.discountClasses?.includes(
                      DiscountClass.Shipping,
                    ) ? (
                      <TextField
                        label="Shipping discount percentage"
                        autoComplete="on"
                        type="number"
                        min="0"
                        max="100"
                        suffix="%"
                        value={formState.configuration.deliveryPercentage}
                        onChange={(value) =>
                          setConfigField("deliveryPercentage", value)
                        }
                        helpText="Percentage discount for shipping"
                      />
                    ) : null}
                  </BlockStack>
                </BlockStack>
              </Box>
            </Card>
            {/* [END discount-configuration] */}

            {/* Usage limits section */}
            {formState.method === DiscountMethod.Code ? (
              <Card>
                <Box>
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h2">
                      Usage limits
                    </Text>
                    <TextField
                      label="Usage limit"
                      autoComplete="on"
                      type="number"
                      min="0"
                      placeholder="No limit"
                      value={formState.usageLimit}
                      onChange={(value) => setField("usageLimit", value)}
                      helpText="Limit the number of times this discount can be used"
                    />
                    <Checkbox
                      label="Limit to one use per customer"
                      checked={formState.appliesOncePerCustomer}
                      onChange={(checked) =>
                        setField("appliesOncePerCustomer", checked)
                      }
                    />
                  </BlockStack>
                </Box>
              </Card>
            ) : null}

            {/* Combination section */}
            <Card>
              <Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">
                    Combination
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Select which discounts can be combined with this discount
                  </Text>

                  <Checkbox
                    label="Order discounts"
                    checked={formState.combinesWith.orderDiscounts}
                    onChange={(checked) =>
                      setCombinesWith("orderDiscounts", checked)
                    }
                  />

                  <Checkbox
                    label="Product discounts"
                    checked={formState.combinesWith.productDiscounts}
                    onChange={(checked) =>
                      setCombinesWith("productDiscounts", checked)
                    }
                  />

                  <Checkbox
                    label="Shipping discounts"
                    checked={formState.combinesWith.shippingDiscounts}
                    onChange={(checked) =>
                      setCombinesWith("shippingDiscounts", checked)
                    }
                  />
                </BlockStack>
              </Box>
            </Card>

            {/* Active dates section */}
            <Card>
              <Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">
                    Active dates
                  </Text>

                  <BlockStack gap="400">
                    <InlineStack
                      gap="400"
                      align="start"
                      blockAlign="center"
                      wrap={true}
                    >
                    <Box width="50%">
                      <DatePickerField
                        label="Start date"
                        value={formState.startDate}
                        onChange={(date) => {
                          const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                          setField("startDate", localDate.toISOString().split("T")[0]);
                        }}
                        // onChange={(date) => setField("startDate", date)}
                        minDate={today}
                        // error={!formState.startDate ? "Start date is required" : undefined}
                        error={showErrors ? validationErrors.startDate : undefined}
                      />
                      <TextField
                        label="Start time"
                        autoComplete="on"
                        type="time"
                        value={formState.startTime || ""}
                        onChange={value => setField("startTime", value)}
                        // error={!formState.startTime ? "Start Time is required" : undefined}
                        error={showErrors ? validationErrors.startTime : undefined}
                      />
                    </Box>

                    <Box width="50%">
                      {formState.endDate && (
                        <>
                          <DatePickerField
                            label="End date"
                            value={formState.endDate}
                            onChange={handleEndDateChange}
                            minDate={
                              formState.startDate ? new Date(formState.startDate) : today
                            }
                            error={validateEndDate(new Date(formState.endDate))}
                          />
                          <TextField
                            label="End time"
                            autoComplete="on"
                            type="time"
                            value={formState.endTime || "23:59"}
                            onChange={(val) => setField("endTime", val)}
                          />
                        </>
                      )}
                    </Box>
                    </InlineStack>

                    <Checkbox
                      label="Set end date"
                      checked={!!formState.endDate}
                      onChange={handleEndDateCheckboxChange}
                      
                    />
                  </BlockStack>
                </BlockStack>
              </Box>
            </Card>
          </BlockStack>
          <Layout.Section>
            <PageActions
              primaryAction={{
                content: "Save discount",
                loading: isLoading,
                // onAction: submit,
                onAction: handleSubmit,
              }}
              secondaryActions={[
                {
                  content: "Discard",
                  onAction: returnToDiscounts,
                },
              ]}
            />
          </Layout.Section>
        </Form>
      </Layout.Section>
    </Layout>
  );
}
