// Test script to verify email functionality
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const testData = {
  name: "Test User",
  email: "test@example.com", 
  phone: "12345678",
  company: "Demo Company",
  message: "Test email functionality - this is a test message to verify the email system is working properly.",
  products: [
    {
      product: {
        name: "Test Product 1",
        price: 100
      },
      quantity: 1,
      totalPrice: 100
    },
    {
      product: {
        name: "Test Product 2", 
        price: 200
      },
      quantity: 2,
      totalPrice: 400
    }
  ]
};

async function testEmail() {
  try {
    console.log('🧪 Testing email functionality...');
    console.log('📤 Sending test quote request...');
    
    const apiKey = process.env.API_KEY || process.env.VITE_API_KEY || '';
    if (!apiKey) {
      console.warn('Warning: API key is not set in environment. Set API_KEY or VITE_API_KEY in project/.env');
    }
    const response = await fetch('http://localhost:5000/send-quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    const receiver = process.env.RECEIVER_EMAIL || process.env.SMTP_USER || '';
    console.log('📧 Expected receiver:', receiver);
    if (response.ok) {
      console.log('✅ SUCCESS! Email sent successfully');
      console.log(`📧 Check ${receiver} for the email`);
      console.log('📋 Response:', result);
    } else {
      console.log('❌ FAILED! Error sending email');
      console.log('📧 Intended receiver:', receiver);
      console.log('📋 Error:', result);
    }
  } catch (error) {
    console.log('❌ FAILED! Network or server error');
    console.log('📋 Error:', error.message);
  }
}

testEmail();
