// app/admin/orders/invoice/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ---- Palette ----
const GOLD = rgb(0.831, 0.686, 0.216)      // #D4AF37
const INK = rgb(0.08, 0.08, 0.08)
const MUTED = rgb(0.45, 0.44, 0.42)
const FAINT = rgb(0.62, 0.60, 0.57)
const LINE = rgb(0.88, 0.87, 0.84)
const PANEL = rgb(0.976, 0.968, 0.949)     // warm off-white band
const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 50

// ---- Company info ----
const COMPANY = {
  name: 'THE LABEL 18',
  tagline: 'Luxury Fashion House',
  addressLines: [
    '#15 Elements Building, 4th Floor',
    '32nd Cross, Jayanagar 7th Block',
    'Bengaluru, KA 560070',
  ],
  phone: '+91 98868 23456',
  email: 'contact@thelabel18.com',
}

type RouteParams = Promise<{ id: string }>
async function resolveParams(params: RouteParams): Promise<{ id: string }> {
  return await params
}

export async function GET(
  _req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await resolveParams(params)

    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        id, status, subtotal, discount_amount, total, coupon_code, created_at,
        ship_full_name, ship_phone, ship_line1, ship_line2, ship_city, ship_state, ship_postal_code, ship_country,
        items:order_items ( id, product_name, variation_label, unit_price, quantity, line_total )
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('[invoice route] supabase error:', error.message)
      return NextResponse.json({ error: `Order lookup failed: ${error.message}` }, { status: 500 })
    }
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const pdfBytes = await buildInvoicePdf(order)

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.id.slice(0, 8).toUpperCase()}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[invoice route] unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error generating invoice'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function buildInvoicePdf(order: {
  id: string
  status: string
  subtotal: number
  discount_amount: number
  total: number
  coupon_code: string | null
  created_at: string
  ship_full_name: string
  ship_phone: string
  ship_line1: string
  ship_line2: string | null
  ship_city: string
  ship_state: string
  ship_postal_code: string
  ship_country: string
  items: {
    id: string
    product_name: string
    variation_label: string | null
    unit_price: number
    quantity: number
    line_total: number
  }[]
}) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - 56

  function text(
    str: string,
    x: number,
    yy: number,
    opts: { size?: number; f?: typeof font; color?: ReturnType<typeof rgb> } = {}
  ) {
    page.drawText(str, {
      x,
      y: yy,
      size: opts.size ?? 10,
      font: opts.f ?? font,
      color: opts.color ?? INK,
    })
  }

  function textRight(
    str: string,
    rightX: number,
    yy: number,
    opts: { size?: number; f?: typeof font; color?: ReturnType<typeof rgb> } = {}
  ) {
    const f = opts.f ?? font
    const size = opts.size ?? 10
    const w = f.widthOfTextAtSize(str, size)
    text(str, rightX - w, yy, opts)
  }

  function line(yy: number, color = LINE, thickness = 0.75) {
    page.drawLine({
      start: { x: MARGIN, y: yy },
      end: { x: PAGE_W - MARGIN, y: yy },
      thickness,
      color,
    })
  }

  const rightEdge = PAGE_W - MARGIN

  // ================= HEADER =================
  text(COMPANY.name, MARGIN, y, { size: 21, f: bold, color: INK })
  textRight('PH Studio', rightEdge, y, { size: 21, f: bold, color: GOLD })
  y -= 16
  text(COMPANY.tagline, MARGIN, y, { size: 8.5, color: FAINT })
  y -= 18

  // Company address / contact block, left-aligned under the name
  for (const addrLine of COMPANY.addressLines) {
    text(addrLine, MARGIN, y, { size: 8.5, color: MUTED })
    y -= 12
  }
  text(`Tel: ${COMPANY.phone}`, MARGIN, y, { size: 8.5, color: MUTED })
  textRight(COMPANY.email, rightEdge, y, { size: 8.5, color: MUTED })
  y -= 22

  line(y, GOLD, 1.2)
  y -= 30

  // ================= INVOICE META + BILL TO (two columns) =================
  const metaX = rightEdge - 170
  let metaY = y

  text('INVOICE NO.', metaX, metaY, { size: 8, f: bold, color: FAINT })
  textRight(`#${order.id.slice(0, 8).toUpperCase()}`, rightEdge, metaY, { size: 10, f: bold })
  metaY -= 16

  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  text('DATE', metaX, metaY, { size: 8, f: bold, color: FAINT })
  textRight(orderDate, rightEdge, metaY, { size: 10 })
  metaY -= 16

  text('STATUS', metaX, metaY, { size: 8, f: bold, color: FAINT })
  textRight(order.status.toUpperCase(), rightEdge, metaY, { size: 10, f: bold, color: GOLD })

  // Bill To — left column, same vertical band
  text('BILL TO', MARGIN, y, { size: 8, f: bold, color: FAINT })
  y -= 16
  text(order.ship_full_name, MARGIN, y, { size: 12, f: bold, color: INK })
  y -= 15
  const addrLine1 = `${order.ship_line1}${order.ship_line2 ? ', ' + order.ship_line2 : ''}`
  text(addrLine1, MARGIN, y, { size: 9.5, color: MUTED })
  y -= 13
  text(
    `${order.ship_city}, ${order.ship_state} ${order.ship_postal_code}, ${order.ship_country}`,
    MARGIN,
    y,
    { size: 9.5, color: MUTED }
  )
  y -= 13
  text(`Phone: ${order.ship_phone}`, MARGIN, y, { size: 9.5, color: MUTED })

  y -= 34

  // ================= ITEMS TABLE =================
  const colProduct = MARGIN
  const colQty = 350
  const colPrice = 415
  const colTotalRight = rightEdge

  page.drawRectangle({
    x: MARGIN,
    y: y - 8,
    width: PAGE_W - MARGIN * 2,
    height: 24,
    color: PANEL,
  })
  text('ITEM', colProduct + 10, y, { size: 8, f: bold, color: FAINT })
  text('QTY', colQty, y, { size: 8, f: bold, color: FAINT })
  text('UNIT PRICE', colPrice, y, { size: 8, f: bold, color: FAINT })
  textRight('AMOUNT', colTotalRight - 10, y, { size: 8, f: bold, color: FAINT })
  y -= 30

  const items = order.items ?? []

  for (const item of items) {
    if (y < 130) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H])
      y = PAGE_H - 60
    }
    text(item.product_name, colProduct + 10, y, { size: 10, f: bold, color: INK })
    if (item.variation_label) {
      text(item.variation_label, colProduct + 10, y - 13, { size: 8, color: FAINT })
    }
    text(String(item.quantity), colQty, y, { size: 9.5, color: MUTED })
    text(`Rs. ${Number(item.unit_price).toLocaleString('en-IN')}`, colPrice, y, {
      size: 9.5,
      color: MUTED,
    })
    textRight(
      `Rs. ${Number(item.line_total).toLocaleString('en-IN')}`,
      colTotalRight - 10,
      y,
      { size: 10, f: bold, color: INK }
    )
    y -= item.variation_label ? 30 : 22
    line(y + 8)
  }

  y -= 14

  // ================= TOTALS =================
  const totalsLabelX = 370
  text('Subtotal', totalsLabelX, y, { size: 9.5, color: MUTED })
  textRight(`Rs. ${Number(order.subtotal).toLocaleString('en-IN')}`, colTotalRight - 10, y, {
    size: 9.5,
    color: MUTED,
  })
  y -= 17

  if (Number(order.discount_amount) > 0) {
    text(
      `Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}`,
      totalsLabelX,
      y,
      { size: 9.5, color: MUTED }
    )
    textRight(
      `- Rs. ${Number(order.discount_amount).toLocaleString('en-IN')}`,
      colTotalRight - 10,
      y,
      { size: 9.5, color: rgb(0.2, 0.5, 0.3) }
    )
    y -= 17
  }

  y -= 6
  page.drawRectangle({
    x: totalsLabelX - 12,
    y: y - 10,
    width: (colTotalRight) - (totalsLabelX - 12),
    height: 30,
    color: PANEL,
  })
  text('TOTAL PAID', totalsLabelX, y, { size: 11, f: bold, color: INK })
  textRight(`Rs. ${Number(order.total).toLocaleString('en-IN')}`, colTotalRight - 10, y, {
    size: 13,
    f: bold,
    color: GOLD,
  })

  // ================= FOOTER =================
  const footerY = 68
  line(footerY + 20, LINE, 0.75)
  text('Thank you for shopping with The Label 18.', MARGIN, footerY, {
    size: 9,
    f: bold,
    color: INK,
  })
  text('This is a computer-generated invoice and does not require a signature.', MARGIN, footerY - 14, {
    size: 8,
    color: FAINT,
  })
  textRight(COMPANY.email, rightEdge, footerY, { size: 8, color: FAINT })
  textRight(COMPANY.phone, rightEdge, footerY - 14, { size: 8, color: FAINT })

  return pdfDoc.save()
}
