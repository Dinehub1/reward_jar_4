// Fix Google Service Account Private Key
const fs = require('fs')

// Read current .env.local
const envContent = fs.readFileSync('.env.local', 'utf8')

// Extract the private key line
const privateKeyLine = envContent.split('\n').find(line => line.startsWith('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY='))

if (privateKeyLine) {
  // Extract the key value (everything after =)
  let keyValue = privateKeyLine.split('=')[1]
  
  // Remove quotes if present
  if (keyValue.startsWith('"') && keyValue.endsWith('"')) {
    keyValue = keyValue.slice(1, -1)
  }
  
  // Decode URL encoding
  keyValue = decodeURIComponent(keyValue)
  
  // Ensure proper newlines
  keyValue = keyValue.replace(/\\n/g, '\n')
  
  // Validate it's a proper PEM format
  if (keyValue.includes('-----BEGIN PRIVATE KEY-----') && keyValue.includes('-----END PRIVATE KEY-----')) {
    console.log('✅ Private key format looks correct')
    console.log('First 100 chars:', keyValue.substring(0, 100))
    console.log('Last 100 chars:', keyValue.substring(keyValue.length - 100))
    
    // Write corrected key back to .env.local
    const newPrivateKeyLine = `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="${keyValue.replace(/\n/g, '\\n')}"`
    const newEnvContent = envContent.replace(privateKeyLine, newPrivateKeyLine)
    
    fs.writeFileSync('.env.local', newEnvContent)
    console.log('✅ Private key fixed in .env.local')
  } else {
    console.log('❌ Private key format is invalid')
  }
} else {
  console.log('❌ GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY not found in .env.local')
}
