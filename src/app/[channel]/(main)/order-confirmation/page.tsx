import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const OrderConfirmationPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkoutId = searchParams.get("checkoutId");
  const channel = searchParams.get("channel");
  const sessionId = searchParams.get("sessionId");

  useEffect(() => {
    const createOrder = async () => {
      try {
        if (!checkoutId || !channel || !sessionId) {
          setError("Invalid request. Missing required parameters.");
          setLoading(false);
          return;
        }

        // Verify Stripe payment
        const stripeVerification = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const stripeResponse = await stripeVerification.json();
        if (!stripeResponse.success) {
          setError("Payment verification failed. Please contact support.");
          setLoading(false);
          return;
        }

        // Create order in Saleor
        const saleorOrder = await fetch("/api/create-saleor-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutId, channel, paymentIntentId: stripeResponse.paymentIntentId }),
        });

        const saleorResponse = await saleorOrder.json();
        if (!saleorResponse.success) {
          setError("Failed to create order in Saleor. Please contact support.");
          setLoading(false);
          return;
        }

        // Redirect to final confirmation page or display order details
        router.push(`/order-details/${saleorResponse.orderId}`);
      } catch (e: any) {
        console.error(e);
        setError("Something went wrong. Please contact support.");
        setLoading(false);
      }
    };

    createOrder();
  }, [checkoutId, channel, sessionId]);

  if (loading) {
    return <div>Loading... Please wait.</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return null; // Will redirect on success
};

export default OrderConfirmationPage;
