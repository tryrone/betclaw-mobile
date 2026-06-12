---
name: pre-commit-review
description: >
  Pre-commit code review skill. Use this whenever the user says anything like
  "review my changes before committing", "check my code before I push",
  "pre-commit review", "look at what I'm about to commit", "any issues with
  my diff", "should I commit this", "review staged changes", or just
  "review my changes". Also trigger when the user asks for a sanity check,
  bug check, or best-practices check on their current work-in-progress code.
  Runs git diff to inspect changes and produces a structured review report
  covering bugs, security issues, best practices, and quick wins.
---

# Pre-Commit Code Review

Your job is to act as a thorough but pragmatic code reviewer — the kind of colleague who reads your diff before you push, catches real problems, and points out quick improvements without nitpicking every style choice.

## What to do

1. **Gather the diff** — run these commands in the repo root:
   ```bash
   git diff --cached          # staged changes (what will be committed)
   git diff                   # unstaged changes (work in progress)
   git status --short         # overall picture
   ```
   If both staged and unstaged diffs are non-empty, review both and note which is which. If neither has content, say so and check `git log -1 --stat` for the last commit instead.

2. **Analyse the diff** across four lenses (details below).

3. **Produce the review report** using the template in the "Report format" section.

## Four review lenses

### 🐛 Bugs & correctness
Look for things that will break at runtime or produce wrong results:
- Off-by-one errors, wrong comparisons, inverted conditions
- Unhandled promises / missing `await`
- Null/undefined dereferences where the value could legitimately be absent
- Incorrect type assumptions (e.g. treating a string as a number)
- Race conditions or state mutation in async code
- Wrong variable used (copy-paste errors, shadowed names)
- Early returns that skip important logic

### 🔒 Security & data safety
- Secrets, API keys, tokens, or passwords hardcoded in source
- SQL/command injection surfaces (string interpolation into queries/shell commands)
- Missing input validation on user-controlled data
- Sensitive data written to logs
- Overly permissive CORS, auth bypasses, or missing authorization checks

### 📐 Best practices & code health
Focus on things that genuinely matter, not style preferences:
- Functions doing too many things at once (hard to test, hard to reason about)
- Error paths that swallow exceptions silently (`catch (e) {}`)
- Duplication that would be better extracted (only if the pattern appears 3+ times)
- Inconsistency with the surrounding codebase's conventions (naming, error handling, etc.)
- TypeScript: `any` casts that hide real type errors; missing return types on exported functions
- Missing or outdated tests for changed logic

### 🍒 Low-hanging fruit
Quick, low-risk improvements worth doing now:
- `console.log` / `console.error` / `debugger` left in production code
- TODO/FIXME comments that are actually trivially fixable right now
- Dead code (unreachable branches, unused imports, unused variables)
- Hardcoded magic values that should be named constants
- Missing null checks that are easy to add
- Obvious performance wins (e.g. moving a constant computation out of a loop)

## Calibration

Not every diff has issues in every category. It's fine — and honest — to say a category is clean. Aim for signal over volume: a review with 3 real findings is more useful than one padded with 10 marginal observations.

Severity labels:
- **[critical]** — will cause a crash, data loss, or security breach in production
- **[warning]** — likely causes a bug or maintainability problem; fix before merging
- **[suggestion]** — worthwhile improvement, low risk, easy to do now

Only flag something as `[critical]` if you are confident it will actually cause harm. Use `[warning]` for likely problems; `[suggestion]` for nice-to-haves.

## Report format

Use this structure exactly. If a section has no findings, write "✅ Nothing to flag." — don't omit the section.

```
## Pre-Commit Review

**Files changed:** <N files, +X −Y lines>
**Branch:** <branch name from `git branch --show-current`>

---

### 🐛 Bugs & Correctness
<findings or ✅ Nothing to flag.>

### 🔒 Security & Data Safety
<findings or ✅ Nothing to flag.>

### 📐 Best Practices & Code Health
<findings or ✅ Nothing to flag.>

### 🍒 Low-Hanging Fruit
<findings or ✅ Nothing to flag.>

---

### Summary
<1–3 sentence overall verdict. Is this safe to commit? Any blockers?>
```

Each finding should include:
- The severity label: `[critical]`, `[warning]`, or `[suggestion]`
- File name and line number (or rough location) so the user can find it instantly
- What the problem is and **why it matters**
- A concrete fix or example snippet where helpful

**Example finding:**
```
[warning] `server/services/ai/feature-vector.service.ts` ~line 142
`homeXgFor` is assigned from `enrichment?.homeXg?.xgFor ?? 0` but `enrichment`
can be undefined if the xG provider fails. The `?? 0` is fine, but downstream
callers divide by this value — a zero here produces Infinity. Clamp to a small
positive value (e.g. `Math.max(0.01, ...)`) or guard the division site.
```

## Working efficiently

- Read the diff top-to-bottom once to understand what changed conceptually, then apply the four lenses.
- For large diffs (500+ lines), focus on the most impactful files first — entry points, service logic, schema changes.
- If a diff touches a test file, verify the tests actually cover the changed logic (not just that tests exist).
- If the diff is a migration or schema change, pay extra attention to irreversibility and default values.
