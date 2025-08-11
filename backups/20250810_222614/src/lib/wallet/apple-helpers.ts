import archiver from 'archiver'
import forge from 'node-forge'
import sharp from 'sharp'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

export function getAppleWebServiceUrl(): string {
  const base = process.env.APPLE_PASS_DOMAIN || process.env.BASE_URL || 'https://www.rewardjar.xyz'
  return `${base}/api/wallet/apple/updates`
}

export function buildAppleBarcode(serialNumber: string, options?: { format?: string; altTextPrefix?: string }) {
  const format = options?.format || 'PKBarcodeFormatQR'
  const altTextPrefix = options?.altTextPrefix || 'Card ID'
  const barcode = {
    message: serialNumber,
    format,
    messageEncoding: 'iso-8859-1',
    altText: `${altTextPrefix}: ${serialNumber}`,
  }
  // Prefer barcodes array for modern passes
  return { barcodes: [barcode] }
}

export async function generatePKPass(passData: Record<string, unknown>): Promise<Buffer> {
  const archive = archiver('zip', { zlib: { level: 9 }, forceLocalTime: true })
  const chunks: Buffer[] = []

  const passJson = JSON.stringify(passData, null, 2)

  const icons = await generatePassIcons()
  const manifest: Record<string, string> = {
    'pass.json': sha1Hash(Buffer.from(passJson, 'utf8'))
  }
  for (const [filename, buffer] of Object.entries(icons)) {
    manifest[filename] = sha1Hash(buffer)
  }
  const manifestJson = JSON.stringify(manifest, null, 2)
  const signature = await createPKCS7Signature(Buffer.from(manifestJson, 'utf8'))

  return await new Promise((resolve, reject) => {
    archive.on('data', (chunk) => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', (error) => reject(error))
    archive.append(passJson, { name: 'pass.json' })
    archive.append(manifestJson, { name: 'manifest.json' })
    archive.append(signature, { name: 'signature' })
    for (const [filename, buffer] of Object.entries(icons)) {
      archive.append(buffer, { name: filename })
    }
    archive.finalize()
  })
}

function sha1Hash(buffer: Buffer): string {
  const md = forge.md.sha1.create()
  md.update(buffer.toString('binary'))
  return md.digest().toHex()
}

async function generatePassIcons(): Promise<Record<string, Buffer>> {
  try {
    const baseIcon = await sharp({ create: { width: 29, height: 29, channels: 4, background: { r: 16, g: 185, b: 129, alpha: 1 } } }).png().toBuffer()
    const baseLogo = await sharp({ create: { width: 160, height: 50, channels: 4, background: { r: 16, g: 185, b: 129, alpha: 1 } } }).png().toBuffer()
    const icons: Record<string, Buffer> = {}
    for (const { name, size } of [ { name: 'icon.png', size: 29 }, { name: 'icon@2x.png', size: 58 }, { name: 'icon@3x.png', size: 87 } ]) {
      icons[name] = await sharp(baseIcon).resize(size, size).png().toBuffer()
    }
    for (const { name, width, height } of [ { name: 'logo.png', width: 160, height: 50 }, { name: 'logo@2x.png', width: 320, height: 100 }, { name: 'logo@3x.png', width: 480, height: 150 } ]) {
      icons[name] = await sharp(baseLogo).resize(width, height).png().toBuffer()
    }
    return icons
  } catch {
    const fallback = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    return {
      'icon.png': fallback,
      'icon@2x.png': fallback,
      'icon@3x.png': fallback,
      'logo.png': fallback,
      'logo@2x.png': fallback,
      'logo@3x.png': fallback,
    }
  }
}

async function createPKCS7Signature(manifestBuffer: Buffer): Promise<Buffer> {
  if (!process.env.APPLE_CERT_BASE64 || !process.env.APPLE_KEY_BASE64 || !process.env.APPLE_WWDR_BASE64) {
    throw new Error('Missing Apple certificates in environment variables')
  }
  const execAsync = promisify(exec)
  const certData = Buffer.from(process.env.APPLE_CERT_BASE64, 'base64')
  const keyData = Buffer.from(process.env.APPLE_KEY_BASE64, 'base64')
  const wwdrData = Buffer.from(process.env.APPLE_WWDR_BASE64, 'base64')
  const cert = forge.pki.certificateFromAsn1(forge.asn1.fromDer(certData.toString('binary')))
  const certPem = forge.pki.certificateToPem(cert)
  const keyPem = keyData.toString('utf8')
  const wwdrCert = forge.pki.certificateFromAsn1(forge.asn1.fromDer(wwdrData.toString('binary')))
  const wwdrPem = forge.pki.certificateToPem(wwdrCert)
  const tmpDir = '/tmp'
  const manifestFile = path.join(tmpDir, `manifest-${Date.now()}.json`)
  const certFile = path.join(tmpDir, `cert-${Date.now()}.pem`)
  const keyFile = path.join(tmpDir, `key-${Date.now()}.pem`)
  const wwdrFile = path.join(tmpDir, `wwdr-${Date.now()}.pem`)
  const signatureFile = path.join(tmpDir, `signature-${Date.now()}.der`)
  try {
    fs.writeFileSync(manifestFile, manifestBuffer)
    fs.writeFileSync(certFile, certPem)
    fs.writeFileSync(keyFile, keyPem)
    fs.writeFileSync(wwdrFile, wwdrPem)
    const opensslCommand = `openssl smime -sign -signer "${certFile}" -inkey "${keyFile}" -certfile "${wwdrFile}" -in "${manifestFile}" -out "${signatureFile}" -outform DER -binary -noattr`
    await execAsync(opensslCommand)
    return fs.readFileSync(signatureFile)
  } finally {
    ;[manifestFile, certFile, keyFile, wwdrFile, signatureFile].forEach((f) => {
      try { if (fs.existsSync(f)) fs.unlinkSync(f) } catch {}
    })
  }
}

