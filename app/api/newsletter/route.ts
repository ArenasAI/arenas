// app/api/newsletter/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${process.env.NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BEEHIIV_API_KEY}`,
        },
        body: JSON.stringify({
          email: email,
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: 'website',
          utm_medium: 'landing_page'
        })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to subscribe')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    )
  }
}
