import { CheckoutPageReal } from "@/src/components/checkout/page/CheckoutPageReal";

/**
 * /checkout — Shopping Checkout page.
 *
 * Server component shell; `CheckoutPageReal` handles client-side fetching of
 * cart + addresses and the place-order flow. Coupon usage is consumed only
 * after payment is confirmed (COD: order moves to DaXacNhan; VNPay/MoMo:
 * payment webhook).
 */
export default function CheckoutPage() {
  return <CheckoutPageReal />;
}
