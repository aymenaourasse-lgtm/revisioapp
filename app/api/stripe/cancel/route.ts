import { NextRequest } from "next/server";
import Stripe from "stripe";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

    const { getDoc } = await import("firebase/firestore");
    const userSnap = await getDoc(doc(db, "users", userId));
    if (!userSnap.exists()) return Response.json({ error: "User not found" }, { status: 404 });

    const userData = userSnap.data();
    const subscriptionId = userData.subscriptionId;
    if (!subscriptionId) return Response.json({ error: "No subscription found" }, { status: 400 });

    await stripe.subscriptions.cancel(subscriptionId);

    await updateDoc(doc(db, "users", userId), {
      plan: "free",
      subscriptionId: null,
    });

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}