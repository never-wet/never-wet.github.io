export const questIndex = {
  main: [
    "main-bell-in-the-fog",
    "main-roots-of-the-whisperblight",
    "main-abbey-of-broken-vows",
    "main-hollow-star",
  ],
  side: ["side-herbal-remedy", "side-missing-caravan", "side-smuggler-ledger"],
  dependencies: {
    "main-roots-of-the-whisperblight": ["main-bell-in-the-fog"],
    "main-abbey-of-broken-vows": ["main-roots-of-the-whisperblight"],
    "main-hollow-star": ["main-abbey-of-broken-vows"],
    "side-missing-caravan": ["main-bell-in-the-fog"],
    "side-herbal-remedy": ["main-bell-in-the-fog"],
    "side-smuggler-ledger": ["main-roots-of-the-whisperblight"],
  },
} as const;
