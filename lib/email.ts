import { Resend } from 'resend';

interface SendEmailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ 
  from = 'Road Runner Appliance <onboarding@resend.dev>', 
  to, 
  subject, 
  html 
}: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected email error:', error);
    return { success: false, error: 'An unexpected error occurred while sending the email.' };
  }
}
