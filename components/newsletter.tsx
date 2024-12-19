'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showNotification } from '@/components/Notifications';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Successfully subscribed!', 'success');
        setEmail('');
      } else {
        showNotification(data.message || 'Subscription failed', 'error');
      }
    } catch (error) {
      showNotification('An error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">
        Stay Updated with Arenas AI
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input 
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {isLoading ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>
    </div>
  );
}
