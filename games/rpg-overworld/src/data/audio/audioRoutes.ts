export const audioRoutes = {
  home: { music: "menu-dream", ambience: "rain-harbor" },
  locations: {
    thornwake: { music: "town-lanterns", ambience: "rain-harbor" },
    "lantern-house": { music: "town-lanterns", ambience: "rain-harbor" },
    "gloamwood-trail": { music: "forest-whispers", ambience: "forest-cicada" },
    "rainmire-crossing": { music: "forest-whispers", ambience: "forest-cicada" },
    "saint-veyra-abbey": { music: "abbey-depths", ambience: "ruin-drip" },
    "skyglass-spire": { music: "boss-starfall", ambience: "ruin-drip" },
  },
  battleFallback: "boss-starfall",
} as const;
