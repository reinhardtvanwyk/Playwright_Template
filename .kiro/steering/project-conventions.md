# Project Conventions

## Testing

- All test files live in `tests/` and use the `.spec.ts` extension
- When sourcing from a flow file, mirror the path: `.kiro/flows/{path}.flow.md` → `tests/{path}.spec.ts`
- Import `test` and `expect` from `../lib/auth/fixtures`, not from `@playwright/test`, so the SSM credential fixtures are available
- Use `page.goto('/')` and relative paths — never hardcode the base URL in a test

## Authentication

- Test credentials are stored in AWS SSM Parameter Store — never hardcode usernames or passwords
- Use the `authenticatedPage(userIdentifier)` fixture to get a logged-in page
- Use the `credentials(userIdentifier)` fixture to get raw `{ username, password }` when the test needs them directly
- User identifiers map to SSM paths: `/playwright/{TEST_ENV}/{userIdentifier}/username|password`

## Flows

- Human-authored user journeys live in `.kiro/flows/`
- Flows define the intended behaviour for a feature and are the source of truth for test generation and healing
- Subdirectories in `.kiro/flows/` are preserved in `tests/` (e.g. `.kiro/flows/checkout/adolescent.flow.md` → `tests/checkout/adolescent.spec.ts`)

## Git

- Never commit directly to `main`, `master`, or `develop`
- Use conventional commits: `<type>(<scope>): <summary>` — max 72 chars
- Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`
- Use the `commit-and-push` agent to handle branch checkout and commit safely

## Configuration

- `BASE_URL` env var sets the application URL globally (`playwright.config.ts`)
- `TEST_ENV` sets the SSM path segment (default: `dev`)
- `AWS_REGION` sets the SSM region (default: `us-east-1`)
- Set `TEST_USERNAME` + `TEST_PASSWORD` locally to bypass SSM entirely
