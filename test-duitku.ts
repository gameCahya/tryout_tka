#!/usr/bin/env node
// Test script to verify Duitku API connectivity
import DuitkuPayment from './lib/duitku';

async function testDuitkuConnection() {
  console.log('Testing Duitku connection...');
  
  try {
    // Check if environment variables are set
    if (!process.env.DUITKU_MERCHANT_CODE) {
      console.error('❌ DUITKU_MERCHANT_CODE environment variable is not set');
      return;
    }
    
    if (!process.env.DUITKU_API_KEY) {
      console.error('❌ DUITKU_API_KEY environment variable is not set');
      return;
    }
    
    console.log('✅ Environment variables are set');
    console.log('Merchant Code:', process.env.DUITKU_MERCHANT_CODE.replace(/.(?=.{3})/g, '*')); // Mask for security
    console.log('Base URL:', process.env.DUITKU_BASE_URL || 'https://sandbox.duitku.com');
    
    const duitku = new DuitkuPayment();
    console.log('✅ Duitku instance created successfully');
    
  } catch (error: any) {
    console.error('❌ Error creating Duitku instance:', error.message);
  }
}

// Run the test
testDuitkuConnection();