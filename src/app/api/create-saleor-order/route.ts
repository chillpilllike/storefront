import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { checkoutId, channel, paymentIntentId } = await req.json();

    const response = await fetch(`${process.env.SALEOR_API_URL}/graphql/`, {
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
                  { key: "StripePaymentId", value: "${paymentIntentId}" }
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

    const saleorResponse = await response.json();
    if (saleorResponse.errors) {
      throw new Error(saleorResponse.errors[0].message);
    }

    const orderId = saleorResponse.data.orderCreate.order.id;
    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
