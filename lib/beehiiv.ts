// lib/beehiiv.ts
export async function subscribeToNewsletter(email: string) {
  const response = await fetch('https://api.beehiiv.com/v2/publications/' + process.env.NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID + '/subscriptions', {
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
  });

  if (!response.ok) {
    throw new Error('Failed to subscribe');
  }

  return response.json();
}
