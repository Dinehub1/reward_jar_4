# HTTPS Setup for Local Development

This project has been configured to run with HTTPS for local development, which is required for testing Apple Wallet functionality on iOS devices.

## Prerequisites

- Node.js and npm installed
- mkcert for generating local SSL certificates

## Setup

### 1. SSL Certificates

The project includes locally trusted SSL certificates generated with mkcert for the following domains:
- `172.20.10.4` (your local IP)
- `localhost`
- `127.0.0.1`

Certificates are located in the `certificates/` directory:
- `certificates/cert.pem` - SSL certificate
- `certificates/key.pem` - Private key

### 2. Running the HTTPS Server

To start the development server with HTTPS:

```bash
npm run dev:https
```

This will start:
- HTTPS server on port 3001: `https://172.20.10.4:3001`
- HTTP redirect server on port 3000: `http://172.20.10.4:3000` (redirects to HTTPS)

### 3. Accessing the Application

- **HTTPS**: `https://172.20.10.4:3001`
- **HTTP** (redirects to HTTPS): `http://172.20.10.4:3000`

## Testing on iPhone

1. Connect your iPhone to the same WiFi network
2. Open Safari on your iPhone
3. Navigate to `https://172.20.10.4:3001`
4. You may see a security warning - tap "Advanced" then "Proceed to 172.20.10.4 (unsafe)"
5. The WalletPreviewPage should now work correctly for Apple Wallet testing

## Certificate Trust Issues

If you encounter certificate trust issues:

1. The certificates are signed by a local CA that isn't installed system-wide
2. You can manually trust the certificate in your browser
3. For production, you would need proper SSL certificates from a trusted CA

## Files Modified

- `server.js` - Custom HTTPS server with HTTP redirect
- `package.json` - Added `dev:https` script
- `certificates/` - Directory containing SSL certificates

## Security Note

The generated certificates are for development only and should not be used in production. The `certificates/` directory is excluded from version control for security reasons. 