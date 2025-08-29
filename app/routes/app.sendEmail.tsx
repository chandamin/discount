// // Test email

// // app/routes/sendEmail.tsx
// import type { LoaderFunction } from "@remix-run/node";
// import nodemailer from "nodemailer";
// import { GraphQLClient, gql } from "graphql-request";

// type CustomersQueryResult = {
//   customers: {
//     edges: {
//       node: {
//         email: string | null;
//       };
//     }[];
//   };
// };

//export const loader: LoaderFunction = async () => {
//   // 1. Shopify Admin API Client
//   const client = new GraphQLClient(
//     `https://${process.env.SHOPIFY_SHOP}/admin/api/2023-10/graphql.json`,
//     {
//       headers: {
//         "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!,
//         "Content-Type": "application/json",
//       },
//     }
//   );

//   // 2. Query first 10 customers (test only)
//   const query = gql`
//     query getCustomers($first: Int!) {
//       customers(first: $first) {
//         edges {
//           node {
//             email
//           }
//         }
//       }
//     }
//   `;

//   const data = await client.request<CustomersQueryResult>(query, { first: 10 });
  
//   const emails: string[] = data.customers.edges
//     .map(edge => edge.node.email)
//     .filter((email): email is string => Boolean(email));

//   // 3. Nodemailer transporter
//   const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 465,
//     secure: true,
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   // 4. Send test emails
//   for (const email of emails) {
//     await transporter.sendMail({
//       from: process.env.SMTP_USER,
//       to: email,
//       subject: "Test Discount Notification",
//       text: "This is a test email to check if the discount email system works.",
//     });
//   }

//   return new Response(`Sent test email to ${emails.length} customers`);
//};


// app/routes/app.send-email.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, FormLayout, TextField, PageActions, Select, InlineError,Box } from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import { sendEmail } from "~/utils/sendEmail.server";

// ---- Types ----
type Discount = {
  id: string;
  title: string;
  status: "ACTIVE" | "SCHEDULED";
};

type LoaderData = {
  discounts: Discount[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  // Fetch active or scheduled discounts
  const discountsResponse = await admin.graphql(`
    query {
      discountNodes(first: 20) {
        edges {
          node {
            id
            discount {
              ... on DiscountAutomaticApp {
                title
                status
              }
              ... on DiscountCodeApp {
                title
                status
              }
            }
          }
        }
      }
    }
  `);

  const jsonData = await discountsResponse.json();
  const discounts: Discount[] = jsonData.data.discountNodes.edges
    .map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.discount.title,
      status: edge.node.discount.status,
    }))
    .filter((d: Discount) => d.status === "ACTIVE" || d.status === "SCHEDULED")
    .map((d: Discount) => ({
      id: d.id,
      title: d.title,
      status: d.status.toLowerCase() as "active" | "scheduled",
    }));

  return json<LoaderData>({ discounts });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;
  const discountId = formData.get("discountId") as string;

  if (!subject || !message || !discountId) {
    return json({ error: "All fields are required." }, { status: 400 });
  }

  // Fetch subscriber emails from DB (replace with your DB logic)
  // const subscribers = ["anurag.kaswebtech@gmail.com"];

  const subscribers = await prisma.subscriber.findMany({
    select: { email: true },
  });

  const emailList = subscribers
  .map((s) => s.email)
  .filter((email): email is string => email !== null);

  if (emailList.length === 0) {
    return json({ error: "No subscribers found." }, { status: 404 });
  }


  await sendEmail({
    to: emailList,
    subject,
    text: message,
    html: `<p>${message.replace(/\n/g, "<br/>")}</p>`, 
  });

  return json({ success: true });
}

export default function SendEmailPage() {
  const { discounts } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedDiscount, setSelectedDiscount] = useState<string>("");

  const [errors, setErrors] = useState<{ subject?: string; message?: string; discountId?: string }>({});

  const handleSubmit = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!subject) newErrors.subject = "Subject is required";
    if (!message) newErrors.message = "Message is required";
    if (!selectedDiscount) newErrors.discountId = "Select a discount";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("discountId", selectedDiscount);

      fetcher.submit(formData, { method: "post" });
    }
  }, [subject, message, selectedDiscount, fetcher]);

  return (
    <Page>
      <ui-title-bar title="Send Email"></ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card>
            <Box padding="400">
              <FormLayout>

                <Select
                  label="Select Discount"
                  options={[
                    { label: "Select a discount", value: "" },
                    ...discounts.map((d) => ({
                      label: `${d.title} (${d.status})`,
                      value: d.id,
                    })),
                  ]}
                  value={selectedDiscount}
                  onChange={setSelectedDiscount}
                />
                {errors.discountId && <InlineError message={errors.discountId} fieldID="discount-select" />}

                <TextField
                  label="Subject"
                  value={subject}
                  onChange={setSubject}
                  autoComplete="off"
                  error={errors.subject}
                />

                <TextField
                  label="Message"
                  value={message}
                  onChange={setMessage}
                  multiline={4}
                  autoComplete="off"
                  error={errors.message}
                />

                {/* <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
                  Send Email
                </Button> */}
                <PageActions
                  primaryAction={{
                    content: "Send Email",
                    // onAction: submit,
                    loading: isSubmitting,
                    onAction: handleSubmit,
                  }} 
                />
              </FormLayout>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}




