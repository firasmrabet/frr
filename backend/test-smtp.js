import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing SMTP Configuration...');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS length:', process.env.SMTP_PASS?.length);
console.log('SMTP_PASS (masked):', process.env.SMTP_PASS?.replace(/./g, '*'));

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    debug: true, // Enable debug output
    logger: true // Log to console
});

console.log('\n🔌 Testing SMTP connection...');

transporter.verify((error, success) => {
    if (error) {
        console.log('❌ SMTP Connection Failed:');
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        console.log('Error response:', error.response);
    } else {
        console.log('✅ SMTP Connection Successful!');
        console.log('Server is ready to take our messages');
    }
});
