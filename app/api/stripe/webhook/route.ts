import Stripe from "stripe";
import { NextRequest } from "next/server";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../../../firestore";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return new Response("Webhook error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_email;

    if (email) {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snap = await getDocs(q);
      await Promise.all(
        snap.docs.map((d) =>
          setDoc(doc(db, "users", d.id), {
            plan: "pro",
            stripeCustomerId: session.customer,
            subscriptionId: session.subscription,
          }, { merge: true })
        )
      );
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const q = query(collection(db, "users"), where("subscriptionId", "==", subscription.id));
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs.map((d) =>
        setDoc(doc(db, "users", d.id), { plan: "free" }, { merge: true })
      )
    );
  }

  return new Response("OK", { status: 200 });
}