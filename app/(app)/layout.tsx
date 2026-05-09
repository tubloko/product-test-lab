'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { signOutUser } from '@/lib/firebase/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: user, loading } = useUser();
  const router = useRouter();
  useAuthBootstrap();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-text-muted">
        Loading…
      </div>
    );
  }
  if (!user) return null;

  const handleSignOut = async () => {
    await signOutUser();
    router.replace('/login');
  };

  return (
    <div className="flex min-h-svh flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:px-8">
        <span className="text-subheading font-semibold text-text">ProductTestLab</span>
        <div className="flex items-center gap-3">
          <span className="text-caption text-text-muted">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
