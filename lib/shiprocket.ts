import 'server-only';

/**
 * Shiprocket API helper — server-side only.
 * Handles token caching so we don't hit /auth/login on every request.
 */

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

let _cachedToken: string | null = null;
let _tokenExpiry: number = 0;

export async function getShiprocketToken(): Promise<string> {
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) throw new Error("Shiprocket credentials are missing from server environment variables.");
  const now = Date.now();
  if (_cachedToken && _tokenExpiry > now) return _cachedToken;

  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Shiprocket login failed (${res.status}). Check the API user credentials.`);
  }

  const data = await res.json();
  if (!data.token || typeof data.token !== "string") throw new Error("Shiprocket returned no authentication token.");
  _cachedToken = data.token as string;
  // Tokens last ~24h; refresh 30 min before expiry to be safe
  _tokenExpiry = now + 23 * 60 * 60 * 1000;
  return _cachedToken!;
}

/** Track a shipment by AWB (tracking number) */
export async function trackShipmentByAWB(awb: string) {
  const token = await getShiprocketToken();
  const res = await fetch(`${SHIPROCKET_BASE}/courier/track/awb/${awb}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Shiprocket track failed: ${res.status}`);
  return res.json();
}

/** Track a shipment by Shiprocket order ID */
export async function trackShipmentByOrderId(shiprocketOrderId: string) {
  const token = await getShiprocketToken();
  const res = await fetch(
    `${SHIPROCKET_BASE}/orders/show/${shiprocketOrderId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`Shiprocket order show failed: ${res.status}`);
  return res.json();
}

export class ShiprocketRequestError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ShiprocketRequestError' }
}

export async function shiprocketRequest(path: string, payload: Record<string, unknown>) {
  const token = await getShiprocketToken()
  const response = await fetch(`${SHIPROCKET_BASE}${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), cache: 'no-store', signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) {
    let detail = ''
    if ([400, 422].includes(response.status)) {
      const body = await response.json().catch(() => null)
      const errors = body?.errors
      detail = errors && typeof errors === 'object'
        ? Object.entries(errors).map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : String(messages)}`).join('; ')
        : typeof body?.message === 'string' ? body.message : ''
    }
    throw new ShiprocketRequestError(response.status, `Shiprocket request failed (${response.status}).${detail ? ` ${detail.slice(0, 1500)}` : ' Check your Shiprocket account before retrying.'}`)
  }
  return response.json()
}

export type PickupLocation = { name: string; address: string }

export async function getPickupLocations(): Promise<PickupLocation[]> {
  const token = await getShiprocketToken()
  const response = await fetch(`${SHIPROCKET_BASE}/settings/company/pickup`, {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) throw new Error(`Unable to load Shiprocket pickup locations (${response.status}).`)
  const result = await response.json()
  const addresses: unknown = result.data?.shipping_address
  if (!Array.isArray(addresses)) throw new Error('Shiprocket returned an invalid pickup location list.')
  return addresses.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && typeof item.pickup_location === 'string')
    .map(item => ({ name: String(item.pickup_location), address: [item.address, item.city, item.pin_code].filter(Boolean).join(', ') }))
}
