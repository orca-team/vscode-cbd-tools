# AGENTS.md

Guidance for AI agents working in the `cbd-tools` VS Code extension codebase.

## Project Overview

`cbd-tools` is a VS Code extension providing two features for frontend development with the cbd-framework:

1. **Template-based code generation** — right-click a folder in the Explorer, pick a template, name it, and files are scaffolded with variable substitution.
2. **Quick jump** — keyboard shortcuts to switch between related files (e.g. `.tsx` ↔ `.less`, `.ts` ↔ `.vue`).

## Essential Commands

| Task | Command | Notes |
|------|---------|-------|
| Install deps | `pnpm install` | CI uses pnpm; npm also works locally |
| Build (bundle) | `npm run esbuild` | esbuild → `out/extension.js` (with sourcemaps) |
| Watch build | `npm run esbuild-watch` | Rebuilds on file change |
| Pre-publish build | `npm run vscode:prepublish` | Minified bundle for packaging |
| Type check | `npm run compile` | `tsc -p ./` (no emit used for type-checking) |
| Lint | `npm run lint` | `eslint src --ext ts` |
| Test | `npm test` | vitest, node environment, watch mode by default |
| Run once | `npx vitest run` | Non-watch single run |
| Package vsix | `npm run vscode:package` | `vsce package --no-dependencies` |
| Publish | `npm run deploy` | Requires `$VSCODE_MARKETPLACE_TOKEN` |
| Add changeset | `npm run c` | Opens changeset prompt for versioning |

**Debug the extension**: Press `F5` in VS Code to launch an Extension Development Host with the extension loaded.

## Architecture & Data Flow

### Entry Point

`src/extension.ts` exports `activate(context)`, which calls `register(context)` from each feature module. Each feature module is self-contained under its own directory and follows the same shape:

```
src/
├── extension.ts          # activate() — wires up feature registers
├── const.ts              # TEMPLATE_ROOT: path to bundled templates/
├── utils.ts              # (currently empty/unused)
├── quickJump/
│   ├── register.ts       # command handlers (VS Code API calls)
│   └── quickJumpUtils.ts # pure functions (file path logic, testable)
└── createTemplate/
    ├── register.ts       # command handler (UI: QuickPick, InputBox)
    └── templateUtils.ts  # core logic (scanning, substitution, file writing)
```

### Feature Module Convention

Each feature follows the **`register.ts` + `*Utils.ts`** split:
- `register.ts` — exports `register(context: vscode.ExtensionContext)`, owns all VS Code API interactions (commands, windows, dialogs). Contains no pure logic.
- `*Utils.ts` — pure functions with no VS Code dependencies (except `templateUtils.ts` which imports vscode for `showWarningMessage`). These are the unit-testable surfaces.

### Quick Jump Flow

1. Command fires (`quick-jump-to-js` / `-css` / `-vue`).
2. `register.ts` reads `window.activeTextEditor.document.fileName`.
3. Calls the matching util (`quickJumpToJs` / `quickJumpToCss` / `quickJumpToVue`).
4. `quickJumpByExtensions` splits the filename by `.`, generates candidate filenames by swapping extensions, and returns the first path where `existsSync` is true.

### Template Generation Flow

1. Right-click → `cbd-tools.create-template` fires with the clicked path.
2. `getAllTemplates(currentPath)` merges **built-in** templates (from `templates/`, bundled with the extension) and **custom** templates (from the workspace's `cbd-templates/` dir or a path configured in `cbd-tools.json`).
3. `getSuggestListByPath` infers the template type (`component` vs `page`) from the path — `/components/` → component, `/pages/` → page — and sorts matching types to the top (+100 to `order`).
4. User picks a template via QuickPick (grouped: 内置模板 / 自定义模板), then enters a name via InputBox.
5. `createTemplate` walks the template directory, applies variable substitution to both **filenames and content**, checks for file conflicts (prompts to overwrite), then writes files with `mkdirp`.

## Template System Internals

### Template Structure

Each template is a directory containing:
- `meta.json` (required) — `{ type, order, description }`. Without it, the directory is skipped during scanning.
- One or more template files — filenames and contents support `${expression}` placeholders.

`meta.json` is in `RESERVED_FILES` and is never emitted as an output file.

### Variable Substitution

`executeTemplateContent` in `templateUtils.ts` builds a JS function via `new Function()` that destructures `change-case` functions and interpolates the template body as a template literal. This means:
- Template file contents are **evaluated as JavaScript template literals** — any `${expr}` is executed, not just string-replaced.
- Available variables: `name` (the user-provided name), plus all `change-case` functions: `camelCase`, `pascalCase`, `paramCase`, `snakeCase`, `constantCase`, `dotCase`, `headerCase`, `pathCase`, `noCase`, `sentenceCase`, `capitalCase`.
- Backticks in template content are escaped before evaluation.
- The `any` type is intentionally used here (eslint-disabled at file top).

### Built-in Templates

Located in `templates/`. Four templates ship with the extension:
- `func-component-ts` — TS function component with `.module.less`
- `func-component-ts-pc` — TS function component with `.less` (PC variant)
- `func-component-ts-jss` — TS function component with JSS (`.style.ts`)
- `page` — page template with `.module.less`

### Custom Templates

Users add templates to their workspace. Configurable via `cbd-tools.json` at the project root:
```json
{ "customTemplateDir": "my-templates" }
```
Default directory is `cbd-templates`. The project root is resolved from `vscode.workspace.workspaceFolders[0]`.

## Testing

- **Framework**: vitest (`vitest.config.ts`), node environment, globals enabled.
- **Location**: tests live in `__tests__/` directories next to the code under test (e.g. `src/quickJump/__tests__/quickJumpUtils.test.ts`).
- **Pattern**: only `quickJumpUtils` has tests currently. The pure-function split makes utils easy to test with mocked `fs`.
- **Mocking**: tests mock `fs` via `vi.mock('fs', ...)` and use `vi.mocked(fs.existsSync)` with `mockReturnValueOnce` to simulate which files exist.

## Code Conventions

- **Language**: TypeScript, `strict: true`, target ES6, CommonJS modules.
- **Linting**: `@orca-fe/eslint-config` with `no-console: warn`. Console logs are used liberally for debugging — they're warnings, not errors.
- **Comments**: codebase uses Chinese comments for domain logic; follow suit in feature modules.
- **Error handling**: commands wrap logic in try/catch and surface errors via `vscode.window.showErrorMessage`. User-facing strings are in Chinese.
- **Path handling**: `createTemplate/register.ts` strips a leading `/` on Windows (`event.path.replace(/^\//, '')`). Be aware of platform-specific path differences.

## Build & Packaging

- **Bundler**: esbuild bundles `src/extension.ts` → `out/extension.js` (CJS, `--external:vscode`, node platform). `templates/` is copied as-is (not bundled).
- **`tsconfig.json`**: excludes `templates/` and `node_modules`. `typeRoots` points at `../node_modules` (relative to `src`).
- **`.vscodeignore`**: excludes `src/`, `*.ts`, `*.map` from the vsix, but **keeps `templates/`** — built-in templates ship with the extension.
- **`.eslintignore`**: excludes `scripts/` and `templates/` from linting.

## Release & Publishing

Versioning uses **changesets** (`.changeset/config.json`): `commit: false`, `access: restricted`, `baseBranch: main`.

The release flow is automated via `.github/workflows/publish-vsce.yml`:
1. On push to `main`, the `changesets/action` runs.
2. If there are pending changesets, it opens/updates a "Version Packages" PR (bumps `package.json` + `CHANGELOG.md`).
3. When that PR is merged, the action runs `pnpm run pub` → `scripts/publish.ts`.
4. `publish.ts` checks if the current `package.json` version already exists on the marketplace (via `vsce show --json`). If not, it runs `npm run deploy` (`vsce publish`) and writes `customPublished=true` to `$GITHUB_OUTPUT`.

**To cut a release**: run `npm run c` to add a changeset, commit it, and merge to `main`. The CI handles the rest. The `VSCODE_MARKETPLACE_TOKEN` secret is required in GitHub.

## Gotchas

- **`utils.ts` is empty** — don't assume it has shared helpers; check before importing from it.
- **`getTypeByPath` uses Unix path separators** (`/src/`, `/components/`, `/pages/`) — it won't match Windows-style backslash paths. This is a known limitation.
- **`quickJumpByExtensions` multi-dot logic**: for a filename like `file.d.ts`, it tries replacing the last **two** segments (→ `file.js`) first, then the last **one** (→ `file.d.js`). This is intentional to support `.d.ts` → `.js` jumps.
- **Template content is eval'd**, not string-replaced. A `${` in template content that isn't a valid expression will throw at generation time. Template files in `templates/` are not type-checked or linted.
- **`getSuggestListByPath` mutates a copy** (`templateList.slice().sort(...)`) — the original list is not mutated, but `defaultTemplateList` is module-level and shared across calls.
- **`scanTemplates()` runs at module load time** (`const defaultTemplateList = scanTemplates()`) — built-in templates are read from disk once on import. Changes to `templates/` during a session won't be picked up without a reload.
- **`.npmrc` points to `registry.npmmirror.com`** — the China npm mirror. CI overrides this via pnpm. If you hit 404s on obscure packages locally, this is why.
- **`pnpm` vs `npm` mismatch**: `package.json` scripts use `npm run`, but CI uses `pnpm`. The `prepare` script (`husky`) runs on install in both. Use pnpm to match CI.
