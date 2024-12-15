import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2022-11-15" });

export async function POST(req: NextRequest) {
  try {
    const { items, checkoutId, channel } = await req.json();

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: item.currency,
        product_data: {
          name: item.name,
          images: [item.imageUrl],
        },
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: "customer@example.com", // Optional pre-filled email
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["US", "AU", "GB", "CA"], // Adjust as per your needs
      },
      success_url: `${process.env.NEXT_PUBLIC_HOST}/order-confirmation?checkoutId=${checkoutId}&channel=${channel}&sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_HOST}/cart`,
      metadata: { checkoutId, channel },
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
