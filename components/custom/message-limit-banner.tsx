import React from 'react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

interface MessageLimitBannerProps {
  remainingMessages: number;
}

export function MessageLimitBanner({ remainingMessages }: MessageLimitBannerProps) {
  if (remainingMessages === Infinity) {
    return null; // Don't show for subscribed users
  }

  const isLow = remainingMessages <= 3;
  
  return (
    <div className={`w-full px-4 py-2 mb-2 rounded-lg flex items-center justify-between ${
      isLow ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-blue-50 dark:bg-blue-900/20'
    }`}>
      <div className="flex items-center gap-2">
        {isLow && <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />}
        <span className="text-sm">
          {isLow 
            ? `Only ${remainingMessages} free ${remainingMessages === 1 ? 'message' : 'messages'} remaining!` 
            : `${remainingMessages} free ${remainingMessages === 1 ? 'message' : 'messages'} remaining`}
        </span>
      </div>
      <Link href="/upgrade">
        <Button size="sm" variant={isLow ? "default" : "outline"} className="text-xs">
          Upgrade to Pro
        </Button>
      </Link>
    </div>
  );
} 