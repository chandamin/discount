// import { useState } from "react";
// import {
//   Page,
//   Layout,
//   Card,
//   Text,
//   Button,
//   Box,
//   TextField,
// } from "@shopify/polaris";

// interface EmailTemplate {
//   id: string;
//   name: string;
//   subject: string;
//   body: string;
// }

// export default function TemplatesPage() {
//   const [template, setTemplate] = useState<EmailTemplate>({
//     id: "template-1",
//     name: "Default Discount Email",
//     subject: "🎉 Special Discount Just for You!",
//     body: "Enjoy {{percentage}}% off on {{product}}. Hurry, offer ends {{endsAt}}!",
//   });

//   return (
//     <Page title="Email Template">
//       <Layout>
//         <Layout.Section>
//           <Card>
//             <Box padding="400">
//               <Text as="h2" variant="headingMd">
//                 {template.name}
//               </Text>

//               <Box paddingBlockStart="300">
//                 <TextField
//                   label="Subject line"
//                   value={template.subject}
//                   onChange={(val) =>
//                     setTemplate({ ...template, subject: val })
//                   }
//                   autoComplete="off"
//                 />
//               </Box>

//               <Box paddingBlockStart="300">
//                 <TextField
//                   label="Body"
//                   value={template.body}
//                   onChange={(val) =>
//                     setTemplate({ ...template, body: val })
//                   }
//                   autoComplete="off"
//                   multiline={4}
//                 />
//               </Box>

//               <Box paddingBlockStart="400">
//                 <Button onClick={() => console.log("Saved", template)}>
//                   Save Template
//                 </Button>
//               </Box>
//             </Box>
//           </Card>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }

// app/routes/app.templates.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import prisma from "~/db.server";
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "~/shopify.server";

// --- Loader: fetch existing templates
export async function loader({ request }: LoaderFunctionArgs) {
  // TODO: Replace with actual shop from session
  
  const { session} = await authenticate.admin(request);
  const shop = session.shop;
  console.log(prisma, "prisma");
  const templates = await prisma.template.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  return json({ templates });
}

// --- Action: create new template
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;

  // TODO: Replace with actual shop from session
  const {session} = await authenticate.admin(request);
  const shop = session.shop;
  

  await prisma.template.create({
    data: {
      shop,
      name,
      subject,
      body,
    },
  });

  return redirect("/app/templates");
}

// --- Component
export default function TemplatesPage() {
  const { templates } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  // Local form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  return (
    <Page title="Email Templates">
      <Layout>
        <Layout.Section>
          <Card>
            <Form method="post">
              <BlockStack gap="400">
                <TextField
                  label="Template Name"
                  value={name}
                  onChange={setName}
                  name="name"
                  autoComplete="off"
                  requiredIndicator
                />
                <TextField
                  label="Subject"
                  value={subject}
                  onChange={setSubject}
                  name="subject"
                  autoComplete="off"
                  requiredIndicator
                />
                <TextField
                  label="Body (supports {{discount}}, {{percentage}}, {{product}}, {{url}})"
                  value={body}
                  onChange={setBody}
                  name="body"
                  autoComplete="off"
                  multiline={6}
                  requiredIndicator
                />
                <InlineStack gap="200">
                  <Button
                    variant="primary"
                    submit
                    loading={navigation.state === "submitting"}
                  >
                    Save Template
                  </Button>
                </InlineStack>
              </BlockStack>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            {templates.length === 0 ? (
              <p>No templates yet.</p>
            ) : (
              <BlockStack gap="200">
                {templates.map((tpl) => (
                  <Card key={tpl.id} >
                    <p><strong>{tpl.name}</strong></p>
                    <p>📧 {tpl.subject}</p>
                    <p dangerouslySetInnerHTML={{ __html: tpl.body }} />
                  </Card>
                ))}
              </BlockStack>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}



// import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
// import { json, redirect } from "@remix-run/node";
// import { Form, useLoaderData, useNavigation } from "@remix-run/react";
// import { useEffect, useRef, useState } from "react";
// import prisma from "~/db.server";
// import { authenticate } from "~/shopify.server";

// import {
//   Page,
//   Layout,
//   Card,
//   TextField,
//   Button,
//   BlockStack,
//   InlineStack,
//   Box,
//   Text,
// } from "@shopify/polaris";

// // Remix (Vite) way to include GrapesJS CSS
// // If your setup differs, you can also add these to your global CSS.
// import grapesCss from "grapesjs/dist/css/grapes.min.css?url";

// // Let Remix include the stylesheet
// export const links = () => [
//   { rel: "stylesheet", href: grapesCss },
// ];

// // ---------- Loader: fetch latest template for this shop ----------
// export async function loader({ request }: LoaderFunctionArgs) {
//   // get shop from session (using your existing helper)
//   const { session } = await authenticate.admin(request);
//   const shop = session.shop;

//   const latest = await prisma.template.findFirst({
//     where: { shop },
//     orderBy: { createdAt: "desc" },
//   });

//   return json({
//     shop,
//     template: latest ?? null,
//   });
// }

// // ---------- Action: save template ----------
// export async function action({ request }: ActionFunctionArgs) {
//   const { session } = await authenticate.admin(request);
//   const shop = session.shop;

//   const formData = await request.formData();
//   const id = formData.get("id") as string | null;
//   const name = (formData.get("name") as string) ?? "Untitled";
//   const subject = (formData.get("subject") as string) ?? "New Discount";
//   const html = (formData.get("html") as string) ?? "";
//   const css = (formData.get("css") as string) ?? "";

//   if (!html) {
//     return json({ ok: false, error: "HTML missing" }, { status: 400 });
//   }

//   if (id) {
//     await prisma.template.update({
//       where: { id },
//       data: { name, subject, html, css },
//     });
//   } else {
//     await prisma.template.create({
//       data: { shop, name, subject, html, css },
//     });
//   }

//   return redirect("/app.templates");
// }

// // ---------- Component ----------
// export default function TemplatesPage() {
//   const { template } = useLoaderData<typeof loader>();
//   const navigation = useNavigation();

//   const [name, setName] = useState(template?.name ?? "Discount Email");
//   const [subject, setSubject] = useState(
//     template?.subject ?? "🎉 {{discount}} — Save {{percentage}}% today!"
//   );

//   // GrapesJS refs/state
//   const editorRef = useRef<any>(null);
//   const editorElRef = useRef<HTMLDivElement | null>(null);

//   // Initialize GrapesJS on client only
//   useEffect(() => {
//     let mounted = true;

//     (async () => {
//       if (!editorElRef.current) return;

//       // dynamic imports to avoid SSR issues
//       const grapesjs = (await import("grapesjs")).default;

//       // Optional: newsletter preset for email-friendly output
//       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//       // @ts-ignore - plugin has no types
//       const presetNewsletter = (await import("grapesjs-preset-newsletter")).default;

//       const editor = grapesjs.init({
//         container: editorElRef.current,
//         fromElement: false,
//         height: "70vh",
//         storageManager: false, // we manage save via Remix form
//         plugins: [presetNewsletter],
//         pluginsOpts: {
//           [presetNewsletter]: {},
//         },
//         canvas: {
//           styles: [
//             // You can add web fonts or custom CSS resets here
//           ],
//         },
//       });

//       // If we have an existing template, load it
//       if (template?.html) {
//         editor.setComponents(template.html);
//       } else {
//         // Starter content (email-friendly table layout)
//         editor.setComponents(`
//           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:24px 0;">
//             <tr>
//               <td align="center">
//                 <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-collapse:collapse;">
//                   <tr>
//                     <td style="padding:24px;text-align:center;">
//                       <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;">{{discount}}</h1>
//                       <p style="font-family:Arial,Helvetica,sans-serif;margin:12px 0;">
//                         Save <strong>{{percentage}}%</strong> on {{product}}
//                       </p>
//                       <p style="font-family:Arial,Helvetica,sans-serif;margin:12px 0;">
//                         <a href="{{url}}" style="display:inline-block;padding:12px 20px;background:#111111;color:#ffffff;text-decoration:none;border-radius:4px">Shop now</a>
//                       </p>
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//             </tr>
//           </table>
//         `);
//       }

//       if (template?.css) {
//         editor.addComponents(`<style>${template.css}</style>`);
//       }

//       if (mounted) {
//         editorRef.current = editor;
//       }
//     })();

//     return () => {
//       mounted = false;
//       // destroy editor instance on unmount
//       if (editorRef.current) {
//         editorRef.current.destroy();
//         editorRef.current = null;
//       }
//     };
//   }, [template]);

//   // Gather HTML/CSS from editor and submit via hidden inputs
//   const onSave = () => {
//     const editor = editorRef.current;
//     if (!editor) return;

//     const html = editor.getHtml();
//     const css = editor.getCss();

//     // Put values into hidden inputs and submit the form
//     const form = document.getElementById("template-form") as HTMLFormElement;
//     (form.elements.namedItem("html") as HTMLInputElement).value = html;
//     (form.elements.namedItem("css") as HTMLInputElement).value = css;

//     form.submit();
//   };

//   return (
//     <Page title="Email Template (Drag & Drop)">
//       <Layout>
//         <Layout.Section>
//           <Card>
//             <Box padding="400">
//               <Form id="template-form" method="post">
//                 {/* If updating existing template */}
//                 {template?.id ? <input type="hidden" name="id" value={template.id} /> : null}

//                 <BlockStack gap="400">
//                   <Text variant="headingMd" as="h2">
//                     Template Details
//                   </Text>

//                   <TextField
//                     label="Template name"
//                     name="name"
//                     value={name}
//                     onChange={setName}
//                     autoComplete="off"
//                     requiredIndicator
//                   />

//                   <TextField
//                     label="Subject"
//                     name="subject"
//                     value={subject}
//                     onChange={setSubject}
//                     autoComplete="off"
//                     helpText="Supports placeholders: {{discount}}, {{percentage}}, {{product}}, {{url}}"
//                     requiredIndicator
//                   />

//                   <Box>
//                     <Text as="p" tone="subdued">
//                       Drag & drop to design your email below. We’ll save the HTML/CSS exactly as generated.
//                     </Text>
//                   </Box>

//                   <Box borderRadius="300" padding="100" background="bg-surface-secondary">
//                     <div ref={editorElRef} />
//                   </Box>

//                   {/* Hidden fields GrapesJS saves into */}
//                   <input type="hidden" name="html" />
//                   <input type="hidden" name="css" />

//                   <InlineStack gap="200">
//                     <Button
//                       loading={navigation.state === "submitting"}
//                       onClick={onSave}
//                     >
//                       Save Template
//                     </Button>
//                   </InlineStack>
//                 </BlockStack>
//               </Form>
//             </Box>
//           </Card>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }
