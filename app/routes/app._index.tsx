import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Button,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  InlineGrid,
  Box,
} from "@shopify/polaris";

import { getFunctions } from "../models/functions.server";

export const loader = async ({request}: LoaderFunctionArgs) => {
  const functions = await getFunctions(request);
  return { functions};
};

export async function action() {}

export default function Index() {
  const { functions} = useLoaderData<typeof loader>();

  return (
    // <Page title="You’ve just made a smart choice for your business &nbsp; - Variants Discount +&nbsp; ">
    <Page>
      <Layout>
        <Layout.Section>
          
          <Box paddingBlockEnd="400" paddingInlineEnd="400">
            <InlineGrid columns="1fr auto" gap="400">
              {/* Left side */}

              {/* Right side */}
              <InlineStack gap="200" align="end">
                <Button url="/app/discounts" variant="primary">
                  View & Update Discounts
                </Button>

                {functions.map((item) => (
                  <Button
                    key={item.id}
                    variant="primary"
                    url={`/app/discount/${item.id}/new`}
                  >
                    Create discount
                  </Button>
                ))}
              </InlineStack>
            </InlineGrid>
          </Box>
       

        
          <Card>
            {/* <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Welcome to Discount Architect
              </Text>
              
              <Text as="p" variant="bodyMd">
                Create and manage custom discount functions for your store. Use
                these functions to implement complex discount logic and pricing
                rules.
              </Text>

              <Text as="p" variant="bodyMd">
                🚀 Boost conversions with discounts customers can't resist — no more generic rules or wasted promotions.
              </Text>
              <Text as="p" variant="bodyMd">
                🎯 Create precise, custom pricing logic that reflects your store’s strategy and goals.
              </Text>
              <Text as="p" variant="bodyMd">
                🛠️ Easy setup, real results — built for merchants who want control without complexity.
              </Text>
              <Text as="p" variant="bodyMd">
                📈 From seasonal deals to dynamic bundles, Discount Architect helps you sell smarter, not harder.
              </Text>
              
            </BlockStack> */}

            <BlockStack gap="400">
              <Text as="h1" variant="headingMd">
                You’ve just made a smart choice for your business.
              </Text>

              <Text as="p" variant="bodyMd">
                Thanks for considering <strong>Variants Discount +</strong> App.
              </Text>

              <Text as="p" variant="bodyMd">
                This app isn’t a random build—it’s developed by the legendary marketing minds at{" "}
                <strong>KECG.CO</strong> in Melbourne, AUSTRALIA.
              </Text>

              <Text as="p" variant="bodyMd">
                We’ve worked with clients who generate over $1.3 billion in annual sales, and helped
                others go from under $10k months to $100k+ months in just a few months.
                Growth and profitability aren’t just words we throw around lightly—they’re the
                outcomes we create for our clients.
              </Text>

              <Text as="h3" variant="headingSm">Why This App is Different</Text>

              <Text as="p" variant="bodyMd">
                Most discount apps treat every product the same. That’s where you lose control and
                margins. Our app is designed from proven strategies that we have used to help scale
                our clients’ businesses to multiple 6 figures in sales a month.
              </Text>

              <Text as="p" variant="bodyMd">
                You can set discounts at the variant level, create minimum quantity offers (like Buy 3+ for $X),
                and protect your higher-margin products from blanket discounts. It’s built for
                businesses that take growth seriously—just like the ones we scale every day.
              </Text>

              <Text as="h3" variant="headingSm">Key Features</Text>

              <Text as="p" variant="bodyMd">✅ Variant-level discounts instead of product-wide discounts</Text>
              <Text as="p" variant="bodyMd">✅ Bulk discount rules (Buy 3+, Buy 5+, Buy 10+ etc.)</Text>
              <Text as="p" variant="bodyMd">✅ Protect margins on premium variants</Text>
              <Text as="p" variant="bodyMd">✅ Easy setup, no coding needed</Text>
              <Text as="p" variant="bodyMd">✅ Compatible with Shopify discounts</Text>
              <Text as="p" variant="bodyMd">✅ Backed by KECG’s proven growth expertise</Text>
              <Text as="p" variant="bodyMd">✅ Responsive support team that cares about your results</Text>

              <Text as="p" variant="bodyMd" fontWeight="medium">
                👉 Run smarter promotions, grow your revenue, and keep your margins strong.
              </Text>

              <Text as="h2" variant="headingMd" fontWeight="medium">
                Built by growth marketers, for growth-focused businesses.
              </Text>
            </BlockStack>

          </Card>
        </Layout.Section> 
      </Layout>
    </Page>
  );
}
