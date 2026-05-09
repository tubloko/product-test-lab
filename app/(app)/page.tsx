'use client';

import { useUser } from '@/hooks/useUser';

export default function Home() {
  const { data: user } = useUser();
  return (
    <div className="space-y-4">
      <h1 className="text-display text-text">Welcome</h1>
      <p className="text-body text-text-muted">
        Logged in as {user?.email ?? 'unknown'}. The pipeline dashboard arrives in E4.
      </p>
    </div>
  );
}
