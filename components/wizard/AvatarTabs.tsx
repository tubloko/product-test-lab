'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { AvatarSuggestion } from '@/types/wizardSession';

interface AvatarTabsProps {
  avatars: AvatarSuggestion[];
  active: number;
  onActiveChange: (next: number) => void;
  children: (avatarIdx: number, avatar: AvatarSuggestion) => React.ReactNode;
}

export function AvatarTabs({ avatars, active, onActiveChange, children }: AvatarTabsProps) {
  return (
    <Tabs
      value={String(active)}
      onValueChange={(v) => onActiveChange(Number(v))}
      className="space-y-4"
    >
      <TabsList variant="line" className="w-full justify-start">
        {avatars.map((a, i) => (
          <TabsTrigger key={i} value={String(i)}>
            {a.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {avatars.map((a, i) => (
        <TabsContent key={i} value={String(i)}>
          {children(i, a)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
