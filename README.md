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
