'use server';

import { z } from 'zod';
import { sendEmail } from '@/lib/email';

const bookingSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 characters"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    notes: z.string().optional(),
});

const contextSchema = z.object({
    brand: z.string(),
    category: z.string(),
    model: z.string(),
    serial: z.string().optional(),
    symptom: z.string(),
    verdict: z.string(),
    age: z.union([z.number(), z.string()]),
});

export async function submitBooking(formData: FormData, contextRaw: any) {
    const rawData = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        notes: formData.get('notes') as string,
    };

    const dataValidation = bookingSchema.safeParse(rawData);
    if (!dataValidation.success) {
        return { success: false, error: dataValidation.error.errors[0].message };
    }

    const contextValidation = contextSchema.safeParse(contextRaw);
    if (!contextValidation.success) {
        return { success: false, error: "Invalid diagnostic data provided." };
    }

    const { name, phone, address, notes } = dataValidation.data;
    const context = contextValidation.data;

    // Construct the email body with the diagnostic context
    const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
      <h2 style="color: #0f172a;">New Service Request</h2>
      <p><strong>Customer:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Address:</strong> ${address}</p>
      <p><strong>Notes:</strong> ${notes || 'None'}</p>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      
      <h3 style="color: #0f172a;">Diagnostic Data</h3>
      <ul style="list-style: none; padding: 0;">
        <li style="margin-bottom: 8px;"><strong>Appliance:</strong> ${context.brand} ${context.category}</li>
        <li style="margin-bottom: 8px;"><strong>Model:</strong> ${context.model}</li>
        <li style="margin-bottom: 8px;"><strong>Serial:</strong> ${context.serial || 'N/A'}</li>
        <li style="margin-bottom: 8px;"><strong>Issue:</strong> ${context.symptom}</li>
        <li style="margin-bottom: 8px;"><strong>Verdict:</strong> ${context.verdict}</li>
        <li style="margin-bottom: 8px;"><strong>Estimated Age:</strong> ${context.age} years</li>
      </ul>
    </div>
  `;

    const result = await sendEmail({
        to: 'brad.vargason@gmail.com',
        subject: `New Service Booking: ${context.brand} ${context.category}`,
        html: htmlBody,
    });

    if (!result.success) {
        console.error("Booking email failed:", result.error);
        return { success: false, error: result.error };
    }

    return { success: true };
}

