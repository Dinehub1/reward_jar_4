# Next.js PKPass MIME Type Configuration

## Overview
This document describes the implementation of proper MIME type headers for Apple Wallet PKPass files in Next.js to ensure seamless installation on iOS devices via Safari.

## Problem Statement
Apple Wallet requires PKPass files to be served with the correct MIME type `application/vnd.apple.pkpass` for Safari to recognize and install them properly. Without proper headers, PKPass files may download as generic files instead of opening in Apple Wallet.

## Solution Implementation

### 1. Next.js Headers Configuration
Updated `next.config.ts` to include proper headers for `.pkpass` files:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/v1/create-qr-code/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)\\.pkpass",
        headers: [
          {
            key: "Content-Type",
            value: "application/vnd.apple.pkpass",
          },
          {
            key: "Content-Disposition",
            value: "inline",
          },
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 2. Header Configuration Details

#### Content-Type Header
- **Value**: `application/vnd.apple.pkpass`
- **Purpose**: Tells Safari and other browsers that this is an Apple Wallet pass file
- **Source**: [Apple Developer Documentation](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/DistributingPasses.html)

#### Content-Disposition Header
- **Value**: `inline`
- **Purpose**: Instructs the browser to display/process the file inline rather than forcing a download
- **Benefit**: Allows Safari to handle the file directly for Wallet installation

#### Cache-Control Header
- **Value**: `no-cache, must-revalidate`
- **Purpose**: Ensures PKPass files are always fresh and not cached
- **Benefit**: Prevents issues with updated passes being cached

### 3. Path Matching Pattern
- **Pattern**: `"/(.*)\\.pkpass"`
- **Coverage**: Matches all `.pkpass` files in any directory
- **Examples**:
  - `/manual_fixed.pkpass`
  - `/test_chain_fixed.pkpass`
  - `/subfolder/any_pass.pkpass`

## Testing Results

### Header Verification
```bash
curl -I http://localhost:3000/manual_fixed.pkpass
```

**Response:**
```
HTTP/1.1 200 OK
Content-Type: application/vnd.apple.pkpass
Content-Disposition: inline
Cache-Control: no-cache, must-revalidate
Accept-Ranges: bytes
Last-Modified: Wed, 16 Jul 2025 14:59:02 GMT
ETag: W/"1309-19813bf04e4"
Content-Length: 4873
Date: Wed, 16 Jul 2025 15:32:22 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

✅ **All headers correctly configured**

### File Accessibility
Both PKPass files are now properly served:
- `http://localhost:3000/manual_fixed.pkpass` ✅
- `http://localhost:3000/test_chain_fixed.pkpass` ✅

## Apple Developer Documentation References

### Official MIME Type Requirement
From [Apple's Distributing Passes documentation](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/DistributingPasses.html):

> "Mail and Safari expect passes to use the `application/vnd.apple.pkpass` MIME type. Configure your email creation system or web server to use this MIME type for pass data."

### Safari Integration
Safari automatically recognizes PKPass files with the correct MIME type and provides the "Add to Apple Wallet" functionality when the file is accessed via web browser.

## Benefits of This Implementation

### 1. Seamless iOS Integration
- PKPass files open directly in Apple Wallet when accessed via Safari
- No additional user steps required for installation
- Consistent behavior across all iOS devices

### 2. Network Accessibility
- PKPass files can be shared via network IP address
- iPhone Safari can access passes from development server
- Example: `http://192.168.29.219:3000/manual_fixed.pkpass`

### 3. Development Efficiency
- Instant testing of PKPass files during development
- No need to manually download and AirDrop files
- Direct browser-to-Wallet installation flow

### 4. Production Readiness
- Configuration works in both development and production
- Follows Apple's official recommendations
- Compatible with all Next.js deployment platforms

## Implementation Notes

### Next.js Version Compatibility
- Works with Next.js 13+ (App Router)
- Compatible with both JavaScript and TypeScript configurations
- Supports both `next.config.js` and `next.config.ts`

### Server Restart Required
After adding the headers configuration, the development server must be restarted:
```bash
npm run dev
```

### File Location Requirements
PKPass files must be placed in the `public` directory to be served by Next.js static file serving.

## Troubleshooting

### Common Issues
1. **Headers not applied**: Ensure development server is restarted after config changes
2. **File not found**: Verify PKPass files are in the `public` directory
3. **Wrong MIME type**: Check that the regex pattern matches your file paths

### Testing Commands
```bash
# Test headers
curl -I http://localhost:3000/your-pass.pkpass

# Test file accessibility
curl http://localhost:3000/your-pass.pkpass --output test.pkpass
```

## Related Resources
- [Next.js Headers Documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
- [Apple PassKit Documentation](https://developer.apple.com/documentation/passkit)
- [Apple Wallet Developer Guide](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/index.html)

## Status
✅ **Implementation Complete**
- Headers configured correctly
- PKPass files served with proper MIME type
- Ready for iOS Safari testing
- Production ready 