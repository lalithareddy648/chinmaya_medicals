import { Resend } from 'resend';

// Use a placeholder if no key is provided in .env
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_123');

export const sendResetEmail = async (to, resetToken) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Chinmaya Medicals <onboarding@resend.dev>',
      to,
      subject: 'Password Reset Request',
      html: `<p>Use this token to reset your password: <b>${resetToken}</b></p><p>Expires in 15 minutes.</p>`
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }
    console.log('Reset email sent via Resend:', data);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};
