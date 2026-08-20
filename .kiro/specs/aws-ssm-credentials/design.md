# AWS SSM Credentials — Design

## SSM Parameter Naming Convention

All credentials are stored as **SecureString** parameters. The path follows:

```
/playwright/{environment}/{userIdentifier}/username
/playwright/{environment}/{userIdentifier}/password
```

| Variable | Source | Example |
|---|---|---|
| `environment` | `TEST_ENV` env var (default: `dev`) | `dev`, `staging`, `prod` |
| `userIdentifier` | Requested by the test | `admin`, `readonly`, `adolescent` |

**Examples:**

```
/playwright/staging/admin/username   →  "admin@example.com"
/playwright/staging/admin/password   →  "s3cr3t!"
/playwright/staging/adolescent/username  →  "teen@example.com"
/playwright/staging/adolescent/password  →  "p@ssw0rd"
```

---

## Credential Resolution Flow

```
Test requests user "adolescent"
       │
       ▼
Is TEST_USERNAME + TEST_PASSWORD set?
  Yes → return { username: TEST_USERNAME, password: TEST_PASSWORD }
  No  ↓
       ▼
Is "adolescent" in session cache?
  Yes → return cached credentials
  No  ↓
       ▼
Fetch from SSM:
  GET /playwright/{TEST_ENV}/adolescent/username
  GET /playwright/{TEST_ENV}/adolescent/password
       │
       ▼
Cache result → return { username, password }
```

---

## File Structure

```
lib/
└── auth/
    ├── ssm-credentials.ts    # SSM fetch + cache logic
    └── fixtures.ts           # Playwright fixtures: credentials, authenticatedPage
tests/
└── seed.spec.ts              # Updated to use authenticatedPage fixture
.env.example                  # Documents TEST_USERNAME, TEST_PASSWORD, AWS_REGION, TEST_ENV
```

---

## `ssm-credentials.ts`

Exports a single async function:

```ts
getCredentials(userIdentifier: string): Promise<{ username: string; password: string }>
```

- Uses `@aws-sdk/client-ssm` (`GetParameter` with `WithDecryption: true`)
- Session-scoped in-memory cache keyed by `{environment}/{userIdentifier}`
- Env-var bypass: if `TEST_USERNAME` is set, returns those values regardless of identifier

---

## `fixtures.ts`

Extends Playwright's base `test` with two fixtures:

| Fixture | Type | Description |
|---|---|---|
| `credentials` | `({ userIdentifier?: string }) => Promise<Credentials>` | Returns raw `{ username, password }` for a given user |
| `authenticatedPage` | `({ userIdentifier?: string }) => Promise<Page>` | Returns a `Page` already past the login wall |

**`authenticatedPage` login steps:**
1. `page.goto('/')` (uses global `baseURL`)
2. Fill username field
3. Fill password field
4. Click submit
5. Assert URL has changed away from login page (configurable selector)

---

## Dependencies

```sh
npm install --save-dev @aws-sdk/client-ssm
```

AWS credentials for CI must be provided via `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` environment variables or an IAM role attached to the runner.

---

## Environment Variables Reference

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `BASE_URL` | No | `http://localhost:3000` | Application under test |
| `AWS_REGION` | No | `us-east-1` | SSM region |
| `TEST_ENV` | No | `dev` | SSM path environment segment |
| `TEST_USERNAME` | No | — | Bypass SSM (local dev) |
| `TEST_PASSWORD` | No | — | Bypass SSM (local dev) |
| `AWS_ACCESS_KEY_ID` | CI only | — | AWS auth |
| `AWS_SECRET_ACCESS_KEY` | CI only | — | AWS auth |
