'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface RealtimeToggleProps {
  chatId: string;
  isSpreadsheetAttached: boolean;
}

export function RealtimeToggle({ chatId, isSpreadsheetAttached }: RealtimeToggleProps) {
  const [isRealtime, setIsRealtime] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Initialize WebSocket connection when realtime is enabled
  useEffect(() => {
    if (!isRealtime || !isSpreadsheetAttached) return;

    setIsConnecting(true);
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);
    
    ws.onopen = () => {
      setSocket(ws);
      setIsConnecting(false);
      toast.success('Real-time updates enabled');
      
      // Send initial connection message with chat ID
      ws.send(JSON.stringify({ type: 'connect', chatId }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update' && data.workbook) {
          // Handle workbook update - this will depend on how you're displaying the Excel data
          // For example, you might dispatch an event or update state
          window.dispatchEvent(new CustomEvent('workbook-update', { detail: data.workbook }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnecting(false);
      setIsRealtime(false);
      toast.error('Failed to connect to real-time service');
    };
    
    ws.onclose = () => {
      setSocket(null);
      setIsRealtime(false);
      setIsConnecting(false);
    };
    
    return () => {
      ws.close();
    };
  }, [isRealtime, chatId, isSpreadsheetAttached]);

  const toggleRealtime = async () => {
    if (!isSpreadsheetAttached) {
      toast.error('Please attach a spreadsheet first');
      return;
    }
    
    if (isRealtime) {
      // Disable realtime
      socket?.close();
      setSocket(null);
      setIsRealtime(false);
      toast.info('Real-time updates disabled');
    } else {
      // Enable realtime
      setIsRealtime(true);
    }
  };

  if (!isSpreadsheetAttached) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 px-2">
      <Switch
        checked={isRealtime}
        onCheckedChange={toggleRealtime}
        disabled={isConnecting}
        id="realtime-mode"
      />
      <label 
        htmlFor="realtime-mode" 
        className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
      >
        {isRealtime ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span>Real-time</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Real-time</span>
          </>
        )}
      </label>
    </div>
  );
} 