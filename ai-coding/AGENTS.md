# Repository Guidelines

## Project Structure & Module Organization
- Root holds shared tooling: `.eslintrc.js`, the Prettier presets, and workspace-level `package.json` used only for linting.
- `js/system/` tracks release automation; run `git submodule update --init --recursive` so the `debugpp` submodule is available before cutting releases.
- `Серафими/` contains the working assets. Large SVG/STL source files live at the directory root, while all automation code sits in `Серафими/code/` (TypeScript sources, configs, and its own `package.json`).

## Build, Test, and Development Commands
- Install workspace tooling once with `yarn install`; lint any patch via `yarn lint .` from the repository root.
- Initialize the CLI workspace with `yarn --cwd "Серафими/code" install`, then build it using `yarn --cwd "Серафими/code" build` (runs `colabo puzzles-install`, `tsc`, and injects the version number).
- To process the SVG inputs while iterating, run `TS_NODE_PROJECT=./tsconfig.json node --trace-warnings --experimental-specifier-resolution=node --loader "$COLABO/ts-esm-loader-with-tsconfig-paths.js" index.ts` from `Серафими/code/`.

## Coding Style & Naming Conventions
- Prettier enforces tabs (`tabWidth: 4`), double quotes, trailing commas, and an intentionally wide `printWidth` (600) to keep complex SVG metadata readable.
- ESLint requires explicit module boundary types and allows Cyrillic identifiers; retain the existing naming style when extending `Серафими/code/*.ts`.
- All TypeScript is authored as ECMAScript modules; prefer named exports and keep helper utilities alongside the assets they transform.

## Testing Guidelines
- There is no dedicated test runner yet; validate changes by executing the TypeScript pipeline above and reviewing the regenerated SVG/STL artifacts.
- When adding non-trivial helpers, include focused `*.spec.ts` scripts that can be executed with `npx nyc ts-node <spec>`; capture expected output snippets in PR notes until a formal harness lands.
- Document manual verification steps (input file, command, resulting artifact) so others can replay them.

## Commit & Pull Request Guidelines
- Git history so far uses very short subjects (`Upd`); keep messages concise but prefer `type(scope): summary` to make future archaeology easier.
- Reference impacted asset names and note regenerated files in the commit body to aid reviewers handling large binaries.
- Pull requests should link tracking issues where possible, describe the command sequence used for verification, and attach thumbnails or diffs for any updated SVG/STL assets.
