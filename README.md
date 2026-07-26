<a href="https://extension.js.org" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/Powered%20by%20%7C%20Extension.js-0971fe" alt="Powered by Extension.js" align="right" /></a>

# web_effects

> JavaScript-based extension with a sidebar panel. Adds a sidebar with a simple page.


![screenshot](./public/screenshot.png)
## Commands

### dev

Run the extension in development mode. Target a browser with `--browser`:

```bash
bun run dev
bun run dev -- --browser=firefox
bun run dev -- --browser=edge
```

### build

Build for production. Convenience scripts target each browser:

```bash
bun run build           # Chrome (default)
bun run build:firefox
bun run build:edge
```

### preview

Preview the production build in the browser:

```bash
bun run preview
```

## Learn more

[Extension.js docs](https://extension.js.org).
