'use server';

import { z } from 'zod';
import { sendEmail } from '@/lib/email';

const preQualSchema = z.object({
    formData: z.object({
        company: z.string().min(1, "Company name is required"),
        contact: z.string().min(1, "Contact name is required"),
        email: z.string().email("Invalid email address"),
        phone: z.string().min(10, "Phone number is required"),
        units: z.string().min(1, "Number of units is required"),
        appliances: z.string().min(1, "Appliances needed is required"),
        years: z.string().min(1, "Years in business is required"),
        start: z.string().optional(),
        locationNotes: z.string().optional(),
        consent: z.boolean().optional(),
    }),
    selectedRegions: z.array(z.string()),
    selectedCities: z.array(z.string()),
});

export async function submitPreQual(rawData: any) {
    const validation = preQualSchema.safeParse(rawData);
    if (!validation.success) {
        console.error("Pre-qual validation failed:", validation.error.format());
        return { success: false, error: validation.error.errors[0].message };
    }

    const { formData, selectedRegions, selectedCities } = validation.data;

    const subject = `[PRE-QUAL] ${formData.company} - ${formData.units} Units`;

    const body = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #0f172a;">New Quick Pre-Qualification Submission</h2>
            <p><strong>Company:</strong> ${formData.company}</p>
            <p><strong>Contact:</strong> ${formData.contact}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Phone:</strong> ${formData.phone}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p><strong>Units Managed:</strong> ${formData.units}</p>
            <p><strong>Appliances Needed:</strong> ${formData.appliances}</p>
            <p><strong>Years in Business:</strong> ${formData.years}</p>
            <p><strong>Preferred Start:</strong> ${formData.start || 'N/A'}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p><strong>Regions Selected:</strong> ${selectedRegions.join(', ')}</p>
            <p><strong>Cities/Towns:</strong> ${selectedCities.join(', ')}</p>
            <p><strong>Additional Notes:</strong> ${formData.locationNotes || 'None'}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p><small style="color: #64748b;">Consent given: ${formData.consent ? 'Yes' : 'No'}</small></p>
        </div>
    `;

    const result = await sendEmail({
        to: 'brad.vargason@gmail.com',
        subject: subject,
        html: body,
    });

    if (!result.success) {
        console.error("Leasing Email failed:", result.error);
        return { success: false, error: result.error };
    }

    return { success: true };
}

