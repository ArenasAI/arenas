'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const runtimes = [
  {
    id: 'nodejs',
    name: 'Node.js',
    description: 'JavaScript runtime environment'
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Python runtime environment'
  },
  {
    id: 'deno',
    name: 'Deno',
    description: 'Modern runtime for JavaScript and TypeScript'
  }
] as const;

interface RuntimeSelectorProps {
  selectedRuntime: string;
  className?: string;
  onRuntimeChange?: (runtime: string) => void;
}

export function RuntimeSelector({
  selectedRuntime = 'nodejs', // Add default value
  className,
  onRuntimeChange
}: RuntimeSelectorProps) {
  const [open, setOpen] = React.useState(false);

  // Add null check for selectedRuntimeData
  const selectedRuntimeData = runtimes.find(
    runtime => runtime.id === selectedRuntime
  ) || runtimes[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[150px] justify-between', className)}
        >
          {selectedRuntimeData.name}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search runtime..." />
          <CommandGroup>
            {runtimes.map(runtime => (
              <CommandItem
                key={runtime.id}
                onSelect={() => {
                  onRuntimeChange?.(runtime.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedRuntime === runtime.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex flex-col">
                  <span>{runtime.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {runtime.description}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
