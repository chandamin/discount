import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { boundary } from "@shopify/shopify-app-remix/server";

import { authenticate } from "../shopify.server";
import { getFunctions } from "~/models/functions.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const functions = await getFunctions(request);

  
  return { 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    functions
  };
};

export default function App() {
  const { apiKey, functions } = useLoaderData<typeof loader>();
  const functionId = functions?.[0]?.id 
  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to={`/app/discount/${functionId}/new`}>
          Create New Discount
        </Link>
        <Link to="/app/discounts">
          View & Update
        </Link>
        {/* <Link to="/app/sendEmail">
          Send Email
        </Link> */}
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
