import { Resend } from 'resend';

let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.error('RESEND_API_KEY is not set. Password reset emails will not be sent.');
}

export const sendResetEmail = async (to, resetToken) => {
  if (!resend) {
    throw new Error('Email service is not configured (missing RESEND_API_KEY).');
  }
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
