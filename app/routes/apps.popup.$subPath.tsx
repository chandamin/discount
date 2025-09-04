// app/routes/apps.worker.$path.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs} from "@remix-run/node";
import prisma from "~/db.server";
import fs from "fs";
import path from "path";
import { json } from "@remix-run/node";


type DiscountEntity = {
  id: string;
  title: string;
  url: string;
};

type DiscountResponse = {
  heading: string;
  message: string;
};
export async function loader({ params, request }: LoaderFunctionArgs) {
  console.log(params.subPath,"subpath");
  const subPath = params.subPath; // e.g. "fcm-sw" or "popup"

  if (subPath === "fcm-sw") {
    try {
      const filePath = path.resolve("public/firebase-messaging-sw.js");
      const js = fs.readFileSync(filePath, "utf-8");
      return new Response(js, {
        status: 200,
        headers: { "Content-Type": "application/javascript" },
      });
    } catch (err) {
      console.error("Error serving FCM SW:", err);
      return new Response("Not found", { status: 404 });
    }
  }

  // Serve popup JSON
  if (subPath === "popup") {
    const shop =
      request.headers.get("x-shop-domain") ||
      new URL(request.url).searchParams.get("shop");

     if (!shop) {
      return json<DiscountResponse>(
        {
          heading: "No shop found",
          message: "Shop domain missing.",
        },
        { status: 400 }
      );
    }

    console.log("Shop:", shop);

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));

    // const latestActiveTodayPayloads = await prisma.discountPayload.findMany({
    //   where: {
    //     status: 'ACTIVE',
        // updatedAt: {
        //   gte: startOfToday,
        //   lte: endOfToday,
        // },
    //   },
    //   orderBy: {
    //     updatedAt: 'desc',
    //   },
    //   take: 2,
    //   select: {
    //     title: true,
    //   }
    // });
//       const test = await prisma.discount.findMany({
//   include: {
//     payload: true,
//   },
// });
// console.log(test,"test");
     const latestActiveTodayDiscounts = await prisma.discount.findMany({
      where: {
        startsAt: {
          lte: endOfToday
        },
        OR: [
          { endsAt: null }, // No end date → still active
          { endsAt: { gte: startOfToday } },
        ],
        payload: {
          is: {
            status: 'ACTIVE',
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 1,
      select: {
        title: true,
        code: true,
        products: true,
        collections: true,
        productPercentage: true,
        orderPercentage: true,   
        deliveryPercentage: true,
        payload: {
          select: {
            status: true,
          }
        }
      },
    });
    console.log(latestActiveTodayDiscounts,"Disssss")
    if (latestActiveTodayDiscounts.length === 0) {
      return new Response(null, { status: 204 });
    }
    // Discount Heading
    const heading = `🔥 ${latestActiveTodayDiscounts
    .map((d) => {
      let title = d.title;
      if (d.code) {
        title = ` Use Code: ${d.code}`;
      }
      return title;
    })
    .join(" & ")}`;

    const message = latestActiveTodayDiscounts
      .map((d) => {
        const products: DiscountEntity[] = (d.products as DiscountEntity[]) || [];
        const collections: DiscountEntity[] = (d.collections as DiscountEntity[]) || [];

        const productLinks = products
          .map((p) => `<a href="${p.url}" target="_blank">${p.title}</a>`)
          .join(", ");

        const collectionLinks = collections
          .map((c) => `<a href="${c.url}" target="_blank">${c.title}</a>`)
          .join(", ");

        const links = [productLinks, collectionLinks].filter(Boolean).join(", ");

        const percentage =
          d.productPercentage ||
          d.orderPercentage ||
          d.deliveryPercentage ||
          0;

        return `<strong>${percentage}% OFF</strong>${links ? " on " + links : ""}`;
      })
      .join(" | ");

      return json<DiscountResponse>({
      heading,
      message,
    });
  }
  
  return json({ heading: "Invalid subPath", message: "" }, { status: 404 });
  // return new Response("Not found", { status: 404 });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const subPath = params.subPath;

  const shop =
      request.headers.get("x-shop-domain") ||
      new URL(request.url).searchParams.get("shop");

  if (!shop) {
    return json({ error: "Shop not found" }, { status: 400 });
  }
  if (subPath === "fcm-sw") {
  try {
    const method = request.method;

    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "POST") {
      // Save or update token
      await prisma.fcmToken.upsert({
        where: { token, shop },
        update: { updatedAt: new Date() },
        create: { token, shop },
      });

      console.log(`Saved FCM token: ${token}`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "DELETE") {
      await prisma.fcmToken.deleteMany({
        where: { token, shop },
      });

      console.log(`Deleted FCM token: ${token}`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error handling FCM token:", error);

    return new Response(JSON.stringify({ error: "Failed to process token" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

   if (subPath === "capture") {
      try {
        const formData = await request.formData();
          const email = formData.get("email")?.toString();
          const phone = formData.get("phone")?.toString();
          const shop = formData.get("shop")?.toString();

        // const body = await request.json();

        // const email = body.email?.toString().trim();
        // const phone = body.phone?.toString().trim();

        if (!email && !phone) {
          return new Response(
            JSON.stringify({ error: "Missing email or phone" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (!shop) {
          return new Response(
            JSON.stringify({ error: "Missing shop identifier" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        await prisma.subscriber.create({
          data: {
            email: email || null,
            phone: phone || null,
            shop,  
          },
        });

        console.log(`Saved contact: email=${email}, phone=${phone}`);
        return json({success: true})

        // return new Response(JSON.stringify({ success: true }), {
        //   status: 200,
        //   headers: { "Content-Type": "application/json" },
        // });
      } catch (error:any) {
        console.error("Error saving contact:", error);
        // return new Response(JSON.stringify({ error: "Failed to save contact" }), {
        //   status: 500,
        //   headers: { "Content-Type": "application/json" },
        // });
        return new Response(
          JSON.stringify({ error: error.message || "Failed to save contact" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
}


  return new Response("Not found", { status: 404 });
}
