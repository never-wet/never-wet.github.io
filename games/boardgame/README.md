# Boardgame Vault

Boardgame Vault is a React + TypeScript + Vite strategy hub that runs fully in the browser and saves progress with `localStorage`.

Included games:

- Chess
- Connect 4
- Checkers
- Tic-Tac-Toe
- Reversi
- Gomoku

Features:

- Three AI difficulty tiers
- Local save and resume support
- Move history and undo
- Dashboard stats and recent match log
- Settings and rules panels
- Compact memory files under `src/memory/`

## Scripts

```bash
npm install
npm run dev
npm run build
```

The build copies `dist/dev.html` to `index.html` and publishes hashed assets into `assets/` for static hosting.
