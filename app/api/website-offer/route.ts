import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const WebsiteOfferSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  phone: z.string().trim().min(10, 'Phone number is required.'),
  applianceInterest: z.string().trim().min(2, 'Appliance interest is required.'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = WebsiteOfferSchema.parse(body);

    const recipientEmail = process.env.LEAD_NOTIFICATION_EMAIL || 'brad.vargason@gmail.com';

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #0f172a;">New Website Offer Lead</h2>
        <p><strong>Offer:</strong> 10% off purchase for mentioning the website</p>
        <p><strong>First name:</strong> ${validatedData.firstName}</p>
        <p><strong>Phone:</strong> ${validatedData.phone}</p>
        <p><strong>Looking for:</strong> ${validatedData.applianceInterest}</p>
        <p><strong>Source:</strong> Homepage website offer form</p>
      </div>
    `;

    const result = await sendEmail({
      to: recipientEmail,
      subject: `Website Offer Lead: ${validatedData.firstName} — ${validatedData.applianceInterest}`,
      html: htmlBody,
    });

    if (!result.success) {
      console.error('Website offer email error:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Website offer lead error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid request.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send website offer lead.' },
      { status: 500 }
    );
  }
}
