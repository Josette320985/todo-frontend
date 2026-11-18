# Contributing

Rules for Team 3 work on this repository. They follow the challenge rules:
work through branches and pull requests, document every change and prove that
it works.

## 1. Branches and pull requests

- `equipo3` is Team 3's integration branch. Never push directly to it.
- Create one branch per task from `equipo3`, named `<member>/<topic>`
  (for example `p3/dockerignore`).
- Open a pull request against `equipo3`. Keep it focused on one finding or task.
- The pull request description is written in English and contains:
  - **Problem**: what was wrong and the finding ID (for example `SEG-H01`).
  - **Change**: what was changed and why.
  - **How it was tested**: commands that were run and their output.
  - **Acceptance criteria**: the checklist from the security report, ticked.
  - **Coordination**: other members who touch the same files.
- Do not merge without a review from another team member.

## 2. Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
and are written in English:

```text
type(scope): short summary in imperative mood (SEG-Hxx)

Optional body explaining why the change is needed.
```

- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, `revert`.
- The scope is optional, lowercase (`auth`, `docker`, `nginx`...).
- The header is at most 72 characters.
- Keep commits small: one logical change per commit.

## 3. No code without documentation

Every commit that changes code must also change documentation in the same
commit. A file counts as documentation when it lives under `docs/` or ends in
`.md`. Usually this means adding an entry to [CHANGELOG.md](CHANGELOG.md) and,
when relevant, updating your report under [team3/](team3/README.md).

The list of paths that count as code lives in `.githooks/code-paths` (one
extended regular expression per line). It is shared by the local hook and the
CI check.

If a code change really needs no documentation (for example a typo fix in a
comment), add this trailer to the commit message so the reason is recorded:

```text
Docs-Exempt: <reason>
```

On pull requests the same exception is the `docs-exempt` label.

## 4. Enable the Git hooks

The rules above are enforced locally by `.githooks/commit-msg`. Enable it once
per clone:

```bash
git config core.hooksPath .githooks
```

The hook rejects commits whose header does not follow the format, and commits
that change code without changing documentation. The same rules run in CI on
every pull request (`.github/workflows/commit-rules.yml`), so skipping the
hook does not skip the check.

## 5. Tests

Changes must be proven to work. At minimum, the build and the linter must
pass:

```bash
npm ci
npm run lint
npm run build
```

Behaviour that only shows up at runtime (nginx rules, browser behaviour) is
proven with the commands and output pasted in the pull request and in the
member report.

## 6. Secrets

Never commit credentials or `.env` files.
