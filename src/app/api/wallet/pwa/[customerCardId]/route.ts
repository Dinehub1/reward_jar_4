import { createClient } from '@/lib/supabase/server-only'
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    const customerCardId = resolvedParams.customerCardId
    const supabase = await createClient()

    console.log('📱 Generating PWA wallet for card:', customerCardId)

    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        *,
        customers!inner (
          id,
          name,
          email
        ),
        stamp_cards!inner (
          id,
          name,
          total_stamps,
          reward_description,
          businesses!inner (
            id,
            name,
            description
          )
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      console.error('❌ Customer card not found:', error)
      return NextResponse.json({ error: 'Customer card not found' }, { status: 404 })
    }

    console.log('✅ Fetched customer card for PWA:', {
      id: customerCard.id,
      membership_type: customerCard.membership_type,
      current_stamps: customerCard.current_stamps,
      sessions_used: customerCard.sessions_used
    })

    // Determine card type and styling
    const isGymMembership = customerCard.membership_type === 'gym'
    const cardTitle = isGymMembership ? 'Membership Card' : 'Loyalty Card'
    const primaryColor = isGymMembership ? '#6366f1' : '#10b981'
    const secondaryColor = isGymMembership ? '#4f46e5' : '#059669'

    // Generate PWA HTML
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${(customerCard.stamp_cards as any).name} - ${cardTitle}</title>
        <meta name="description" content="${(customerCard.stamp_cards as any).businesses.name} ${cardTitle}">
        
        <!-- PWA Manifest -->
        <link rel="manifest" href="/api/wallet/pwa/${customerCardId}/manifest">
        <meta name="theme-color" content="${primaryColor}">
        
        <!-- PWA Meta Tags -->
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="${cardTitle}">
        
        <!-- Icons -->
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png">
        
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .card-container {
                background: white;
                border-radius: 20px;
                padding: 30px;
                max-width: 400px;
                width: 100%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                text-align: center;
            }
            
            .card-icon {
                font-size: 64px;
                margin-bottom: 20px;
            }
            
            .card-title {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 8px;
            }
            
            .business-name {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 30px;
            }
            
            .progress-container {
                background: #f9fafb;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 30px;
            }
            
            .progress-label {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .progress-value {
                font-size: 32px;
                font-weight: bold;
                color: ${primaryColor};
                margin-bottom: 15px;
            }
            
            .progress-bar {
                background: #e5e7eb;
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 10px;
            }
            
            .progress-fill {
                background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor});
                height: 100%;
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            
            .reward-info {
                background: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 20px;
            }
            
            .reward-label {
                font-size: 12px;
                color: #92400e;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 5px;
            }
            
            .reward-text {
                font-size: 14px;
                color: #92400e;
                font-weight: 500;
            }
            
            .install-prompt {
                background: #f3f4f6;
                border-radius: 10px;
                padding: 15px;
                font-size: 14px;
                color: #4b5563;
                line-height: 1.4;
            }
            
            .install-button {
                background: ${primaryColor};
                color: white;
                border: none;
                border-radius: 10px;
                padding: 12px 24px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                margin-top: 15px;
                width: 100%;
                transition: background-color 0.2s;
            }
            
            .install-button:hover {
                background: ${secondaryColor};
            }
            
            .install-button:disabled {
                background: #9ca3af;
                cursor: not-allowed;
            }
        </style>
    </head>
    <body>
        <div class="card-container">
            <div class="card-icon">${isGymMembership ? '🏋️‍♂️' : '☕'}</div>
            <h1 class="card-title">${(customerCard.stamp_cards as any).name}</h1>
            <div class="business-name">${(customerCard.stamp_cards as any).businesses.name}</div>
            
            <div class="progress-container">
                <div class="progress-label">${isGymMembership ? 'Sessions Used' : 'Stamps Collected'}</div>
                <div class="progress-value">
                    ${isGymMembership 
                      ? `${customerCard.sessions_used || 0}/${customerCard.total_sessions || 0}`
                      : `${customerCard.current_stamps || 0}/${(customerCard.stamp_cards as any).total_stamps}`
                    }
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${
                      isGymMembership 
                        ? Math.min(((customerCard.sessions_used || 0) / (customerCard.total_sessions || 1)) * 100, 100)
                        : Math.min(((customerCard.current_stamps || 0) / (customerCard.stamp_cards as any).total_stamps) * 100, 100)
                    }%"></div>
                </div>
            </div>
            
            <div class="reward-info">
                <div class="reward-label">${isGymMembership ? 'Benefits' : 'Reward'}</div>
                <div class="reward-text">${(customerCard.stamp_cards as any).reward_description}</div>
            </div>
            
            <div class="install-prompt">
                <div>📱 Add this ${cardTitle.toLowerCase()} to your home screen for quick access!</div>
                <button class="install-button" id="installButton" style="display: none;">
                    Add to Home Screen
                </button>
            </div>
        </div>

        <script>
            // PWA Installation
            let deferredPrompt;
            const installButton = document.getElementById('installButton');

            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                installButton.style.display = 'block';
            });

            installButton.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log('PWA install outcome:', outcome);
                    deferredPrompt = null;
                    installButton.style.display = 'none';
                }
            });

            // Service Worker Registration
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                        .then((registration) => {
                            console.log('SW registered: ', registration);
                        })
                        .catch((registrationError) => {
                            console.log('SW registration failed: ', registrationError);
                        });
                });
            }
        </script>
    </body>
    </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('❌ PWA wallet generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate PWA wallet',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization')
    const testToken = process.env.NEXT_PUBLIC_TEST_TOKEN || 'test-token'
    
    if (!authHeader?.includes(testToken)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const supabase = await createClient()
    const customerCardId = resolvedParams.customerCardId
    const url = new URL(request.url)
    const requestedType = url.searchParams.get('type') // 'stamp' or 'membership'

    console.log('📱 POST: Generating PWA Wallet for card ID:', customerCardId, 'type:', requestedType)

    // Get customer card with stamp card details and membership info
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        membership_type,
        sessions_used,
        total_sessions,
        cost,
        expiry_date,
        created_at,
        stamp_cards (
          id,
          name,
          total_stamps,
          reward_description,
          businesses (
            name,
            description
          )
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      console.error('Customer card not found:', error)
      return NextResponse.json(
        { error: 'Customer card not found' },
        { status: 404 }
      )
    }

    // Determine card type - either from query param or database
    let cardType = requestedType
    if (!cardType) {
      // Auto-detect from database if not specified
      cardType = customerCard.membership_type === 'loyalty' ? 'stamp' : 'membership'
    }

    // Validate card type compatibility
    if (cardType === 'stamp' && customerCard.membership_type !== 'loyalty') {
      return NextResponse.json(
        { error: 'Card type mismatch: requested stamp card but database shows membership type' },
        { status: 400 }
      )
    }
    if (cardType === 'membership' && customerCard.membership_type !== 'membership') {
      return NextResponse.json(
        { error: 'Card type mismatch: requested membership card but database shows loyalty type' },
        { status: 400 }
      )
    }

    // Generate QR code for the journey
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/journey/${customerCardId}`
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    let htmlTemplate = ''

    if (cardType === 'stamp') {
      // STAMP CARD - 5x2 grid with green theme
      const totalStamps = customerCard.stamp_cards?.[0]?.total_stamps || 10
      const currentStamps = customerCard.current_stamps || 0
      const stampsGrid = []
      
      for (let i = 0; i < totalStamps; i++) {
        stampsGrid.push({
          filled: i < currentStamps,
          index: i
        })
      }

      htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Stamp Card - ${customerCard.stamp_cards?.[0]?.businesses?.[0]?.name || 'RewardJar'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #10b981, #059669);
            min-height: 100vh; padding: 20px; display: flex; align-items: center; justify-content: center;
        }
        .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
        .header { text-align: center; margin-bottom: 24px; }
        .business-name { font-size: 24px; font-weight: bold; color: #10b981; margin-bottom: 8px; }
        .card-type { font-size: 16px; color: #6b7280; margin-bottom: 16px; }
        .stamps-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; }
        .stamp { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.3s ease; }
        .stamp.filled { background: #10b981; color: white; }
        .stamp.empty { background: #e5e7eb; color: #9ca3af; border: 2px dashed #d1d5db; }
        .progress { text-align: center; margin: 20px 0; }
        .progress-text { font-size: 18px; font-weight: 600; color: #10b981; margin-bottom: 8px; }
        .reward-text { font-size: 14px; color: #6b7280; margin-bottom: 20px; }
        .qr-section { text-align: center; padding: 20px; background: #f9fafb; border-radius: 12px; margin-top: 24px; }
        .qr-code { margin-bottom: 12px; }
        .qr-text { font-size: 12px; color: #6b7280; }
        .footer { text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="business-name">${customerCard.stamp_cards?.[0]?.businesses?.[0]?.name || 'RewardJar'}</div>
            <div class="card-type">Digital Stamp Card</div>
        </div>
        <div class="stamps-grid">
            ${stampsGrid.map(stamp => `<div class="stamp ${stamp.filled ? 'filled' : 'empty'}">${stamp.filled ? '★' : '☆'}</div>`).join('')}
        </div>
        <div class="progress">
            <div class="progress-text">${currentStamps}/${totalStamps} Stamps Collected</div>
            <div class="reward-text">${customerCard.stamp_cards?.[0]?.reward_description || 'Collect all stamps to earn your reward!'}</div>
        </div>
        <div class="qr-section">
            <div class="qr-code"><img src="${qrCodeDataUrl}" alt="QR Code" style="width: 120px; height: 120px;"></div>
            <div class="qr-text">Scan to add stamps or redeem rewards</div>
        </div>
        <div class="footer">
            <div class="footer-text">Powered by RewardJar - Happy Loyalty Management</div>
        </div>
    </div>
</body>
</html>`
    } else {
      // MEMBERSHIP CARD - Progress bar with indigo theme
      const totalSessions = customerCard.total_sessions || 20
      const usedSessions = customerCard.sessions_used || 0
      const progressPercent = Math.round((usedSessions / totalSessions) * 100)

      htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Membership Card - ${customerCard.stamp_cards?.[0]?.businesses?.[0]?.name || 'RewardJar'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            min-height: 100vh; padding: 20px; display: flex; align-items: center; justify-content: center;
        }
        .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
        .header { text-align: center; margin-bottom: 24px; }
        .business-name { font-size: 24px; font-weight: bold; color: #6366f1; margin-bottom: 8px; }
        .card-type { font-size: 16px; color: #6b7280; margin-bottom: 16px; }
        .progress-section { margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; }
        .progress-bar { width: 100%; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; margin: 16px 0; }
        .progress-fill { height: 100%; background: #6366f1; transition: width 0.3s ease; }
        .sessions-text { text-align: center; font-size: 18px; font-weight: 600; color: #6366f1; margin-bottom: 8px; }
        .cost-text { text-align: center; font-size: 16px; color: #6b7280; margin-bottom: 8px; }
        .expiry-text { text-align: center; font-size: 14px; color: #ef4444; margin-bottom: 16px; }
        .qr-section { text-align: center; padding: 20px; background: #f9fafb; border-radius: 12px; margin-top: 24px; }
        .qr-code { margin-bottom: 12px; }
        .qr-text { font-size: 12px; color: #6b7280; }
        .footer { text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="business-name">${customerCard.stamp_cards?.[0]?.businesses?.[0]?.name || 'RewardJar'}</div>
            <div class="card-type">Digital Membership Card</div>
        </div>
        <div class="progress-section">
            <div class="sessions-text">${usedSessions}/${totalSessions} Sessions Used</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            ${customerCard.cost ? `<div class="cost-text">₩${customerCard.cost.toLocaleString()}</div>` : ''}
            ${customerCard.expiry_date ? `<div class="expiry-text">Expires: ${new Date(customerCard.expiry_date).toLocaleDateString()}</div>` : ''}
        </div>
        <div class="qr-section">
            <div class="qr-code"><img src="${qrCodeDataUrl}" alt="QR Code" style="width: 120px; height: 120px;"></div>
            <div class="qr-text">Scan to mark sessions or check membership</div>
        </div>
        <div class="footer">
            <div class="footer-text">Powered by RewardJar - Happy Loyalty Management</div>
        </div>
    </div>
</body>
</html>`
    }

    return new NextResponse(htmlTemplate, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, max-age=1'
      }
    })

  } catch (error) {
    console.error('❌ Error generating PWA wallet:', error)
    return NextResponse.json(
      { error: 'Failed to generate PWA wallet' },
      { status: 500 }
    )
  }
} 