'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { PRICING_TIERS } from '@/utils/constants';
import { toast } from 'sonner';
import { CheckIcon } from '@radix-ui/react-icons';

interface SubscriptionStatusProps {
    subscription: {
        status: string;
        price_id: string;
        currentPeriodEnd: string; // ISO string date
        cancelAtPeriodEnd: boolean;
    } | null;
}

export default function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async (priceId: string, plan: string) => {
        try {
            setLoading(true);
            const response = await fetch('/api/upgrade-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, plan }),
            });

            if (!response.ok) throw new Error('Failed to upgrade');

            toast.success('Your subscription has been upgraded!');
            
            // Refresh the page to show updated status
            window.location.reload();
        } catch (error) {
            toast.error('Failed to upgrade subscription');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/cancel-subscription', {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Failed to cancel');

            toast.success('Your subscription will be canceled at the end of the billing period');
            
            window.location.reload();
        } catch (error) {
            toast.error('Failed to cancel subscription');
        } finally {
            setLoading(false);
        }
    };

    // When displaying dates:
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (!subscription) {
        return (
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>No Active Subscription</CardTitle>
                    <CardDescription>
                        Subscribe to access premium features
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button
                        onClick={() => window.location.href = '/pricing'}
                        variant="default"
                    >
                        View Plans
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // Find the current plan based on price_id
    // This assumes price_id matches the title of the plan (Student, Pro, Team)
    const planType = subscription.price_id?.toLowerCase() || '';
    const currentPlan = PRICING_TIERS.monthly.find(
        tier => tier.title.toLowerCase() === planType
    );

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>
                    {currentPlan?.title || 'Current'} Plan
                </CardTitle>
                <CardDescription>
                    {subscription.cancelAtPeriodEnd
                        ? `Your subscription will end on ${formatDate(subscription.currentPeriodEnd)}`
                        : `Next billing date: ${formatDate(subscription.currentPeriodEnd)}`
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {currentPlan?.features.map((feature, i) => (
                        <div key={i} className="flex items-center">
                            <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                            <span>{feature}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                {!subscription.cancelAtPeriodEnd && (
                    <>
                        {planType === 'student' && (
                            <Button
                                onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!, 'Pro')}
                                disabled={loading}
                            >
                                Upgrade to Pro
                            </Button>
                        )}
                        {planType === 'pro' && (
                            <Button
                                onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID!, 'Team')}
                                disabled={loading}
                            >
                                Upgrade to Team
                            </Button>
                        )}
                        <Button
                            onClick={handleCancel}
                            variant="destructive"
                            disabled={loading}
                        >
                            Cancel Subscription
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    );
}