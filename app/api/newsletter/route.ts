// app/api/newsletter/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Beehiiv API integration
    const response = await fetch('https://api.beehiiv.com/v2/publications/${process.env.NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID}/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BEEHIIV_API_KEY}`
      },
      body: JSON.stringify({
        email: email,
      })
    });

    // Improved error handling
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Beehiiv API Error:', responseText);
      return NextResponse.json(
        { message: 'Subscription failed' }, 
        { status: response.status }
      );
    }

    let responseData = {};
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.warn('Could not parse Beehiiv response:', parseError);
    }

    return NextResponse.json({ 
      message: 'Successfully subscribed',
      ...responseData 
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { message: 'An error occurred' }, 
      { status: 500 }
    );
  }
}
