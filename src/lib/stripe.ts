import Stripe from "stripe";
import { env } from "./env";

export function getStripe() {
  return new Stripe(env("STRIPE_SECRET_KEY"), {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export const cryptoProvider = Stripe.createSubtleCryptoProvider();
