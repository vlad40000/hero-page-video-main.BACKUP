'use server';

import { z } from 'zod';
import { sendEmail } from '@/lib/email';

const WholesaleSchema = z.object({
    type: z.enum(['dealer', 'property']),
    email: z.string().email(),
    phone: z.string().min(10, "Phone number is too short"),
    contactName: z.string().min(1, "Contact name is required"),
    businessName: z.string().min(1, "Business name is required"),
    // Optional fields based on type, but we allow them all to be optional strings to simplify
    taxId: z.string().optional(),
    volume: z.string().optional(),
    unitCount: z.string().optional(),
    needs: z.string().optional(),
});

export async function submitCommercialInquiry(formData: FormData) {
    const rawData = {
        type: formData.get('type'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        contactName: formData.get('contactName'),
        businessName: formData.get('businessName'),
        taxId: formData.get('taxId'),
        volume: formData.get('volume'),
        unitCount: formData.get('unitCount'),
        needs: formData.get('needs'),
    };

    const validation = WholesaleSchema.safeParse(rawData);

    if (!validation.success) {
        console.error("Validation failed:", validation.error);
        return { success: false, error: "Invalid form data." };
    }

    const { type, email, phone, contactName: name, businessName, taxId, volume, unitCount, needs } = validation.data;

    let subject = "";
    let bodyContent = "";

    if (type === 'dealer') {
        subject = `[WHOLESALE APPLICATION] ${businessName}`;
        bodyContent = `
          <h2 style="color: #0f172a;">New Dealer Application</h2>
          <p><strong>Business:</strong> ${businessName}</p>
          <p><strong>Contact:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p><strong>Tax ID:</strong> ${taxId}</p>
          <p><strong>Est. Volume:</strong> ${volume}</p>
          <p><strong>Interests:</strong> ${needs}</p>
        `;
    } else {
        subject = `[PROPERTY ACCOUNT] ${businessName}`;
        bodyContent = `
          <h2 style="color: #0f172a;">New Property Management Inquiry</h2>
          <p><strong>Property:</strong> ${businessName}</p>
          <p><strong>Manager:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p><strong>Total Units:</strong> ${unitCount}</p>
          <p><strong>Immediate Needs:</strong> ${needs}</p>
        `;
    }

    const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            ${bodyContent}
        </div>
    `;

    const result = await sendEmail({
        to: 'brad.vargason@gmail.com',
        subject: subject,
        html: htmlBody,
    });

    if (!result.success) {
        console.error("Commercial Email failed:", result.error);
        return { success: false, error: result.error };
    }

    return { success: true };
}
