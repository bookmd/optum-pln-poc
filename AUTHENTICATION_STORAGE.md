# Authentication Details Storage Guide

This document explains where authentication secrets and tokens are stored in this application.

## 🔐 Secrets (Client ID & Client Secret)

### Local Development

**File: `.dev.vars`** (in project root)

```env
CLIENT_ID=6d2xLEs3EMORWNj3haSFgALSl1bsiLCj
CLIENT_SECRET=YO38WwG88xZnAbeTwUmojEln146K7Ck5TDijNnVaSwYTilVaVIGrpfyuoDPy0Ehs
REDIRECT_URL=http://localhost:8788
```

⚠️ **Important**: This file should be in `.gitignore` and never committed to version control!

### Production (Cloudflare Pages)

Secrets are stored as **Environment Variables** in Cloudflare Pages:

1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables
2. Add the following variables:
   - `CLIENT_ID`
   - `CLIENT_SECRET`
   - `CLIENT_SECRET_FALLBACK` (optional)
   - `REDIRECT_URL`
   - `VIM_AUTHORIZE_ENDPOINT` (optional, defaults to `https://api.getvim.com/v1/oauth/authorize`)
   - `VIM_TOKEN_ENDPOINT` (optional, defaults to `https://api.getvim.com/v1/oauth/token`)
   - `VIM_ISSUER` (optional, defaults to `https://auth.getvim.com/`)

### How Secrets Are Accessed

**File: `functions/context-env.ts`**

```typescript
export interface Env {
  REDIRECT_URL: string;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  VIM_TOKEN_ENDPOINT?: string;
  VIM_AUTHORIZE_ENDPOINT?: string;
  VIM_ISSUER?: string;
  CLIENT_SECRET_FALLBACK?: string;
  DB: D1Database;
}
```

Secrets are accessed via `context.env` in Cloudflare Pages Functions:

**File: `functions/api/launch.ts`**
```typescript
redirectUrl.searchParams.append("client_id", context.env.CLIENT_ID);
```

**File: `functions/api/token.ts`**
```typescript
let vimResponse = await getToken(context, code, context.env.CLIENT_SECRET);
```

---

## 🎫 Tokens (ID Token, Access Token)

### Token Flow

1. **Backend receives tokens** from Vim OAuth endpoint
2. **Backend validates tokens** using JWT verification
3. **Backend returns tokens** to frontend (via `/api/token` response)
4. **VimOS SDK manages tokens** internally - you don't need to store them manually

### Where Tokens Are NOT Stored

❌ **Tokens are NOT stored in:**
- Local storage
- Session storage
- Cookies
- React state (for long-term storage)
- Any database

### How Tokens Are Managed

The **VimOS SDK** (`vim-os-js-browser`) handles token storage and management internally. The SDK:

1. Receives tokens from the OAuth callback
2. Stores them securely (likely in memory or secure browser storage)
3. Automatically refreshes tokens when needed
4. Provides access via `sessionContext.getIdToken()`

### Accessing Tokens in Your Code

**File: `src/hooks/useIdToken.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useVimOsContext } from "./useVimOsContext";
import { SessionContext } from "vim-os-js-browser/types";

export const useIdToken = () => {
  const { sessionContext } = useVimOsContext();

  const [idToken, setIdToken] = useState<
    SessionContext.GetIdTokenResponse["idToken"] | undefined
  >();

  useEffect(() => {
    if (sessionContext) {
      (async () => {
        // SDK manages token storage internally
        setIdToken((await sessionContext.getIdToken())?.idToken);
      })();
    }
  }, [sessionContext, setIdToken]);

  return { idToken };
};
```

**Usage:**
```tsx
import { useIdToken } from "./hooks/useIdToken";

function MyComponent() {
  const { idToken } = useIdToken();
  
  // Use idToken for API calls or display
  // Note: This is only available after authentication completes
}
```

### Token Response Structure

When `/api/token` returns successfully, it includes:

```typescript
{
  id_token: string,      // JWT containing user identity
  access_token: string,  // Token for API access
  token_type: string,    // Usually "Bearer"
  expires_in: number,    // Token expiration time
  // ... other fields
}
```

This response is handled by the VimOS SDK automatically - you don't need to manually parse or store it.

---

## 🔄 Authentication Flow Summary

```
1. User launches app from EHR
   ↓
2. Frontend redirects to /launch
   ↓
3. Backend (/api/launch) redirects to Vim OAuth with CLIENT_ID
   ↓
4. User authorizes on Vim platform
   ↓
5. Vim redirects back with authorization code
   ↓
6. Frontend calls /api/token with code
   ↓
7. Backend exchanges code for tokens using CLIENT_SECRET
   ↓
8. Backend validates tokens (JWT verification)
   ↓
9. Backend returns tokens to frontend
   ↓
10. VimOS SDK receives and stores tokens internally
    ↓
11. SDK provides sessionContext for accessing EHR data
```

---

## 📍 Key Files

### Secrets Configuration
- **`.dev.vars`** - Local development secrets (not in git)
- **`functions/context-env.ts`** - TypeScript interface for environment variables
- **Cloudflare Dashboard** - Production secrets

### Token Handling
- **`functions/api/token.ts`** - Token exchange and validation
- **`src/hooks/useIdToken.tsx`** - Hook to access ID token from SDK
- **`src/hooks/useAuthTokenData.tsx`** - Hook for settings app token access
- **`src/AppWrapper.tsx`** - Initializes VimOS SDK (which handles tokens)

### Token Validation
- **`functions/api/token.ts`** (lines 55-87) - JWT verification using `@cfworker/jwt`

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.dev.vars` to git** - Add to `.gitignore`
2. ✅ **Use environment variables** in production (Cloudflare Pages)
3. ✅ **Let VimOS SDK manage tokens** - Don't try to store them manually
4. ✅ **Validate tokens server-side** - Always verify JWT on backend
5. ✅ **Use HTTPS** - Always use secure connections in production
6. ✅ **Rotate secrets** - Regularly update CLIENT_SECRET if compromised

---

## 🛠️ Troubleshooting

### "CLIENT_SECRET is undefined"
- Check `.dev.vars` exists and has correct format
- Verify environment variables are set in Cloudflare Pages
- Restart development server after adding `.dev.vars`

### "Token validation failed"
- Check `CLIENT_ID` matches the one used in token
- Verify `VIM_ISSUER` is correct (default: `https://auth.getvim.com/`)
- Check token hasn't expired

### "Cannot access sessionContext"
- Ensure VimOS SDK is loaded: `await loadSdk()`
- Wait for SDK initialization in `AppWrapper`
- Check authentication flow completed successfully



