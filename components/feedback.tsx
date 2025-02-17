import { Feedback } from '@geist-ui/react';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <Feedback dryRun label="vercel" type="inline" />;
}