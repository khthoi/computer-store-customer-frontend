import { CartPageReal } from "@/src/components/cart/CartPageReal";

/**
 * /cart — Shopping Cart page.
 *
 * Server component shell; client interactivity lives inside `CartPageReal`,
 * which fetches the cart from the backend and renders the applied promotions
 * with explicit scope / mechanic / status detail.
 */
export default function CartPage() {
  return <CartPageReal />;
}
