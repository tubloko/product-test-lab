export const paths = {
  users: (): string => 'users',
  user: (uid: string): string => `users/${uid}`,

  products: (uid: string): string => `users/${uid}/products`,
  product: (uid: string, productId: string): string =>
    `users/${uid}/products/${productId}`,

  hypotheses: (uid: string, productId: string): string =>
    `users/${uid}/products/${productId}/hypotheses`,
  hypothesis: (uid: string, productId: string, hypothesisId: string): string =>
    `users/${uid}/products/${productId}/hypotheses/${hypothesisId}`,

  viability: (uid: string, productId: string): string =>
    `users/${uid}/products/${productId}/viability`,
  viabilityDoc: (uid: string, productId: string): string =>
    `users/${uid}/products/${productId}/viability/current`,

  wizardSessions: (uid: string): string => `users/${uid}/wizardSessions`,
  wizardSession: (uid: string, sessionId: string): string =>
    `users/${uid}/wizardSessions/${sessionId}`,

  aiUsage: (uid: string): string => `users/${uid}/aiUsage`,
  aiUsageLog: (uid: string, logId: string): string =>
    `users/${uid}/aiUsage/${logId}`,
} as const;
