import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testQuoteSubmission() {
  try {
    // Read test data
    const testData = JSON.parse(
      await fs.readFile(
        path.join(process.cwd(), 'test', 'test-quote.json'),
        'utf8'
      )
    );

    // Get API key from environment
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY not set in environment');
    }

    console.log('🚀 Sending test quote request...');
    console.log('📧 Admin emails configured:', process.env.RECEIVER_EMAIL);

    // Send request to local server
    const response = await fetch('http://localhost:5000/send-quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Test successful!');
      console.log('Response:', result);
    } else {
      console.log('❌ Test failed!');
      console.log('Status:', response.status);
      console.log('Response:', result);
    }

  } catch (error) {
    console.error('❌ Error running test:', error);
  }
}

testQuoteSubmission();
