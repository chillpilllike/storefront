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
    const finalizeOrder = async () => {
      try {
        if (!checkoutId || !channel || !sessionId) {
          setError("Invalid request. Missing required parameters.");
          setLoading(false);
          return;
        }

        // Verify Stripe payment
        const paymentResponse = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const paymentData = await paymentResponse.json();
        if (!paymentData.success) {
          setError("Payment verification failed.");
          setLoading(false);
          return;
        }

        // Create Saleor order
        const orderResponse = await fetch("/api/create-saleor-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutId,
            channel,
            paymentIntentId: paymentData.paymentIntentId,
            customerDetails: paymentData.customerDetails,
          }),
        });

        const orderData = await orderResponse.json();
        if (!orderData.success) {
          setError("Failed to create order in Saleor.");
          setLoading(false);
          return;
        }

        // Redirect to order details page
        router.push(`/order-details/${orderData.orderId}`);
      } catch (e: any) {
        console.error(e);
        setError("Something went wrong.");
        setLoading(false);
      }
    };

    finalizeOrder();
  }, [checkoutId, channel, sessionId]);

  if (loading) {
    return <div>Loading... Please wait.</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return null;
};

export default OrderConfirmationPage;
