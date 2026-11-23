# AGENTS.md

## UI: ui-sdk + Tailwind CSS

Before using ui-sdk, follow the ui-sdk skill if it's installed (`.agents/skills/ui-sdk`), and read `node_modules/@ui-sdk/react/docs/llms.txt`. To build a new component, also search `node_modules/@ui-sdk/react/docs/core.md` by heading, and read `rendering.md` next to it.

- Import each component from its own entry, like `@ui-sdk/react/button`.
- Style with Tailwind utilities and the `--ui-*` tokens set in `src/styles.css`; target state through `data-*` attributes, never inline styles.
- `src/styles.css` must keep its first lines in this order: `@layer ui-sdk;`, `@import "tailwindcss";`, `@import "@ui-sdk/core/web.css" layer(components);`.
