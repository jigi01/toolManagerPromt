import 'dotenv/config';
import nodemailer from 'nodemailer';

const testEmail = async () => {
    console.log('📧 Testing SMTP Email Sending (NotiSend)...');

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.error('❌ SMTP credentials missing in .env');
        console.log('Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
        return;
    }

    console.log(`⚙️  Config: ${SMTP_HOST}:${SMTP_PORT} (${SMTP_USER})`);

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '465'),
        secure: true,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    try {
        console.log('🔄 Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection successful!');

        console.log('🚀 Sending test email...');
        const info = await transporter.sendMail({
            from: `"ToolManager Test" <info@toolmanager.ru>`,
            to: SMTP_USER, // Send to self (or change to your email)
            subject: 'Test Email from ToolManager (SMTP)',
            html: '<h1>It Works!</h1><p>Email sending is configured correctly.</p>',
        });

        console.log('✅ Email sent successfully!');
        console.log('🆔 Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

testEmail();
