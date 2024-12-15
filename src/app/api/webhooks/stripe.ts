import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const payload = req.body;
  const sig = req.headers["stripe-signature"] as string;

  try {
    const event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { checkoutId, channel } = session.metadata;

      // Create an order in Saleor via API
      await fetch(`${process.env.SALEOR_API_URL}/graphql/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SALEOR_API_TOKEN}`,
        },
        body: JSON.stringify({
          query: `
            mutation {
              orderCreate(
                input: {
                  checkoutId: "${checkoutId}"
                  channel: "${channel}"
                  metadata: [
                    { key: "StripePaymentId", value: "${session.payment_intent}" }
                  ]
                }
              ) {
                order {
                  id
                }
              }
            }
          `,
        }),
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
}
