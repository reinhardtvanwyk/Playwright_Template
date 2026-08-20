# Playwright Template

A Playwright end-to-end testing template with AI agent support for Kiro and GitHub Copilot.

---

## Project Structure

```
playwright_template/
├── .github/
│   ├── agents/                          # GitHub Copilot agent definitions
│   │   ├── playwright-test-generator.agent.md
│   │   ├── playwright-test-healer.agent.md
│   │   └── playwright-test-planner.agent.md
│   └── workflows/
│       ├── playwright.yml               # CI workflow
│       └── copilot-setup-steps.yml      # Copilot coding agent setup
├── .kiro/
│   ├── agents/                          # Kiro agent definitions (mirrors .github/agents/)
│   │   ├── playwright-test-generator.agent.md
│   │   ├── playwright-test-healer.agent.md
│   │   └── playwright-test-planner.agent.md
│   └── flows/                           # Human-authored user flow definitions
│       ├── homepage.flow.md             # top-level flow → tests/homepage.spec.ts
│       └── checkout/
│           └── adolescent.flow.md       # nested flow → tests/checkout/adolescent.spec.ts
├── .vscode/
│   └── mcp.json                         # MCP server config (Playwright test runner)
├── specs/                               # AI-generated test plans (output of planner agent)
├── tests/                               # Playwright test files
│   ├── seed.spec.ts                     # Seed file used as agent starting point
│   └── example.spec.ts                  # Template test using baseURL
└── playwright.config.ts                 # Global Playwright configuration
```

---

## Configuration

### Base URL

The application URL is configured globally in `playwright.config.ts` via the `BASE_URL` environment variable:

```ts
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
```

Set it at runtime to point tests at any environment:

```sh
BASE_URL=https://staging.example.com npm test
```

All tests use relative paths (e.g. `page.goto('/')`) and inherit the base URL automatically — no hardcoded URLs in test files.

---

## Writing Test Cases

### Option 1 — Human-authored flows (recommended)

Create a `.flow.md` file in `.kiro/flows/` describing the user journey in plain language. The file name and folder structure determine the output test file path.

**Naming convention:**

| Flow file | Generated test file |
|-----------|-------------------|
| `.kiro/flows/homepage.flow.md` | `tests/homepage.spec.ts` |
| `.kiro/flows/checkout/adolescent.flow.md` | `tests/checkout/adolescent.spec.ts` |

The rule: replace the `.kiro/flows/` prefix with `tests/` and swap `.flow.md` for `.spec.ts`, preserving all subdirectories.

**Flow file format** — write plain steps and expectations:

```markdown
## Homepage

### Load the page
1. Navigate to `/`
2. Verify the page title is visible
3. Verify the main navigation is present

### Hero banner
1. Verify the hero heading is displayed
2. Click the primary CTA button
3. Verify the user is redirected to `/signup`
```

Once a flow file exists, invoke the **playwright-test-generator** agent to turn it into a `.spec.ts` file.

### Option 2 — Agent-generated plans

Invoke the **playwright-test-planner** agent to explore the live application and produce a structured plan in `specs/`. Then invoke **playwright-test-generator** to convert each plan item into a test file.

---

## Agents

All three agents are available in both **Kiro** (`.kiro/agents/`) and **GitHub Copilot** (`.github/agents/`). They share the same instructions and behave identically regardless of which IDE you use.

The agents communicate with the application through a local MCP server that exposes Playwright browser tools. Ensure the MCP server is running before invoking any agent (it starts automatically in most configurations via `.vscode/mcp.json`).

### playwright-test-planner

Explores the live application and produces a comprehensive test plan in `specs/`.

**When to use:** You want full test coverage for a new feature or page and don't yet have flow files written.

**How to invoke:**
> "Plan tests for the checkout flow"

**What it does:**
1. Reads `playwright.config.ts` to resolve the base URL — prompts you if none is configured.
2. Reads all `.kiro/flows/*.flow.md` files to understand intended user journeys.
3. Navigates the live application and maps interactive elements and user paths.
4. Saves a structured plan to `specs/` using `planner_save_plan`.

---

### playwright-test-generator

Converts a flow file or plan into a runnable `.spec.ts` test.

**When to use:** You have a `.flow.md` file or a plan in `specs/` and want to generate the corresponding Playwright test.

**How to invoke:**
> "Generate tests from .kiro/flows/checkout/adolescent.flow.md"

**What it does:**
1. Reads the flow from `.kiro/flows/` (or falls back to `specs/` if no flow file exists).
2. Sets up a live browser session and executes each step interactively.
3. Reads the recorded interaction log.
4. Writes the test file to `tests/{path}.spec.ts`, mirroring the flow file's path.

---

### playwright-test-healer

Debugs and fixes failing tests.

**When to use:** One or more tests are failing after an application change.

**How to invoke:**
> "Fix the failing tests"

**What it does:**
1. Reads the corresponding `.kiro/flows/` file to understand the original intent.
2. Runs all tests and identifies failures.
3. Debugs each failure — inspects selectors, timing, and assertions against the live application.
4. Edits the test file to fix the root cause and reruns until all tests pass.

---

## Authentication

Test credentials are stored in AWS SSM Parameter Store as `SecureString` values and retrieved at runtime. No passwords are committed to the repository.

### How AWS SSM Parameter Store Works

AWS Systems Manager (SSM) Parameter Store is a secure, managed key-value store. This project uses it as a secrets vault for test user credentials:

- Parameters are stored as **SecureString**, which means AWS encrypts the value at rest using a KMS key. The value is only decrypted at retrieval time by callers with the right IAM permissions.
- The project calls `GetParameter` with `WithDecryption: true` — AWS decrypts the value server-side and returns it in plaintext over TLS. The decrypted value is never stored on disk or in any cache.
- Access is controlled entirely by IAM: the AWS identity running the tests (a CI role or developer credentials) must have `ssm:GetParameter` permission on the relevant paths and `kms:Decrypt` on the associated KMS key.

### Storing Parameters

Use the AWS CLI to create or update a parameter. Always use `SecureString` for credentials:

```sh
# Create a new SecureString parameter (uses the AWS-managed KMS key by default)
aws ssm put-parameter \
  --name "/playwright/staging/adolescent/username" \
  --value "teen@example.com" \
  --type SecureString \
  --region us-east-1

aws ssm put-parameter \
  --name "/playwright/staging/adolescent/password" \
  --value "s3cur3P@ss!" \
  --type SecureString \
  --region us-east-1

# Update an existing parameter (add --overwrite)
aws ssm put-parameter \
  --name "/playwright/staging/adolescent/password" \
  --value "newP@ss!" \
  --type SecureString \
  --overwrite \
  --region us-east-1
```

To use a custom KMS key instead of the AWS-managed default, add `--key-id alias/your-key-alias`.

### SSM Parameter Structure

All parameters follow this path convention:

```
/playwright/{TEST_ENV}/{userIdentifier}/username
/playwright/{TEST_ENV}/{userIdentifier}/password
```

| Segment | Source | Example |
|---|---|---|
| `TEST_ENV` | `TEST_ENV` env var (default: `dev`) | `dev`, `staging`, `prod` |
| `userIdentifier` | Requested by the test fixture | `admin`, `readonly`, `adolescent` |

**Example paths for user `adolescent` in staging:**
```
/playwright/staging/adolescent/username
/playwright/staging/adolescent/password
```

Each time a test fixture requests credentials, `GetParameter` is called fresh — values are never cached, so rotation takes effect immediately without restarting the test runner.

### Required IAM Permissions

The AWS identity running the tests needs at minimum:

```json
{
  "Effect": "Allow",
  "Action": [
    "ssm:GetParameter"
  ],
  "Resource": "arn:aws:ssm:{region}:{account-id}:parameter/playwright/*"
}
```

If using a custom KMS key, also add:

```json
{
  "Effect": "Allow",
  "Action": "kms:Decrypt",
  "Resource": "arn:aws:kms:{region}:{account-id}:key/{key-id}"
}
```

### Using Credentials in Tests

Import `test` from `lib/auth/fixtures` instead of `@playwright/test`:

```ts
import { test, expect } from '../lib/auth/fixtures';

test('adolescent user sees dashboard', async ({ authenticatedPage }) => {
  const page = await authenticatedPage('adolescent');
  await expect(page).toHaveURL(/dashboard/);
});

test('read raw credentials', async ({ credentials }) => {
  const { username } = await credentials('admin');
  // username is the value from SSM
});
```

### Local Development (No AWS Required)

Copy `.env.example` to `.env` and set the bypass variables:

```sh
cp .env.example .env
# then edit .env:
TEST_USERNAME=localuser@example.com
TEST_PASSWORD=localpassword
```

When both are set, SSM is skipped entirely.

### CI Setup (GitHub Actions)

Add the following to your repository:

- **Secrets**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- **Variables**: `AWS_REGION`, `TEST_ENV`, `BASE_URL`

The workflow reads these automatically — no changes to `playwright.yml` needed.

---

## Running Tests

```sh
# Run all tests
npm test

# Interactive UI mode
npm run test:ui

# Debug mode (pauses on each step)
npm run test:debug

# Target a specific environment
BASE_URL=https://staging.example.com npm test
```

### GitHub Actions

Tests run automatically on push and pull request via `.github/workflows/playwright.yml`. The HTML report is uploaded as a build artifact on failure.

### GitHub Copilot Coding Agent (remote)

To allow the Copilot coding agent to run tests remotely, add the following to **GitHub → Settings → Copilot → Coding agent → MCP configuration**:

```json
{
  "mcpServers": {
    "playwright-test": {
      "type": "stdio",
      "command": "npx",
      "args": ["playwright", "run-test-mcp-server"],
      "tools": ["*"]
    }
  }
}
```
