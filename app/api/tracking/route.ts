import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackShipmentByAWB } from "@/lib/shiprocket";

/**
 * GET /api/tracking?orderId=<uuid>
 *
 * Fetches live Shiprocket tracking for an order.
 * Requires the user to own the order (verified via Supabase auth).
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load the order and verify ownership
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, user_id, status, tracking_number, courier_name, tracking_url, shiprocket_order_id")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // If no tracking number, return what we have from the DB
  if (!order.tracking_number) {
    return NextResponse.json({
      tracked: false,
      status: order.status,
      tracking_number: null,
      courier_name: null,
      tracking_url: null,
      activities: [],
    });
  }

  try {
    const raw = await trackShipmentByAWB(order.tracking_number);
    // Shiprocket returns: tracking_data.shipment_track_activities
    const trackData = raw?.tracking_data;
    const activities: any[] = trackData?.shipment_track_activities ?? [];
    const latestStatus = trackData?.track_status ?? order.status;
    const etd = trackData?.etd ?? null;

    return NextResponse.json({
      tracked: true,
      status: latestStatus,
      tracking_number: order.tracking_number,
      courier_name: order.courier_name ?? trackData?.courier_name ?? null,
      tracking_url: order.tracking_url ?? null,
      etd,
      activities: activities.slice(0, 10), // last 10 events
    });
  } catch (err: any) {
    // Fall back gracefully — return basic info without live tracking
    return NextResponse.json({
      tracked: false,
      status: order.status,
      tracking_number: order.tracking_number,
      courier_name: order.courier_name ?? null,
      tracking_url: order.tracking_url ?? null,
      activities: [],
      error: err.message,
    });
  }
}
