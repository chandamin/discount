import {
  Button,
  BlockStack,
  InlineStack,
  Link,
  Divider,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { useCallback } from "react";

interface Product {
  id: string;
  title: string;
}

interface ResourcePickerResponse {
  id: string;
  title: string;
}

interface ProductPickerProps {
  onSelect: (selectedProducts: Product[]) => void;
  selectedProductIds: string[];
  products: Product[];
  buttonText?: string;
}

export function ProductPicker({
  onSelect,
  selectedProductIds = [],
  products = [],
  buttonText = "Select products",
}: ProductPickerProps) {
  const handleSelect = useCallback(async () => {
    const selected = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: true,
      selectionIds: selectedProductIds.map((id) => ({
        id,
        type: "product",
      })),
    });

    if (selected) {
      const selectedProducts = selected.map(
        (product: ResourcePickerResponse) => ({
          id: product.id,
          title: product.title,
        }),
      );
      onSelect(selectedProducts);
    }
  }, [selectedProductIds, onSelect]);

  const handleRemove = useCallback(
    (productId: string) => {
      onSelect(products.filter((product) => product.id !== productId));
    },
    [onSelect, products],
  );

  const selectedProductsText = products?.length
    ? `(${products.length} selected)`
    : "";

  return (
    <BlockStack gap="400">
      <Button onClick={handleSelect}>
        {buttonText}
        {selectedProductsText}
      </Button>
      {products?.length > 0 ? (
        <BlockStack gap="200">
          {products.map((product) => (
            <BlockStack gap="200" key={product.id}>
              <InlineStack blockAlign="center" align="space-between">
                <Link
                  url={`shopify://admin/products/${product.id.split("/").pop()}`}
                  monochrome
                  removeUnderline
                >
                  {product.title}
                </Link>
                <Button
                  variant="tertiary"
                  onClick={() => handleRemove(product.id)}
                  icon={DeleteIcon}
                />
              </InlineStack>
              <Divider />
            </BlockStack>
          ))}
        </BlockStack>
      ) : null}
    </BlockStack>
  );
}
