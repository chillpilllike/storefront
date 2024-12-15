"use client";

import { useState } from "react";

type Props = {
  disabled?: boolean;
  checkoutId?: string;
  channel: string;
  items: Array<any>; // Array of items to send to the Stripe Checkout API
  className?: string;
};

export const CheckoutLink = ({ disabled, checkoutId, channel, items, className = "" }: Props) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (disabled || !checkoutId || !items.length) return;

    setLoading(true);

    try {
      // Call the create-checkout-session API to create a Stripe Checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          checkoutId,
          channel,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to the Stripe-hosted checkout page
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create Stripe Checkout session.");
      }
    } catch (error) {
      console.error(error);
      alert("Error redirecting to checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      disabled={loading || disabled}
      onClick={handleCheckout}
      className={`inline-block max-w-full rounded border border-transparent bg-neutral-900 px-6 py-3 text-center font-medium text-neutral-50 hover:bg-neutral-800 aria-disabled:cursor-not-allowed aria-disabled:bg-neutral-500 sm:px-16 ${className}`}
    >
      {loading ? "Redirecting..." : "Checkout"}
    </button>
  );
};
