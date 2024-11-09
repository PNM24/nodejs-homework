const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const { SENDGRID_API_KEY, SENDGRID_SENDER_EMAIL } = process.env;

if (!SENDGRID_API_KEY || !SENDGRID_SENDER_EMAIL) {
  console.error('SendGrid configuration missing');
  throw new Error('SendGrid configuration missing');
}

sgMail.setApiKey(SENDGRID_API_KEY);

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationLink = `${process.env.BASE_URL}/users/verify/${verificationToken}`;

  const msg = {
    to: email,
    from: SENDGRID_SENDER_EMAIL, // Folosește variabila de mediu
    subject: 'Verify your email address',
    html: `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>If you did not create an account, please ignore this email.</p>
    `,
  };

  try {
    console.log('Trying to send email to:', email);
    console.log('From:', SENDGRID_SENDER_EMAIL);
    const result = await sgMail.send(msg);
    console.log('Verification email sent successfully', result);
    return result;
  } catch (error) {
    console.error('SendGrid error:', error);
    if (error.response) {
      console.error('Error response:', error.response.body);
    }
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

module.exports = {
  sendVerificationEmail,
};