import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { checkoutId, channel, paymentIntentId, customerDetails } = await req.json();

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
                userEmail: "${customerDetails.email}"
                billingAddress: {
                  firstName: "${customerDetails.billingAddress.first_name}"
                  lastName: "${customerDetails.billingAddress.last_name}"
                  streetAddress1: "${customerDetails.billingAddress.line1}"
                  streetAddress2: "${customerDetails.billingAddress.line2 || ""}"
                  city: "${customerDetails.billingAddress.city}"
                  postalCode: "${customerDetails.billingAddress.postal_code}"
                  country: "${customerDetails.billingAddress.country}"
                  phone: "${customerDetails.billingAddress.phone || ""}"
                }
                shippingAddress: {
                  firstName: "${customerDetails.shippingAddress.first_name}"
                  lastName: "${customerDetails.shippingAddress.last_name}"
                  streetAddress1: "${customerDetails.shippingAddress.line1}"
                  streetAddress2: "${customerDetails.shippingAddress.line2 || ""}"
                  city: "${customerDetails.shippingAddress.city}"
                  postalCode: "${customerDetails.shippingAddress.postal_code}"
                  country: "${customerDetails.shippingAddress.country}"
                  phone: "${customerDetails.shippingAddress.phone || ""}"
                }
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
