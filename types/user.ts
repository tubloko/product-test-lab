import { z } from 'zod';

export const USER_SOURCES = ['signup_email', 'signup_google'] as const;
export const UserSourceSchema = z.enum(USER_SOURCES);
export type UserSource = z.infer<typeof UserSourceSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  createdAt: z.date(),
  lastActiveAt: z.date(),
  source: UserSourceSchema,
});
export type User = z.infer<typeof UserSchema>;
