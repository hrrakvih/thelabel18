import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackShipmentByAWB } from "@/lib/shiprocket";
import { readShipmentTracking } from "@/lib/shipment-status";
import { saveDeliveredShipment } from "@/lib/shipment-sync";

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
    const tracking = readShipmentTracking(raw);
    let orderStatus = order.status;
    if (tracking.delivered) {
      const updated = await saveDeliveredShipment(order.id, order.tracking_number);
      if (updated) orderStatus = "delivered";
    }

    return NextResponse.json({
      tracked: true,
      status: tracking.label || orderStatus,
      order_status: orderStatus,
      tracking_number: order.tracking_number,
      courier_name: order.courier_name ?? tracking.courier ?? null,
      tracking_url: order.tracking_url ?? tracking.url,
      etd: tracking.etd,
      activities: tracking.activities,
    });
  } catch (err: unknown) {
    // Fall back gracefully — return basic info without live tracking
    return NextResponse.json({
      tracked: false,
      status: order.status,
      tracking_number: order.tracking_number,
      courier_name: order.courier_name ?? null,
      tracking_url: order.tracking_url ?? null,
      activities: [],
      error: err instanceof Error ? err.message : "Unable to fetch shipment tracking.",
    });
  }
}
