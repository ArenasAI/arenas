import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const useCheckout = async (user: User | null) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleCheckout = async (priceId: string) => {
        if (!user) {
            toast.error('You must be logged in to checkout');
            router.push('/login');
            return; 
        }

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/stripe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priceId }),
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }
            
            const url = await response.json();

            if (url) {
                window.location.href = url;
            } else {
                toast.error('Failed to create checkout session. Please try again.');
            }

        } catch (error) {
            if (error instanceof Error && error?.message === "User already subscribed") {
                toast.error('You are already subscribed to this plan');
            } else {
                toast.error('An error occurred while creating the checkout session. Please try again.');
            }
        }
        finally {
            setIsSubmitting(false);
        }
    }

    return { handleCheckout, isSubmitting };
}