import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LeadSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  intentType: z.enum(['REPAIR', 'BUY', 'SELL', 'TRIAGE']),
  applianceCategory: z.string().optional(),
  brand: z.string().optional(),
  symptoms: z.string().optional(),
  metadata: z.any().optional(),
});

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readableValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function leadName(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') return null;
  const record = metadata as Record<string, unknown>;
  return record.customerName || record.name || null;
}

function metadataRows(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') return '';
  return Object.entries(metadata as Record<string, unknown>)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:700;">${escapeHtml(key)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;white-space:pre-wrap;">${escapeHtml(readableValue(value))}</td>
      </tr>
    `)
    .join('');
}

function buildLeadEmailHtml(lead: z.infer<typeof LeadSchema>, leadId: string) {
  const name = leadName(lead.metadata);
  const rows = metadataRows(lead.metadata);

  return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;background:#ffffff;">
      <p style="margin:0 0 8px;color:#2563eb;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">Road Runner Appliance Lead</p>
      <h2 style="margin:0 0 18px;color:#0f172a;font-size:24px;">${escapeHtml(lead.intentType)} request${name ? ` from ${escapeHtml(name)}` : ''}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tbody>
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:700;">Lead ID</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(leadId)}</td></tr>
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:700;">Phone</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(readableValue(lead.phone))}</td></tr>
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:700;">Email</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(readableValue(lead.email))}</td></tr>
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:700;">Appliance</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(readableValue(lead.applianceCategory))}</td></tr>
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:700;">Brand</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(readableValue(lead.brand))}</td></tr>
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:700;">Symptoms / Notes</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;white-space:pre-wrap;">${escapeHtml(readableValue(lead.symptoms))}</td></tr>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = LeadSchema.parse(body);

    const result = await db.insert(leads).values({
      ...validatedData,
      status: 'NEW',
    }).returning();

    const leadId = result[0].id;
    const recipientEmail = process.env.LEAD_NOTIFICATION_EMAIL || 'brad.vargason@gmail.com';
    const notification = await sendEmail({
      to: recipientEmail,
      subject: `Road Runner ${validatedData.intentType} lead${leadName(validatedData.metadata) ? ` - ${leadName(validatedData.metadata)}` : ''}`,
      html: buildLeadEmailHtml(validatedData, leadId),
    });

    if (!notification.success) {
      console.error('Lead notification email error:', notification.error);
      return NextResponse.json(
        { success: false, leadId, error: notification.error || 'Lead saved, but email notification failed.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, leadId, emailSent: true });
  } catch (error) {
    console.error('Lead capture error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
