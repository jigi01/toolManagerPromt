import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.msndr.net',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email, code) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials missing. Skipping email.');
    return;
  }

  const mailOptions = {
    from: '"ToolManager" <info@toolmanager.ru>', // Sender address verified in NotiSend
    to: email,
    subject: 'Код подтверждения регистрации - ToolManager',
    html: `
    <html>
      <body>
        <h1>Добро пожаловать в ToolManager!</h1>
        <p>Ваш код подтверждения регистрации:</p>
        <h2 style="font-size: 24px; color: #3182CE; letter-spacing: 5px;">${code}</h2>
        <p>Код действителен в течение 10 минут.</p>
      </body>
    </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully. Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
};
