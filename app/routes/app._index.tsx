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
    <Page title="Everything needed in one place &nbsp; - &nbsp; Discount Architect">
      <Layout>
        <Layout.Section>
          
          <Box paddingBlockEnd="400" paddingInlineEnd="400">
            <InlineStack gap="300" align="end">
              <Button url="/app/discounts" variant="primary">
                View & Update Discounts
              </Button>
              {functions.map((item) => (
                
                <InlineStack key={item.id} align="center" >
                  <Button
                    variant="primary"
                    url={`/app/discount/${item.id}/new` 
                  }
                  >
                    Create discount
                  </Button>
                </InlineStack>
                
              ))}
            </InlineStack>
          </Box>
       

        
          <Card>
            <BlockStack gap="400">
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
              
            </BlockStack>
          </Card>
        </Layout.Section> 
      </Layout>
    </Page>
  );
}
