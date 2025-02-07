'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';

const RUNTIMES = [
  { id: 'python', name: 'python' },
  { id: 'julia', name: 'julia' },
  { id: 'R', name: 'R' },
];

interface RuntimeSelectorProps {
  selectedRuntime: string;
  onRuntimeChange: (runtime: string) => void;
}

export function RuntimeSelector({ selectedRuntime, onRuntimeChange }: RuntimeSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10">
          <Settings2 className="h-4 w-4" />
          <span className="sr-only">Toggle runtime</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {RUNTIMES.map((runtime) => (
          <DropdownMenuItem
            key={runtime.id}
            onClick={() => onRuntimeChange(runtime.id)}
            className={selectedRuntime === runtime.id ? 'bg-accent' : ''}
          >
            {runtime.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
