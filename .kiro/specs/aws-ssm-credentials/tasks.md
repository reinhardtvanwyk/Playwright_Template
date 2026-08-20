# AWS SSM Credentials — Tasks

## Implementation Tasks

- [ ] **TASK-1** Install `@aws-sdk/client-ssm` as a dev dependency
  - `npm install --save-dev @aws-sdk/client-ssm`

- [ ] **TASK-2** Create `lib/auth/ssm-credentials.ts`
  - Implement `getCredentials(userIdentifier)` with SSM fetch and session cache
  - Implement env-var bypass (`TEST_USERNAME` / `TEST_PASSWORD`)
  - Throw descriptive errors on missing parameters or SSM failures

- [ ] **TASK-3** Create `lib/auth/fixtures.ts`
  - Export extended `test` with `credentials` and `authenticatedPage` fixtures
  - `authenticatedPage` performs login using `baseURL` and retrieved credentials

- [ ] **TASK-4** Create `.env.example`
  - Document all environment variables with descriptions and example values

- [ ] **TASK-5** Update `tests/seed.spec.ts`
  - Import `test` from `lib/auth/fixtures` instead of `@playwright/test`
  - Add a commented example showing how to use `authenticatedPage` with a user identifier

- [ ] **TASK-6** Update `playwright.config.ts`
  - Add `AWS_REGION` and `TEST_ENV` to the config comment block for discoverability

- [ ] **TASK-7** Update `.github/workflows/playwright.yml`
  - Add `AWS_REGION`, `TEST_ENV`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` to the env block (sourced from GitHub secrets)

- [ ] **TASK-8** Update `README.md`
  - Add "Authentication" section describing SSM parameter structure and local bypass
