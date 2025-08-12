// Simple test to check what the dashboard-unified API returns
const https = require('https');

// We'll need to test with proper authentication headers
// But first let's just see the raw response structure

console.log('Testing dashboard-unified API...');

// This will fail with auth error, but we can see the response structure
const testApi = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/admin/dashboard-unified');
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// We can't easily test this without proper auth setup in Node.js
// Let's check the materialized view we created instead
console.log('Check if this script can run in browser console of the admin dashboard');