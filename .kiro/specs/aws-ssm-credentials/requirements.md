# AWS SSM Credentials — Requirements

## Overview

Tests need to authenticate through login walls using credentials managed in AWS Systems Manager (SSM) Parameter Store. Credentials must never be hardcoded in test files or committed to the repository.

## Requirements

### REQ-1: AWS SSM Connectivity

The project must be able to connect to AWS SSM Parameter Store at test runtime using the standard AWS credential chain (environment variables, `~/.aws/credentials`, or IAM role).

**Acceptance criteria:**
- Connection uses the AWS region configured via `AWS_REGION` environment variable (default: `us-east-1`)
- Authentication falls through the standard AWS SDK credential provider chain
- A clear error is thrown if SSM is unreachable or credentials are missing

---

### REQ-2: Credential Retrieval by User Type

Tests must be able to retrieve a named set of credentials (username + password) by a logical user identifier (e.g. `admin`, `readonly`, `adolescent`).

**Acceptance criteria:**
- Given a user identifier, the system returns `{ username: string, password: string }`
- Each user maps to a pair of SSM parameters following a consistent naming convention (see Design)
- Credentials are retrieved once per test session and cached to avoid redundant SSM calls
- A meaningful error is thrown if a requested user identifier does not exist in SSM

---

### REQ-3: Per-Test User Selection

Individual test cases must be able to specify which user they require without affecting other tests.

**Acceptance criteria:**
- Tests declare the required user via a Playwright fixture — no manual SSM calls in test body
- Different tests in the same file can use different user identities
- Parallel test workers each resolve credentials independently

---

### REQ-4: Login Wall Automation

A reusable Playwright fixture must handle the full login flow using retrieved credentials, so individual tests do not repeat login steps.

**Acceptance criteria:**
- An `authenticatedPage` fixture navigates to the login page, enters credentials, and returns an authenticated `Page`
- The fixture accepts the user identifier as a parameter
- Login failure produces an actionable error message identifying the user and URL attempted

---

### REQ-5: Local Development Without AWS

Developers must be able to run tests locally without an AWS account by supplying credentials via environment variables.

**Acceptance criteria:**
- If `TEST_USERNAME` and `TEST_PASSWORD` environment variables are set, SSM is bypassed entirely
- A `.env.example` file documents the expected variables
- CI pipelines use SSM; local runs can use either SSM or env vars
