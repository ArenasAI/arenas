'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { signOut } from '@/app/(auth)/actions';

export function LogoutButton() {
  const router = useRouter();
  
  const handleLogout = async () => {

    try {
      const out = await signOut()

      if (out.error) {
        throw new Error(out.error);
      }
      
      toast.success("logged out successfully!");
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('failed to logout');
    }
  }

  return (
    <Button variant="ghost" onClick={handleLogout}>
      Logout
    </Button>
  );
}
