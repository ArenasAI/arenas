export async function upgradeSubscription(priceId: string, plan: string) {
    const response = await fetch('/api/upgrade-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId, plan }),
      credentials: 'include',
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upgrade subscription');
    }
  
    return response.json();
  }