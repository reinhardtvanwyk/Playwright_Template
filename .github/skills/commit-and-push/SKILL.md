---
name: commit-and-push
description: 'Commit and optionally push changes to a git repository. Use when committing work, staging files, or pushing a branch. Accepts a branch name as argument — creates the branch if it does not exist. NEVER commits to protected branches: main, master, or develop — aborts with a clear error if on one of those.'
argument-hint: '<branch-name> [commit message]'
---

# Commit and Push

Safely checkout (or create) a branch, stage, commit, and push changes. Aborts on protected branches.

## Protected Branches

Never commit to: `main`, `master`, `develop`.

If the resolved target branch matches any of those names, stop and tell the user:

> "Cannot commit directly to `{branch}`. Please provide a feature branch name (e.g. `feat/my-change`)."

Do not proceed past step 1 until the branch is confirmed safe.

## Argument Parsing

The argument string has the form: `<branch-name> [optional commit message]`

- First word → branch name
- Remaining words → commit message (optional; derived from diff if omitted)

If no argument is provided, ask the user for the target branch name before proceeding.

## Procedure

### 1. Resolve Target Branch

Parse the branch name from the argument. Validate it is not a protected branch.

### 2. Checkout or Create Branch

Check whether the branch already exists locally:

```sh
git branch --list <branch-name>
```

**Branch exists locally** — check it out:

```sh
git checkout <branch-name>
```

**Branch does not exist locally** — check if it exists on the remote:

```sh
git ls-remote --heads origin <branch-name>
```

- Remote branch exists → fetch and checkout tracking branch:
  ```sh
  git checkout --track origin/<branch-name>
  ```
- Remote branch does not exist → create a new branch from current HEAD:
  ```sh
  git checkout -b <branch-name>
  ```

### 3. Inspect Status

```sh
git status
```

Show the user a summary of staged, unstaged, and untracked files. Ask which files to include if not all changes should be committed together.

### 4. Stage Files

Stage all changes unless the user specified a subset:

```sh
# All changes
git add -A

# Or specific paths
git add <path1> <path2>
```

### 5. Compose Commit Message

If a commit message was provided as part of the argument, use it verbatim.

Otherwise, derive a concise conventional-commit message from the staged diff:
- Format: `<type>(<scope>): <short summary>` — max 72 chars
- Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`
- Confirm the message with the user before committing

```sh
git diff --staged --stat
```

### 6. Commit

```sh
git commit -m "<message>"
```

### 7. Push

Ask the user: "Push to `origin/<branch-name>` now?"

If yes:

```sh
git push origin <branch-name>
```

If the remote branch does not exist yet, use `--set-upstream`:

```sh
git push --set-upstream origin <branch-name>
```

### 8. Confirm

Report the commit hash and branch:

```sh
git log --oneline -1
```


```sh
git push --set-upstream origin <branch>
```

### 7. Confirm

Report the commit hash and branch:

```sh
git log --oneline -1
```
