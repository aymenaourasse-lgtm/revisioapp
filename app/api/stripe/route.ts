import Stripe from "stripe";
import { NextRequest } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { priceId, email } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "paypal"],
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    custom_text: {
      submit: {
        message: "Ton abonnement sera actif immédiatement après le paiement.",
      },
    },
  });

  return Response.json({ url: session.url });
}