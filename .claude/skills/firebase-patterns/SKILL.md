# Firebase patterns

## When to use

Activate this skill any time you read or write data, authenticate users, set up Firestore listeners, or build server-only Admin SDK code in ProductTestLab — so every collection follows the same shape AdTestLab already proved out.

## Reference: AdTestLab patterns

### Firebase initialization

Source: `ad-test-lab/lib/firebase/config.ts`. Six `NEXT_PUBLIC_FIREBASE_*` env vars feed the client SDK. The app instance is initialized once and reused via `getApps().length ? getApp() : initializeApp(...)`.

```ts
// lib/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

Admin SDK (server-only) lives at `lib/firebase/admin.ts`. Three secret env vars; private key has its `\n` escapes restored. `import 'server-only'` guards against accidental client-side import.

```ts
// lib/firebase/admin.ts
import 'server-only';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

const existing = getApps();
const adminApp: App = existing.length > 0 ? existing[0]! : initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});
export const adminAuth = getAdminAuth(adminApp);
export const adminDb = getAdminFirestore(adminApp);
```

Required env vars (`.env.example` and `.env.local`):

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
ANTHROPIC_API_KEY=
```

### Auth setup

Providers enabled (in the Firebase console; client wrappers in `lib/firebase/auth.ts`): **Email/Password** and **Google** (popup, not redirect).

```ts
// lib/firebase/auth.ts
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './config';

export async function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}
export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}
export async function signOutUser() { await signOut(auth); }
```

### Auth hook pattern

There is **no `useAuth`** in AdTestLab — instead the responsibilities are split across three small hooks.

- **`useUser()`** wraps `react-firebase-hooks/auth#useAuthState(auth)` and returns `{ data: FirebaseUser | null, loading, error }`. This is the only place the raw Firebase user surfaces.
- **`useAuthBootstrap()`** runs once per signed-in session and provisions the `users/{uid}` doc via `ensureUserDocument(user)` if it doesn't exist. Idempotent: tracks `ranFor` ref so it won't re-run for the same UID.
- **`useLogin(redirectTo = '/')`** owns the email/Google sign-in flow and exposes `{ loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail }`. Errors are mapped from Firebase codes to user-friendly strings via a local `errorMessage(code)` switch.

```ts
// hooks/useUser.ts
export function useUser() {
  const [user, loading, error] = useAuthState(auth);
  return { data: user ?? null, loading, error };
}
```

```ts
// hooks/useAuthBootstrap.ts (excerpt)
useEffect(() => {
  if (!user) { ranFor.current = null; return; }
  if (ranFor.current === user.uid) return;
  ranFor.current = user.uid;
  ensureUserDocument(user).catch((err) => { ranFor.current = null; console.error(...); });
}, [user]);
```

### Login / signup flow

A single `app/(auth)/login/page.tsx` page handles both sign-in and sign-up via a `mode: 'signin' | 'signup'` toggle. It uses `react-hook-form` + zod for credentials, calls `useLogin()`, and on success `router.push(redirectTo)`. If `useUser()` is already authenticated when the page mounts, it `router.replace('/')` immediately.

There is no separate signup page; the same form switches modes. `signUpWithEmail` does **not** create the Firestore user doc — that's the job of `useAuthBootstrap()` (which the authenticated layout calls on first render).

### Protected routes

- **No middleware.** No `middleware.ts` at the repo root.
- **No HOC pattern.** No `withAuth(...)`.
- **Layout-level guard.** `app/(app)/layout.tsx` is a `'use client'` component that watches `useUser()` and redirects when signed-out:

```tsx
useEffect(() => {
  if (!loading && !user) router.replace('/login');
}, [user, loading, router]);
if (loading) return <div>Loading…</div>;
if (!user) return null;
useAuthBootstrap();          // also called once per render before the redirect
```

The `(app)` route group inherits this layout for every protected page. Public pages live under `(auth)` with their own layout (none — they render a full-page card).

API routes do their own per-request token verification via `adminAuth.verifyIdToken` (see "Auth on AI endpoints" in the ai-prompting skill).

### Firestore data layout

Source: `lib/firebase/paths.ts`. **Per-user nesting** — every domain entity lives under `users/{uid}/...`. This dovetails with the security rules (see below) and means the `users/{uid}` doc is the only top-level document the client touches.

```
users/{uid}                                                   # user profile
users/{uid}/products/{productId}                              # product
users/{uid}/products/{productId}/campaigns/{campaignId}       # campaign
  /entries/{date}                                             # campaign daily entry, doc id = YYYY-MM-DD
  /adsets/{adsetId}                                           # adset
    /entries/{date}                                           # adset daily entry, doc id = YYYY-MM-DD
  /diagnoses/{diagnosisId}                                    # cached AI diagnosis

system/budget/months/{YYYY-MM}                                # admin-only, monthly Anthropic spend
feedback/{id}                                                 # admin-only, written by /api/feedback
```

All paths are produced by helpers like `paths.products(uid)`, `paths.campaign(uid, productId, campaignId)` — never hand-built strings.

### Service files vs hooks (split)

Data access is **two layers, both per collection**:

1. **`lib/firebase/<collection>.ts`** — pure async functions for CRUD: `createX`, `updateX`, `getX`, `deleteX`. They call the client SDK directly and return either the doc id (on create) or a converted domain entity. Mutations always set `updatedAt: serverTimestamp()`; creates set both `createdAt` and `updatedAt`.
2. **`hooks/useXs.ts` and `hooks/useX.ts`** — read-side wrappers over `react-firebase-hooks/firestore` (`useCollection` / `useDocument`). They take ids, build a query/ref, return `{ data, loading, error }` with already-converted entities. There's no caching layer — Firestore's listener cache is the cache.
3. **`hooks/useXMutations.ts`** — thin wrapper that pulls `uid` from `useUser()` and curries the service functions, so callers don't have to thread `user.uid` themselves.

Always normalize raw Firestore docs through `lib/firebase/converters.ts` before they leave the data layer.

### CRUD pattern (full example)

```ts
// lib/firebase/products.ts
import { doc, collection, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { paths } from './paths';
import { toProduct } from './converters';
import { deleteCampaign } from './campaigns';
import type { Product, ProductInput } from '@/types/product';

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(obj) as (keyof T)[]) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

export async function createProduct(uid: string, input: ProductInput): Promise<string> {
  const ref = collection(db, paths.products(uid));
  const docRef = await addDoc(ref, {
    ...stripUndefined(input),
    status: input.status ?? 'testing',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateProduct(uid: string, productId: string, input: Partial<ProductInput>) {
  const ref = doc(db, paths.product(uid, productId));
  await updateDoc(ref, { ...stripUndefined(input), updatedAt: serverTimestamp() });
}

// Recursive delete: client SDK has no native version, so walk the tree and
// chunk the deletes into batches of 400 — see lib/firebase/campaigns.ts:deleteCampaign.
export async function deleteProduct(uid: string, productId: string) {
  const campaignsSnap = await getDocs(collection(db, paths.campaigns(uid, productId)));
  for (const c of campaignsSnap.docs) await deleteCampaign(uid, productId, c.id);
  await deleteDoc(doc(db, paths.product(uid, productId)));
}

export async function getProduct(uid: string, productId: string): Promise<Product | null> {
  const ref = doc(db, paths.product(uid, productId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toProduct({ id: snap.id, ...snap.data() });
}
```

### End-to-end example: products

```ts
// hooks/useProducts.ts (list)
export function useProducts(): ProductsResult {
  const { data: user } = useUser();
  const q = user
    ? query(collection(db, paths.products(user.uid)), orderBy('createdAt', 'desc'))
    : null;
  const [snap, loading, error] = useCollection(q);
  if (!user) return { data: [], loading: false, error: undefined };
  const data = (snap?.docs ?? []).map((d) => toProduct({ id: d.id, ...d.data() }));
  return { data, loading, error };
}

// hooks/useProduct.ts (single)
export function useProduct(productId: string | undefined): ProductResult {
  const { data: user } = useUser();
  const ref = user && productId ? doc(db, paths.product(user.uid, productId)) : null;
  const [snap, loading, error] = useDocument(ref);
  if (!user || !productId) return { data: null, loading: false, error: undefined };
  if (!snap?.exists()) return { data: null, loading, error };
  return { data: toProduct({ id: snap.id, ...snap.data() }), loading, error };
}
```

### Real-time listeners

- **All reads are real-time** via `useCollection` / `useDocument` from `react-firebase-hooks/firestore`. No `getDocs` in client code (it's reserved for service-layer one-shots like the recursive-delete walk).
- The hook returns `[snap, loading, error]`; the wrapper coerces these into `{ data, loading, error }` plus already-converted domain types.
- **Unsubscribes are automatic** — `react-firebase-hooks` cleans up when the consuming component unmounts. Don't manually call `onSnapshot`.
- **Conditional subscriptions** are expressed by passing `null` for the query when prerequisites aren't ready (no user, no productId). The hook treats `null` as "don't subscribe yet."

```ts
const q = user && productId ? query(...) : null;
const [snap, loading, error] = useCollection(q);
```

Some hooks compose multiple subscriptions and `useMemo` derived data on top — see `hooks/useCampaignEntries.ts` which joins campaign entries + adset entries to compute `adsetSpendSum`/`effectiveSpend`. The pattern is to keep reads atomic per hook and join in `useMemo`, never with promises.

### Mutation hooks

```ts
// hooks/useCampaignEntryMutations.ts
export function useCampaignEntryMutations(productId: string, campaignId: string) {
  const { data: user } = useUser();
  const saveEntry = useCallback(async (date: string, values: CampaignEntryInput) => {
    if (!user) throw new Error('Not authenticated');
    await upsertCampaignEntry(user.uid, productId, campaignId, date, values);
  }, [user, productId, campaignId]);
  // …clearOverride, deleteEntry
  return { saveEntry, clearOverride, deleteEntry };
}
```

Mutations throw on failure; callers wrap in `try/catch` and surface via `toast.error(...)`.

### Firestore types in client code

- **Timestamps**: server-side fields are written with `serverTimestamp()` (client SDK) or `FieldValue.serverTimestamp()` (admin SDK). On read, `lib/firebase/converters.ts#toDate(value)` turns `Timestamp` → `Date` (with a `new Date(0)` fallback if the field is missing). The converted entity types in `types/*.ts` use `z.date()`, never `Timestamp`.
- **DocumentReferences** are not stored as fields — relationships are encoded as **string ids** plus the parent path. `Campaign.productId`, `Adset.campaignId` are strings, not refs.
- **Doc ids** are typically auto-generated (`addDoc(...)`). Daily entries are an exception: they use `setDoc(doc(db, ...entries/${date}))` so the doc id is `YYYY-MM-DD` and upserts collapse cleanly.
- **Counters / atomic fields**: use `FieldValue.increment(n)` (admin SDK; see `lib/firebase/budget.ts`) or `runTransaction` for read-modify-write (see `lib/firebase/usage.ts`).

```ts
function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(0);
}
export function toProduct(raw): Product {
  return { id: raw.id, name: raw.name, /* … */
    createdAt: toDate(raw.createdAt), updatedAt: toDate(raw.updatedAt) };
}
```

### Security rules (verbatim)

`ad-test-lab/firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Server-only state (e.g. system/budget/months/{YYYY-MM}). Admin SDK
    // bypasses rules; clients must never see or write this.
    match /system/{document=**} {
      allow read, write: if false;
    }

    // Feedback is written by the /api/feedback route via Admin SDK.
    // Clients must never read or write this directly.
    match /feedback/{document=**} {
      allow read, write: if false;
    }
  }
}
```

High-level pattern: **users own their data under `users/{uid}/...`**, recursively. Anything outside that subtree (`system/...`, `feedback/...`) is denied for clients and can only be read/written via Admin SDK from API routes. Cross-user access is impossible by rule — no shared queries, no admin/staff roles in the data layer.

### Cloud Functions

**None.** Firebase Cloud Functions are not used. `firebase.json` only configures Firestore rules:

```
{ "firestore": { "rules": "firestore.rules" } }
```

Server-side work runs in Next.js route handlers under `app/api/*` on the Vercel/Node runtime, using the Admin SDK directly. Two endpoints exist today:

- `POST /api/diagnose` — runs an Anthropic call, caches the result.
- `POST /api/feedback` — saves user feedback and pings Resend.

### Error handling

- **No custom error class.** Firebase errors propagate as `FirebaseError` from `firebase/app`; mutation hooks let them throw.
- **At the call site**, callers either:
  - map `instanceof FirebaseError` to a user-friendly string (login flow, `useLogin#errorMessage(code)`), or
  - `toast.error(...)` from `sonner`.
- **API routes** never `throw` to the client — they catch, `console.error('[scope] message', { ...ctx })`, and return a typed `{ error, message }` JSON body with a meaningful HTTP status (401 / 400 / 429 / 500 / 502 / 503 / 504).
- **Hooks return `error: FirestoreError | undefined`** from `react-firebase-hooks`; consuming components decide whether to render an error state. There is no global error UI.

## Common pitfalls

- **Don't bypass `paths.*` helpers** — every collection/document path goes through `lib/firebase/paths.ts`. This keeps the security model and rules in sync with the access patterns.
- **Don't import `lib/firebase/admin.ts` from a client component.** It has `import 'server-only'` for a reason. Keep Admin SDK use inside `app/api/*/route.ts` and other `'server-only'` files.
- **Don't call `getDocs` from React components**; always use `useCollection`/`useDocument` so subscriptions clean up automatically. Reserve `getDocs`/`getDoc` for service-layer batch operations (recursive delete, etc.).
- **Don't write `Timestamp` or `serverTimestamp()` into the entity types.** Convert to `Date` in `to<Entity>()` before the data leaves the data layer; the rest of the app sees only `Date`.
- **Strip `undefined` before `addDoc`/`setDoc`/`updateDoc`** — Firestore rejects `undefined`. `stripUndefined()` (in `products.ts`, `entries.ts`) is the local pattern.
- **Daily-entry doc ids are dates** (`YYYY-MM-DD`) so upserts use `setDoc(..., { merge: true })`, not `addDoc`. Don't switch to auto-ids — the deterministic id is what makes spreadsheet-style edits idempotent.

## Open questions / gaps

- **No password-reset / email-verification flow** in AdTestLab. The login page handles credentials only. Decision needed for ProductTestLab: keep parity, or add `sendPasswordResetEmail` + verification.
- **No multi-factor auth.** Single-factor only.
- **No Cloud Functions / scheduled jobs / triggers.** All server work is in Next.js route handlers. ProductTestLab will need to make the same choice — sticking with route handlers is recommended for simplicity (matches AdTestLab).
- **No App Check, no rate-limiting middleware.** Per-user daily quota is enforced in-app via `lib/firebase/usage.ts` (Firestore transaction). Global cost cap via `lib/firebase/budget.ts` reading `system/budget/months/{YYYY-MM}`. ProductTestLab will likely need similar quotas — pattern is reusable.
- **No Storage usage.** No file uploads. If ProductTestLab adds image/asset uploads (product hero images, screenshots), Firebase Storage rules + a service file pattern will need to be designed — **requires decision**.
- **`firebase.json` does not configure Hosting/Functions/Storage** — only rules. Deployment is Vercel for Next.js, Firebase only for Firestore + Auth.
- **No emulator setup** (`firebase.json` has no `emulators` block; no `.firebaserc`). Local development hits the live project. ProductTestLab may want emulators — **requires decision**.
