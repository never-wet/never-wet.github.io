import { gameIds, type GameId } from "./types";

export const gameManifest = {
  appName: "Boardgame Vault",
  tagline: "A local-first strategy lounge for classic head-to-head games.",
  featuredGames: ["chess", "reversi", "connect4"] as GameId[],
  supportedGames: gameIds,
  routes: {
    home: "/",
    games: "/games",
    dashboard: "/dashboard",
    settings: "/settings",
    play: "/play/:gameId",
  },
  featureFlags: {
    undo: true,
    resume: true,
    rulesDrawer: true,
    dashboard: true,
  },
};
