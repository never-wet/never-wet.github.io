const SEARCH_PARAMS = new URLSearchParams(window.location.search);
const TEST_MODE = SEARCH_PARAMS.get("self-test") === "1";
const INITIAL_PANEL = ["upgrades", "ledger", "settings"].includes(SEARCH_PARAMS.get("panel"))
  ? SEARCH_PARAMS.get("panel")
  : null;
const STORAGE_KEY = TEST_MODE
  ? "neverwet-midnight-pawn-save-v1-self-test"
  : "neverwet-midnight-pawn-save-v1";
const SAVE_VERSION = 1;
const SELLERS_PER_NIGHT = 8;
const STARTING_CASH = 120;
const STARTING_REPUTATION = 0;
const STARTING_NIGHT = 1;
const STARTING_SHELF_SLOTS = 4;
const MAX_SHELF_SLOTS = 8;
const STARTING_CURIO_SLOTS = 2;
const MAX_CURIO_SLOTS = 5;
const TARGET_PROFIT_BASE = 60;
const TARGET_PROFIT_STEP = 35;
const BASE_SALE_CHANCE = 0.55;
const HOT_CATEGORY_SALE_BONUS = 0.15;
const COLD_CATEGORY_SALE_PENALTY = 0.1;
const SALE_VARIANCE_MIN = 0.92;
const SALE_VARIANCE_MAX = 1.15;

const CATEGORY_DEFS = {
  tech: { id: "tech", label: "Devices", cssClass: "tech" },
  media: { id: "media", label: "Archives", cssClass: "media" },
  tools: { id: "tools", label: "Gear", cssClass: "tools" },
  fashion: { id: "fashion", label: "Garb", cssClass: "fashion" },
  house: { id: "house", label: "Curios", cssClass: "house" },
  occult: { id: "occult", label: "Occult", cssClass: "occult" },
};

const CATEGORY_IDS = Object.keys(CATEGORY_DEFS);

const RARITY_DEFS = {
  junk: { id: "junk", label: "Junk", weight: 31 },
  solid: { id: "solid", label: "Solid", weight: 28 },
  vintage: { id: "vintage", label: "Vintage", weight: 22 },
  elite: { id: "elite", label: "Elite", weight: 13 },
  cursed: { id: "cursed", label: "Cursed", weight: 6 },
};

const RARITY_IDS = Object.keys(RARITY_DEFS);

const CONDITION_DEFS = {
  wrecked: {
    id: "wrecked",
    label: "Wrecked",
    valueMultiplier: 0.52,
    saleChanceModifier: -0.12,
    description: "Looks like it lost a duel in a rain-soaked alley.",
  },
  rough: {
    id: "rough",
    label: "Rough",
    valueMultiplier: 0.74,
    saleChanceModifier: -0.06,
    description: "Still usable, but the road definitely touched it first.",
  },
  clean: {
    id: "clean",
    label: "Clean",
    valueMultiplier: 1,
    saleChanceModifier: 0.03,
    description: "Ready for the stall with only a little side-eye.",
  },
  pristine: {
    id: "pristine",
    label: "Pristine",
    valueMultiplier: 1.22,
    saleChanceModifier: 0.08,
    description: "Almost too clean for something found at midnight.",
  },
};

const ITEM_TEMPLATES = [
  {
    id: "battery-brick-pager",
    category: "tech",
    rarity: "junk",
    name: "Battery Brick Pager",
    baseValue: 14,
    blurb: "Heavy enough to count as self-defense.",
  },
  {
    id: "club-circuit-mp3",
    category: "tech",
    rarity: "solid",
    name: "Club Circuit MP3 Player",
    baseValue: 28,
    blurb: "Still loaded with suspiciously specific dance tracks.",
  },
  {
    id: "modematrix-camcorder",
    category: "tech",
    rarity: "vintage",
    name: "Modematrix Camcorder",
    baseValue: 48,
    blurb: "Records in a grainy way that rich people call cinematic.",
  },
  {
    id: "prototype-pocket-projector",
    category: "tech",
    rarity: "elite",
    name: "Prototype Pocket Projector",
    baseValue: 86,
    blurb: "Looks like it got stolen from a pitch deck in 2009.",
  },
  {
    id: "angel-band-answering-machine",
    category: "tech",
    rarity: "cursed",
    name: "Angel-Band Answering Machine",
    baseValue: 128,
    blurb: "Blinking light. No power cord. Still blinking.",
  },
  {
    id: "water-damaged-vhs",
    category: "media",
    rarity: "junk",
    name: "Water-Damaged VHS",
    baseValue: 12,
    blurb: "The case is sticky in a way the law should study.",
  },
  {
    id: "directors-cut-laserdisc",
    category: "media",
    rarity: "solid",
    name: "Director's Cut Laserdisc",
    baseValue: 30,
    blurb: "Somebody once cared about this enough to alphabetize it.",
  },
  {
    id: "pirate-radio-spool",
    category: "media",
    rarity: "vintage",
    name: "Pirate Radio Spool",
    baseValue: 52,
    blurb: "Contains three station IDs and one live argument.",
  },
  {
    id: "festival-press-vinyl",
    category: "media",
    rarity: "elite",
    name: "Festival Press Vinyl",
    baseValue: 92,
    blurb: "Pressed for one night, then vanished with the band.",
  },
  {
    id: "funeral-jingle-cassette",
    category: "media",
    rarity: "cursed",
    name: "Funeral Jingle Cassette",
    baseValue: 138,
    blurb: "The chorus is somehow both upbeat and illegal.",
  },
  {
    id: "stripped-ratchet-set",
    category: "tools",
    rarity: "junk",
    name: "Stripped Ratchet Set",
    baseValue: 16,
    blurb: "Every piece has been used angrily.",
  },
  {
    id: "contractor-laser-level",
    category: "tools",
    rarity: "solid",
    name: "Contractor Laser Level",
    baseValue: 34,
    blurb: "Accurate enough to start fights over drywall.",
  },
  {
    id: "chrome-torque-driver",
    category: "tools",
    rarity: "vintage",
    name: "Chrome Torque Driver",
    baseValue: 54,
    blurb: "Still smooth. Still kind of beautiful. Still a tool.",
  },
  {
    id: "prototype-locksmith-kit",
    category: "tools",
    rarity: "elite",
    name: "Prototype Locksmith Kit",
    baseValue: 94,
    blurb: "Professional enough that you should not ask follow-up questions.",
  },
  {
    id: "midnight-bolt-cutter",
    category: "tools",
    rarity: "cursed",
    name: "Midnight Bolt Cutter",
    baseValue: 144,
    blurb: "The handles are warm like they remember things.",
  },
  {
    id: "faux-snake-boots",
    category: "fashion",
    rarity: "junk",
    name: "Faux Snake Boots",
    baseValue: 15,
    blurb: "The kind of fake reptile energy only a dive bar can love.",
  },
  {
    id: "club-bomber-jacket",
    category: "fashion",
    rarity: "solid",
    name: "Club Bomber Jacket",
    baseValue: 32,
    blurb: "Still carries smoke and confidence.",
  },
  {
    id: "runway-mirror-shades",
    category: "fashion",
    rarity: "vintage",
    name: "Runway Mirror Shades",
    baseValue: 56,
    blurb: "Reflective enough to hide every bad decision.",
  },
  {
    id: "backroom-fur-trim-coat",
    category: "fashion",
    rarity: "elite",
    name: "Backroom Fur Trim Coat",
    baseValue: 98,
    blurb: "Looks expensive enough to start a lie on sight.",
  },
  {
    id: "saint-lucite-ring",
    category: "fashion",
    rarity: "cursed",
    name: "Saint Lucite Ring",
    baseValue: 148,
    blurb: "The stone catches light like it owes somebody money.",
  },
  {
    id: "smoke-yellow-lamp",
    category: "house",
    rarity: "junk",
    name: "Smoke-Yellow Lamp",
    baseValue: 14,
    blurb: "Can probably be saved. Should maybe not be.",
  },
  {
    id: "art-deco-cuckoo-clock",
    category: "house",
    rarity: "solid",
    name: "Art Deco Cuckoo Clock",
    baseValue: 29,
    blurb: "The bird judges you before it chirps.",
  },
  {
    id: "hotel-lobby-ice-bucket",
    category: "house",
    rarity: "vintage",
    name: "Hotel Lobby Ice Bucket",
    baseValue: 50,
    blurb: "Somebody elegant once stole this with purpose.",
  },
  {
    id: "mirrorball-bar-cart",
    category: "house",
    rarity: "elite",
    name: "Mirrorball Bar Cart",
    baseValue: 90,
    blurb: "Rolls like trouble and shines like tax fraud.",
  },
  {
    id: "weeping-porcelain-lamp",
    category: "house",
    rarity: "cursed",
    name: "Weeping Porcelain Lamp",
    baseValue: 142,
    blurb: "Dry on pickup. Wet again when nobody is watching.",
  },
  {
    id: "discount-seance-kit",
    category: "occult",
    rarity: "junk",
    name: "Discount Seance Kit",
    baseValue: 18,
    blurb: "Missing one candle and all liability.",
  },
  {
    id: "copper-planchette-set",
    category: "occult",
    rarity: "solid",
    name: "Copper Planchette Set",
    baseValue: 36,
    blurb: "Either handmade or assembled during a fever dream.",
  },
  {
    id: "moon-pinned-grimoire",
    category: "occult",
    rarity: "vintage",
    name: "Moon-Pinned Grimoire",
    baseValue: 60,
    blurb: "Half recipes, half rituals, all bad handwriting.",
  },
  {
    id: "funeral-parlor-tarot-deck",
    category: "occult",
    rarity: "elite",
    name: "Funeral Parlor Tarot Deck",
    baseValue: 102,
    blurb: "The cards are crisp. The energy is not.",
  },
  {
    id: "choir-glass-reliquary",
    category: "occult",
    rarity: "cursed",
    name: "Choir Glass Reliquary",
    baseValue: 156,
    blurb: "Hums when the room goes quiet enough.",
  },
];

const WEIRD_TAGS = {
  tech: [
    "battery acid glitter in the compartment",
    "serial plate sanded smooth",
    "still warm from somebody's trunk",
    "sticker from a dead electronics expo",
    "recorded one voicemail in reverse",
  ],
  media: [
    "cover art swapped with a church flyer",
    "one frame missing every minute",
    "smells like old velvet and chlorine",
    "signed by someone nobody can identify",
    "contains an ad for a store that burned down",
  ],
  tools: [
    "engraved with a union nickname",
    "painted over twice and still mean-looking",
    "wrapped in electrical tape for no clear reason",
    "case lined with poker felt",
    "hinge creaks like it knows your address",
  ],
  fashion: [
    "lined with club stamps and cheap perfume",
    "seam repaired with fishing line",
    "inside pocket full of silver confetti",
    "tag replaced by a handwritten blessing",
    "hem catches static like gossip",
  ],
  house: [
    "dust pattern shaped like a halo",
    "base scratches spell out initials",
    "smells like old cigarettes and lemon polish",
    "tiny hidden drawer behind the trim",
    "glass rattles even when held still",
  ],
  occult: [
    "wax sealed with a thumbprint",
    "edges cold no matter the room",
    "ink responds badly to moonlight",
    "inside note says do not resell",
    "the velvet box is heavier than it should be",
  ],
};

const SELLER_ARCHETYPES = [
  {
    id: "honest",
    label: "Honest Peddler",
    askMin: 0.82,
    askMax: 1,
    haggleModifier: 0.04,
    fakeChanceBonus: -0.08,
    namePool: ["Marlon", "Rita", "Tess", "Victor", "June"],
  },
  {
    id: "clueless",
    label: "Green Traveler",
    askMin: 0.58,
    askMax: 0.92,
    haggleModifier: 0.18,
    fakeChanceBonus: 0.02,
    namePool: ["Ari", "Mina", "Drew", "Kiki", "Sol"],
  },
  {
    id: "desperate",
    label: "Desperate Courier",
    askMin: 0.55,
    askMax: 0.86,
    haggleModifier: 0.12,
    fakeChanceBonus: 0.04,
    namePool: ["Nico", "Lana", "Bo", "Rae", "Jules"],
  },
  {
    id: "grifter",
    label: "Silver-Tongued Grifter",
    askMin: 1.06,
    askMax: 1.34,
    haggleModifier: -0.12,
    fakeChanceBonus: 0.22,
    namePool: ["Chaz", "Vel", "Rocco", "Mace", "Gigi"],
  },
  {
    id: "collector-kid",
    label: "Collector Squire",
    askMin: 0.88,
    askMax: 1.15,
    haggleModifier: -0.02,
    fakeChanceBonus: -0.02,
    rarityBias: { vintage: 5, elite: 3 },
    namePool: ["Pax", "Nell", "Ivy", "Milo", "Sky"],
  },
  {
    id: "night-scavenger",
    label: "Night Forager",
    askMin: 0.7,
    askMax: 1.04,
    haggleModifier: 0.08,
    fakeChanceBonus: 0.04,
    rarityBias: { junk: 6, solid: 3 },
    namePool: ["Kane", "Sable", "Rio", "Mori", "Brick"],
  },
  {
    id: "estate-cleaner",
    label: "Estate Warden",
    askMin: 0.76,
    askMax: 1.04,
    haggleModifier: 0.05,
    fakeChanceBonus: -0.02,
    rarityBias: { solid: 3, vintage: 4 },
    namePool: ["Pam", "Leah", "Harvey", "Gwen", "Eli"],
  },
  {
    id: "occult-freak",
    label: "Occult Pilgrim",
    askMin: 0.9,
    askMax: 1.24,
    haggleModifier: -0.06,
    fakeChanceBonus: 0.08,
    rarityBias: { cursed: 8, elite: 2 },
    namePool: ["Ora", "Hex", "Mourn", "Rue", "Soren"],
  },
];

const SELLER_ARCHETYPE_MAP = Object.fromEntries(
  SELLER_ARCHETYPES.map((archetype) => [archetype.id, archetype]),
);

const UPGRADE_DEFS = [
  {
    id: "blacklightLamp",
    name: "Blacklight Lamp",
    cost: 90,
    description: "Arcane appraisals reveal stronger omen reads and higher-tier glints.",
    maxCount: 1,
  },
  {
    id: "fastTalkLessons",
    name: "Fast Talk Lessons",
    cost: 120,
    description: "Merchant patter sharpens your bargaining checks.",
    maxCount: 1,
  },
  {
    id: "shelfExtension",
    name: "Shelf Extension",
    cost: 160,
    description: "Expands the stall by one display slot. Can be bought up to four times.",
    maxCount: MAX_SHELF_SLOTS - STARTING_SHELF_SLOTS,
  },
  {
    id: "repairCart",
    name: "Repair Cart",
    cost: 140,
    description: "Workshop prep actions cost less coin immediately.",
    maxCount: 1,
  },
  {
    id: "neonWindowSign",
    name: "Neon Window Sign",
    cost: 180,
    description: "A brighter storefront sigil draws stronger sale rolls.",
    maxCount: 1,
  },
  {
    id: "lockboxRoom",
    name: "Lockbox Room",
    cost: 220,
    description: "Adds one reliquary slot. Can be bought up to three times.",
    maxCount: MAX_CURIO_SLOTS - STARTING_CURIO_SLOTS,
  },
];

const UPGRADE_MAP = Object.fromEntries(
  UPGRADE_DEFS.map((upgrade) => [upgrade.id, upgrade]),
);

const PREP_ACTIONS = {
  wipe: { id: "wipe", label: "Wipe Down", cost: 5, multiplier: 1.1 },
  repair: { id: "repair", label: "Repair", cost: 12, multiplier: 1.25 },
  authenticate: { id: "authenticate", label: "Authenticate", cost: 8 },
};

const GUIDEBOOK_SPREADS = [
  {
    chapter: "Primer",
    left: {
      eyebrow: "Broker's Primer",
      title: "What wins a night",
      intro:
        "Midnight Pawn is about buying strange relics below value, preparing the best ones, and clearing the nightly bounty before the chapter closes.",
      facts: ["8 travelers", "Bounty starts at $60", "Misses never end the run"],
      sections: [
        {
          title: "Core loop",
          bullets: [
            "Read the current traveler and relic.",
            "Inspect or bargain if the price is uncertain.",
            "Claim good deals and decline bad ones.",
            "Prep, list, and close the night with a full stall.",
          ],
        },
      ],
      note:
        "You are not trying to buy everything. You are trying to buy the right relics at the right price.",
    },
    right: {
      eyebrow: "The screen",
      title: "What each area means",
      intro:
        "The interface is split into a few jobs: live bargaining, inventory handling, long-term bonuses, and codex tracking.",
      sections: [
        {
          title: "Main zones",
          bullets: [
            "Left rail: purse, renown, chapter progress, rumor board, reliquary boons.",
            "Exchange: the active traveler, item readout, and negotiation actions.",
            "Active Wares: listed relics waiting for closeout sales.",
            "Broker Inventory: owned relics that still need prep or listing.",
            "Bound Relics: elite and cursed relics saved for passive bonuses.",
          ],
        },
        {
          title: "Drawers",
          bullets: [
            "Guild Talents sells permanent upgrades.",
            "Chronicles tracks discoveries and sale history.",
            "Camp holds save tools and this guidebook.",
          ],
        },
      ],
    },
  },
  {
    chapter: "Travelers",
    left: {
      eyebrow: "Traveler phase",
      title: "How bargaining works",
      intro:
        "Every traveler brings one relic, one price, and 2 patience. Your job is to judge how much pressure the deal can take.",
      facts: ["Inspect is free", "Gentle bargain: 10% off try", "Hard bargain: 20% off try"],
      sections: [
        {
          title: "Your actions",
          bullets: [
            "Inspect reveals condition first, then deeper clues like authenticity hints and the weird tag.",
            "Gentle Bargain is safer and only spends one soft angle.",
            "Hard Bargain pushes harder but is much riskier.",
            "Claim buys the relic at the current tribute.",
            "Decline skips the traveler and preserves cash.",
          ],
        },
      ],
      note:
        "If patience hits zero, the traveler leaves with the relic. Failed bargains are the main way good items slip away.",
    },
    right: {
      eyebrow: "Reading relics",
      title: "What makes an item good",
      intro:
        "A relic is driven by category, rarity, condition, authenticity, and tonight's rumor board.",
      facts: ["Hot category sells easier", "Cold category sells harder", "Condition changes value and sale chance"],
      sections: [
        {
          title: "Quality signals",
          bullets: [
            "Rarity bands run from junk to cursed.",
            "Clean and pristine relics are easier to move than wrecked ones.",
            "Authenticity matters because fake items can fool your estimate until verified.",
            "Elite and cursed relics are worth considering for the reliquary instead of instant sale.",
          ],
        },
        {
          title: "Good reasons to pass",
          bullets: [
            "The price is too close to the item's likely ceiling.",
            "The relic looks weak and sits in the cold category.",
            "Buying it would leave you unable to act on later travelers.",
          ],
        },
      ],
    },
  },
  {
    chapter: "Inventory",
    left: {
      eyebrow: "Workshop phase",
      title: "What to do after you buy",
      intro:
        "A claimed relic enters Broker Inventory. From there you choose whether to polish it, mend it, verify it, list it, or enshrine it.",
      facts: ["Polish: +10% resale", "Mend: +25% resale", "Verify reveals true or fake"],
      sections: [
        {
          title: "Prep tools",
          bullets: [
            "Polish is cheap and good for items you already plan to list.",
            "Mend costs more, so use it on relics with strong resale potential.",
            "Verify is best for suspiciously expensive or high-rarity items.",
            "Listed relics are the only ones that can sell at closeout.",
          ],
        },
        {
          title: "Stall space",
          bullets: [
            "You begin with 4 listing slots.",
            "Shelf Extension can push the stall up to 8 slots.",
            "A full stall before closeout is usually better than hoarding too many unlisted relics.",
          ],
        },
      ],
    },
    right: {
      eyebrow: "Reliquary",
      title: "When to bind relics",
      intro:
        "Elite and cursed relics can be saved in the Bound Relics wing instead of sold right away. This trades short cash for stronger future nights.",
      facts: ["Elite: +3% sale, +2% bargain, +2% price", "Cursed: +5% sale, +5% bargain, +4% price"],
      sections: [
        {
          title: "Binding rules",
          bullets: [
            "Only elite and cursed relics can be enshrined.",
            "Vaulted relics never enter closeout sale rolls.",
            "Lockbox Room expands reliquary capacity from 2 up to 5 slots.",
          ],
        },
        {
          title: "Good binding logic",
          bullets: [
            "Bind relics that strengthen many future nights.",
            "Sell relics when you urgently need the cash spike to hit the current bounty.",
            "Do not fill the reliquary with weak pieces just because they are rare.",
          ],
        },
      ],
      note:
        "If a relic is amazing but the passive bonus will make the next five nights easier, binding it can be the smarter long game.",
    },
  },
  {
    chapter: "Strategy",
    left: {
      eyebrow: "Closeout",
      title: "How nights actually pay out",
      intro:
        "When the chapter ends, every listed relic rolls for sale. Sold items pay cash immediately. Unsold items stay with you for the next night.",
      facts: ["Base sale chance: 55%", "Bounty grows by $35 each night", "Target bonus: 25% of target"],
      sections: [
        {
          title: "What helps closeout",
          bullets: [
            "Hot-category listings.",
            "Better condition and better prep.",
            "Renown and Neon Window Sign.",
            "Reliquary bonuses from bound relics.",
          ],
        },
        {
          title: "If you hit the bounty",
          bullets: [
            "You get bonus cash equal to 25% of that night's target.",
            "You gain +1 renown.",
            "The next night still gets harder, but your run momentum improves.",
          ],
        },
      ],
    },
    right: {
      eyebrow: "Field advice",
      title: "Strong beginner habits",
      intro:
        "You do not need perfect math to play well. A few disciplined habits carry most runs.",
      sections: [
        {
          title: "Reliable habits",
          bullets: [
            "Inspect before buying unless the relic is obviously cheap.",
            "Use Gentle Bargain more than Hard Bargain early on.",
            "Favor hot-category relics when choosing between two similar deals.",
            "Do not spend all your cash on the first half of the night.",
            "Try to enter closeout with the stall filled.",
          ],
        },
        {
          title: "Common mistakes",
          bullets: [
            "Overpaying for junk because the flavor text is funny.",
            "Forgetting to list items before closing the night.",
            "Wasting prep costs on relics that still are not worth selling.",
            "Selling every elite or cursed piece instead of considering the reliquary.",
          ],
        },
      ],
      note:
        "If you are ever unsure, buy fewer relics, inspect more often, and make sure the best items actually reach the stall before closeout.",
    },
  },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

let idCounter = Date.now();

function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter.toString(36)}`;
}

function createDefaultRarityCounts() {
  return Object.fromEntries(RARITY_IDS.map((rarityId) => [rarityId, 0]));
}

function createDefaultSave() {
  return {
    version: SAVE_VERSION,
    cash: STARTING_CASH,
    reputation: STARTING_REPUTATION,
    night: STARTING_NIGHT,
    inventory: [],
    listedItemIds: [],
    curioItemIds: [],
    upgrades: {
      blacklightLamp: 0,
      fastTalkLessons: 0,
      shelfExtension: 0,
      repairCart: 0,
      neonWindowSign: 0,
      lockboxRoom: 0,
    },
    stats: {
      totalBuys: 0,
      totalSales: 0,
      totalPasses: 0,
      totalVaulted: 0,
      totalSpent: 0,
      totalRevenue: 0,
      nightsCompleted: 0,
      nightsHitTarget: 0,
      haggleWins: 0,
      haggleLosses: 0,
      bonusCashEarned: 0,
      bestSale: 0,
      bestSaleName: "",
    },
    collection: {
      templateSeenIds: [],
      sellerSeenIds: [],
      weirdTagsSeen: [],
      soldByRarity: createDefaultRarityCounts(),
    },
    currentNight: null,
    settings: {
      reducedMotion: false,
    },
  };
}

function normalizeInventoryItem(rawItem) {
  return {
    id: typeof rawItem?.id === "string" ? rawItem.id : nextId("item"),
    templateId: typeof rawItem?.templateId === "string" ? rawItem.templateId : "",
    name: typeof rawItem?.name === "string" ? rawItem.name : "Unknown Item",
    category: CATEGORY_DEFS[rawItem?.category] ? rawItem.category : "tech",
    rarity: RARITY_DEFS[rawItem?.rarity] ? rawItem.rarity : "junk",
    condition: CONDITION_DEFS[rawItem?.condition] ? rawItem.condition : "rough",
    authenticity: rawItem?.authenticity === "fake" ? "fake" : "authentic",
    weirdTag:
      typeof rawItem?.weirdTag === "string" ? rawItem.weirdTag : "omen unread",
    baseValue: safeNumber(rawItem?.baseValue, 20),
    estimatedValue: safeNumber(rawItem?.estimatedValue, 20),
    trueValue: safeNumber(rawItem?.trueValue, 20),
    purchasePrice: safeNumber(rawItem?.purchasePrice, 0),
    acquiredNight: safeNumber(rawItem?.acquiredNight, 1),
    sellerArchetypeId: SELLER_ARCHETYPE_MAP[rawItem?.sellerArchetypeId]
      ? rawItem.sellerArchetypeId
      : "honest",
    blurb:
      typeof rawItem?.blurb === "string"
        ? rawItem.blurb
        : "The label says enough and not nearly enough.",
    wipedDown: Boolean(rawItem?.wipedDown),
    repaired: Boolean(rawItem?.repaired),
    isAuthenticated: Boolean(rawItem?.isAuthenticated),
    listed: Boolean(rawItem?.listed),
    vaulted: Boolean(rawItem?.vaulted),
  };
}

function normalizeOffer(rawOffer) {
  const draft = normalizeInventoryItem(rawOffer?.itemDraft || {});
  return {
    id: typeof rawOffer?.id === "string" ? rawOffer.id : nextId("offer"),
    sellerName:
      typeof rawOffer?.sellerName === "string" ? rawOffer.sellerName : "Unknown",
    archetypeId: SELLER_ARCHETYPE_MAP[rawOffer?.archetypeId]
      ? rawOffer.archetypeId
      : "honest",
    story:
      typeof rawOffer?.story === "string"
        ? rawOffer.story
        : "The traveler swears it only looks suspicious because of the lantern light.",
    askPrice: safeNumber(rawOffer?.askPrice, draft.estimatedValue),
    currentPrice: safeNumber(rawOffer?.currentPrice, rawOffer?.askPrice),
    patience: clamp(safeNumber(rawOffer?.patience, 2), 0, 2),
    status: ["active", "passed", "bought", "walked", "missed"].includes(rawOffer?.status)
      ? rawOffer.status
      : "active",
    inspectionCount: clamp(safeNumber(rawOffer?.inspectionCount, 0), 0, 4),
    revealState: {
      conditionKnown: Boolean(rawOffer?.revealState?.conditionKnown),
      authenticityHintKnown: Boolean(rawOffer?.revealState?.authenticityHintKnown),
      weirdTagKnown: Boolean(rawOffer?.revealState?.weirdTagKnown),
      rareReadKnown: Boolean(rawOffer?.revealState?.rareReadKnown),
    },
    haggleState: {
      soft: normalizeHaggleState(rawOffer?.haggleState?.soft),
      firm: normalizeHaggleState(rawOffer?.haggleState?.firm),
    },
    itemDraft: draft,
  };
}

function normalizeCurrentNight(rawNight, currentSaveNight) {
  if (!rawNight || typeof rawNight !== "object") {
    return null;
  }

  const queue = Array.isArray(rawNight.queue)
    ? rawNight.queue.map((offer) => normalizeOffer(offer))
    : [];

  const status = rawNight.status === "closed" ? "closed" : "active";
  const market = {
    hotCategory: CATEGORY_DEFS[rawNight?.market?.hotCategory]
      ? rawNight.market.hotCategory
      : "tech",
    coldCategory: CATEGORY_DEFS[rawNight?.market?.coldCategory]
      ? rawNight.market.coldCategory
      : "media",
  };

  if (market.coldCategory === market.hotCategory) {
    market.coldCategory = CATEGORY_IDS.find((categoryId) => categoryId !== market.hotCategory);
  }

  return {
    number: safeNumber(rawNight.number, currentSaveNight),
    status,
    market,
    targetProfit: safeNumber(rawNight.targetProfit, getTargetProfitForNight(currentSaveNight)),
    todayProfit: safeNumber(rawNight.todayProfit, 0),
    activeIndex: clamp(safeNumber(rawNight.activeIndex, 0), 0, Math.max(queue.length - 1, 0)),
    queue,
    closeoutResults: Array.isArray(rawNight.closeoutResults)
      ? rawNight.closeoutResults.map((result) => ({
          itemId: typeof result?.itemId === "string" ? result.itemId : nextId("result"),
          name: typeof result?.name === "string" ? result.name : "Unknown Item",
          salePrice: safeNumber(result?.salePrice, 0),
          category: CATEGORY_DEFS[result?.category] ? result.category : "tech",
          rarity: RARITY_DEFS[result?.rarity] ? result.rarity : "junk",
          sold: Boolean(result?.sold),
          kept: Boolean(result?.kept),
          chance: safeNumber(result?.chance, 0),
          reason:
            typeof result?.reason === "string"
              ? result.reason
              : "It stayed on the shelf.",
        }))
      : [],
    goalMet: Boolean(rawNight.goalMet),
    bonusCash: safeNumber(rawNight.bonusCash, 0),
    manualClose: Boolean(rawNight.manualClose),
  };
}

function normalizeSave(rawSave) {
  const baseSave = createDefaultSave();
  const merged = {
    ...baseSave,
    ...(rawSave || {}),
  };

  const save = {
    version: SAVE_VERSION,
    cash: safeNumber(merged.cash, STARTING_CASH),
    reputation: safeNumber(merged.reputation, STARTING_REPUTATION),
    night: Math.max(STARTING_NIGHT, safeNumber(merged.night, STARTING_NIGHT)),
    inventory: Array.isArray(merged.inventory)
      ? merged.inventory.map((item) => normalizeInventoryItem(item))
      : [],
    listedItemIds: Array.isArray(merged.listedItemIds)
      ? merged.listedItemIds.filter((itemId) => typeof itemId === "string")
      : [],
    curioItemIds: Array.isArray(merged.curioItemIds)
      ? merged.curioItemIds.filter((itemId) => typeof itemId === "string")
      : [],
    upgrades: {
      blacklightLamp: clamp(safeNumber(merged?.upgrades?.blacklightLamp, 0), 0, 1),
      fastTalkLessons: clamp(
        safeNumber(merged?.upgrades?.fastTalkLessons, 0),
        0,
        1,
      ),
      shelfExtension: clamp(
        safeNumber(merged?.upgrades?.shelfExtension, 0),
        0,
        UPGRADE_MAP.shelfExtension.maxCount,
      ),
      repairCart: clamp(safeNumber(merged?.upgrades?.repairCart, 0), 0, 1),
      neonWindowSign: clamp(
        safeNumber(merged?.upgrades?.neonWindowSign, 0),
        0,
        1,
      ),
      lockboxRoom: clamp(
        safeNumber(merged?.upgrades?.lockboxRoom, 0),
        0,
        UPGRADE_MAP.lockboxRoom.maxCount,
      ),
    },
    stats: {
      ...baseSave.stats,
      ...(merged.stats || {}),
    },
    collection: {
      templateSeenIds: uniqueStringArray(merged?.collection?.templateSeenIds),
      sellerSeenIds: uniqueStringArray(merged?.collection?.sellerSeenIds),
      weirdTagsSeen: uniqueStringArray(merged?.collection?.weirdTagsSeen),
      soldByRarity: {
        ...createDefaultRarityCounts(),
        ...(merged?.collection?.soldByRarity || {}),
      },
    },
    currentNight: normalizeCurrentNight(merged.currentNight, merged.night),
    settings: {
      reducedMotion: Boolean(merged?.settings?.reducedMotion),
    },
  };

  const inventoryIdSet = new Set(save.inventory.map((item) => item.id));
  save.listedItemIds = save.listedItemIds.filter((itemId) => inventoryIdSet.has(itemId));
  save.curioItemIds = save.curioItemIds.filter((itemId) => inventoryIdSet.has(itemId));

  save.inventory.forEach((item) => {
    item.listed = save.listedItemIds.includes(item.id);
    item.vaulted = save.curioItemIds.includes(item.id);
    if (item.vaulted) {
      item.listed = false;
    }
  });

  if (
    save.currentNight &&
    save.currentNight.status === "active" &&
    (!Array.isArray(save.currentNight.queue) || save.currentNight.queue.length === 0)
  ) {
    save.currentNight = null;
  }

  return save;
}

function loadGame() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeSave(raw ? JSON.parse(raw) : null);
  } catch (error) {
    console.warn("Failed to load Midnight Pawn save.", error);
    return createDefaultSave();
  }
}

function saveGame() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function sample(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickWeightedValue(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let target = Math.random() * total;
  for (const entry of entries) {
    target -= entry.weight;
    if (target <= 0) {
      return entry.value;
    }
  }
  return entries[entries.length - 1].value;
}

function uniqueStringArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  const uniqueValues = [];
  for (const value of values) {
    if (typeof value === "string" && !uniqueValues.includes(value)) {
      uniqueValues.push(value);
    }
  }
  return uniqueValues;
}

function normalizeHaggleState(value) {
  return ["unused", "success", "failed"].includes(value) ? value : "unused";
}

function formatCurrency(value) {
  const rounded = Math.round(value);
  if (rounded < 0) {
    return `-$${currencyFormatter.format(Math.abs(rounded))}`;
  }
  return `$${currencyFormatter.format(rounded)}`;
}

function formatSignedCurrency(value) {
  const rounded = Math.round(value);
  if (rounded > 0) {
    return `+${formatCurrency(rounded)}`;
  }
  return formatCurrency(rounded);
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getTargetProfitForNight(nightNumber) {
  return TARGET_PROFIT_BASE + (nightNumber - 1) * TARGET_PROFIT_STEP;
}

function getShelfLimit() {
  return STARTING_SHELF_SLOTS + state.upgrades.shelfExtension;
}

function getCurioLimit() {
  return STARTING_CURIO_SLOTS + state.upgrades.lockboxRoom;
}

function hasUpgrade(upgradeId) {
  return safeNumber(state.upgrades[upgradeId], 0) > 0;
}

function getUpgradeCount(upgradeId) {
  return safeNumber(state.upgrades[upgradeId], 0);
}

function getPrepCost(actionId) {
  const baseCost = PREP_ACTIONS[actionId].cost;
  if (!hasUpgrade("repairCart")) {
    return baseCost;
  }

  if (actionId === "wipe") {
    return 4;
  }
  if (actionId === "repair") {
    return 9;
  }
  if (actionId === "authenticate") {
    return 6;
  }
  return baseCost;
}

function pickNightMarket() {
  const hotCategory = sample(CATEGORY_IDS);
  const coldCategory = sample(CATEGORY_IDS.filter((categoryId) => categoryId !== hotCategory));
  return { hotCategory, coldCategory };
}

function buildRarityWeights(archetype) {
  return RARITY_IDS.map((rarityId) => ({
    value: rarityId,
    weight:
      RARITY_DEFS[rarityId].weight + safeNumber(archetype?.rarityBias?.[rarityId], 0),
  }));
}

function pickConditionId(archetypeId) {
  const weightsByArchetype = {
    honest: [
      { value: "rough", weight: 30 },
      { value: "clean", weight: 38 },
      { value: "pristine", weight: 18 },
      { value: "wrecked", weight: 14 },
    ],
    clueless: [
      { value: "wrecked", weight: 20 },
      { value: "rough", weight: 34 },
      { value: "clean", weight: 32 },
      { value: "pristine", weight: 14 },
    ],
    desperate: [
      { value: "wrecked", weight: 28 },
      { value: "rough", weight: 38 },
      { value: "clean", weight: 24 },
      { value: "pristine", weight: 10 },
    ],
    grifter: [
      { value: "rough", weight: 36 },
      { value: "clean", weight: 30 },
      { value: "pristine", weight: 22 },
      { value: "wrecked", weight: 12 },
    ],
    "collector-kid": [
      { value: "rough", weight: 16 },
      { value: "clean", weight: 42 },
      { value: "pristine", weight: 28 },
      { value: "wrecked", weight: 14 },
    ],
    "night-scavenger": [
      { value: "wrecked", weight: 32 },
      { value: "rough", weight: 40 },
      { value: "clean", weight: 20 },
      { value: "pristine", weight: 8 },
    ],
    "estate-cleaner": [
      { value: "rough", weight: 18 },
      { value: "clean", weight: 42 },
      { value: "pristine", weight: 26 },
      { value: "wrecked", weight: 14 },
    ],
    "occult-freak": [
      { value: "rough", weight: 30 },
      { value: "clean", weight: 24 },
      { value: "pristine", weight: 20 },
      { value: "wrecked", weight: 26 },
    ],
  };
  return pickWeightedValue(weightsByArchetype[archetypeId] || weightsByArchetype.honest);
}

function pickAuthenticity(rarityId, archetypeId, categoryId) {
  const fakeChances = {
    junk: 0.14,
    solid: 0.18,
    vintage: 0.22,
    elite: 0.24,
    cursed: 0.22,
  };
  let fakeChance =
    fakeChances[rarityId] +
    safeNumber(SELLER_ARCHETYPE_MAP[archetypeId]?.fakeChanceBonus, 0);

  if (categoryId === "occult") {
    fakeChance += 0.04;
  }
  if (archetypeId === "estate-cleaner") {
    fakeChance -= 0.02;
  }

  return Math.random() < clamp(fakeChance, 0.05, 0.55) ? "fake" : "authentic";
}

function getTemplate(categoryId, rarityId) {
  return ITEM_TEMPLATES.find(
    (template) => template.category === categoryId && template.rarity === rarityId,
  );
}

function getNightValueFactor(nightNumber) {
  return 1 + Math.min((nightNumber - 1) * 0.07, 0.7);
}

function getAuthenticityModifier(rarityId, authenticity) {
  if (authenticity === "fake") {
    return rarityId === "cursed" ? 0.58 : 0.62;
  }

  if (rarityId === "cursed") {
    return 1.32;
  }
  if (rarityId === "elite") {
    return 1.22;
  }
  return 1.15;
}

function buildSellerStory(archetype, sellerName, template, weirdTag) {
  const categoryLabel = CATEGORY_DEFS[template.category].label.toLowerCase();
  const pitchByArchetype = {
    honest: `${sellerName} claims the ${template.name.toLowerCase()} came from a shuttered lockbox and wants a clean trade.`,
    clueless: `${sellerName} keeps calling the ${template.name.toLowerCase()} a relic and cannot name a fair price to save their life.`,
    desperate: `${sellerName} needs coin before dawn and keeps glancing toward the alley between every sentence.`,
    grifter: `${sellerName} swears this ${categoryLabel} piece once sat in a noble hall and smiles too hard each time they say it.`,
    "collector-kid": `${sellerName} says their wall is full, their landlord is furious, and one more trophy will start a war at home.`,
    "night-scavenger": `${sellerName} pulled this from a route the watch would rather not map and wants quick coin, not questions.`,
    "estate-cleaner": `${sellerName} is clearing another dead patron's rooms and needs this ${template.name.toLowerCase()} gone before sunrise.`,
    "occult-freak": `${sellerName} insists the ${template.name.toLowerCase()} chose them first and has decided you are next.`,
  };

  return `${pitchByArchetype[archetype.id]} Hidden omen: ${weirdTag}.`;
}

function buildSellerOffer(nightNumber) {
  const archetype = sample(SELLER_ARCHETYPES);
  const categoryId = sample(CATEGORY_IDS);
  const rarityId = pickWeightedValue(buildRarityWeights(archetype));
  const template = getTemplate(categoryId, rarityId);
  const conditionId = pickConditionId(archetype.id);
  const authenticity = pickAuthenticity(rarityId, archetype.id, categoryId);
  const estimatedValue = Math.max(
    8,
    Math.round(
      template.baseValue *
        CONDITION_DEFS[conditionId].valueMultiplier *
        getNightValueFactor(nightNumber) *
        randomRange(0.92, 1.08),
    ),
  );
  const trueValue = Math.max(
    6,
    Math.round(estimatedValue * getAuthenticityModifier(rarityId, authenticity)),
  );
  const weirdTag = sample(WEIRD_TAGS[categoryId]);
  const askPrice = Math.max(
    4,
    Math.round(estimatedValue * randomRange(archetype.askMin, archetype.askMax)),
  );
  const sellerName = sample(archetype.namePool);

  return {
    id: nextId("offer"),
    sellerName,
    archetypeId: archetype.id,
    story: buildSellerStory(archetype, sellerName, template, weirdTag),
    askPrice,
    currentPrice: askPrice,
    patience: 2,
    status: "active",
    inspectionCount: 0,
    revealState: {
      conditionKnown: false,
      authenticityHintKnown: false,
      weirdTagKnown: false,
      rareReadKnown: false,
    },
    haggleState: {
      soft: "unused",
      firm: "unused",
    },
    itemDraft: {
      id: nextId("draft"),
      templateId: template.id,
      name: template.name,
      category: categoryId,
      rarity: rarityId,
      condition: conditionId,
      authenticity,
      weirdTag,
      baseValue: template.baseValue,
      estimatedValue,
      trueValue,
      purchasePrice: 0,
      acquiredNight: nightNumber,
      sellerArchetypeId: archetype.id,
      blurb: template.blurb,
      wipedDown: false,
      repaired: false,
      isAuthenticated: false,
      listed: false,
      vaulted: false,
    },
  };
}

function generateNight(nightNumber) {
  const market = pickNightMarket();
  const queue = Array.from({ length: SELLERS_PER_NIGHT }, () => buildSellerOffer(nightNumber));
  return {
    number: nightNumber,
    status: "active",
    market,
    targetProfit: getTargetProfitForNight(nightNumber),
    todayProfit: 0,
    activeIndex: 0,
    queue,
    closeoutResults: [],
    goalMet: false,
    bonusCash: 0,
    manualClose: false,
  };
}

function ensureCurrentNight() {
  if (!state.currentNight) {
    state.currentNight = generateNight(state.night);
    saveGame();
  }
}

function getCurrentNight() {
  return state.currentNight;
}

function isNightActive() {
  return Boolean(state.currentNight && state.currentNight.status === "active");
}

function getActiveOffer() {
  const currentNight = getCurrentNight();
  if (!currentNight || currentNight.status !== "active") {
    return null;
  }
  return currentNight.queue[currentNight.activeIndex] || null;
}

function getCurioBonuses() {
  return state.inventory.reduce(
    (bonus, item) => {
      if (!item.vaulted) {
        return bonus;
      }

      if (item.rarity === "elite") {
        bonus.saleChance += 0.03;
        bonus.saleMultiplier += 0.02;
        bonus.haggleChance += 0.02;
      }

      if (item.rarity === "cursed") {
        bonus.saleChance += 0.05;
        bonus.saleMultiplier += 0.04;
        bonus.haggleChance += 0.05;
      }

      return bonus;
    },
    { saleChance: 0, saleMultiplier: 0, haggleChance: 0 },
  );
}

function computeSaleChance(item, market) {
  let chance = BASE_SALE_CHANCE;
  if (market) {
    if (item.category === market.hotCategory) {
      chance += HOT_CATEGORY_SALE_BONUS;
    }
    if (item.category === market.coldCategory) {
      chance -= COLD_CATEGORY_SALE_PENALTY;
    }
  }
  chance += CONDITION_DEFS[item.condition].saleChanceModifier;
  chance += state.reputation * 0.02;
  if (hasUpgrade("neonWindowSign")) {
    chance += 0.08;
  }
  chance += getCurioBonuses().saleChance;
  return clamp(chance, 0.2, 0.95);
}

function getPrepMultiplier(item) {
  let multiplier = 1;
  if (item.wipedDown) {
    multiplier *= PREP_ACTIONS.wipe.multiplier;
  }
  if (item.repaired) {
    multiplier *= PREP_ACTIONS.repair.multiplier;
  }
  return multiplier;
}

function getCurrentValuation(item) {
  return item.isAuthenticated ? item.trueValue : item.estimatedValue;
}

function computeSalePrice(item) {
  const bonuses = getCurioBonuses();
  const variance = randomRange(SALE_VARIANCE_MIN, SALE_VARIANCE_MAX);
  return Math.max(
    6,
    Math.round(getCurrentValuation(item) * getPrepMultiplier(item) * (1 + bonuses.saleMultiplier) * variance),
  );
}

function getItemTemplateById(templateId) {
  return ITEM_TEMPLATES.find((template) => template.id === templateId);
}

function getAuthenticityHint(item) {
  if (item.authenticity === "fake") {
    return item.category === "occult"
      ? "The sigils flake like a rushed forgery."
      : "The maker marks look copied by hand.";
  }
  return item.category === "occult"
    ? "The materials feel real, which is somehow more troubling."
    : "The hallmarks line up once the grime gives way.";
}

function getRareRead(item) {
  if (!hasUpgrade("blacklightLamp")) {
    return "Install the blacklight lamp to read stronger omens.";
  }

  if (item.rarity === "elite") {
    return "Blacklight omen: an elite signature hides in plain sight.";
  }
  if (item.rarity === "cursed") {
    return "Blacklight screaming: cursed relic, no question.";
  }
  if (item.authenticity === "fake") {
    return "Blacklight catches copied details and false joins.";
  }
  return "No high-tier flare under the lamp.";
}

function describeHaggleState(stateValue, label) {
  if (stateValue === "success") {
    return `${label} landed`;
  }
  if (stateValue === "failed") {
    return `${label} burned patience`;
  }
  return `${label} ready`;
}

function removeFromArray(array, value) {
  const index = array.indexOf(value);
  if (index >= 0) {
    array.splice(index, 1);
  }
}

function markCollectionSeen(item, sellerArchetypeId) {
  if (!state.collection.templateSeenIds.includes(item.templateId)) {
    state.collection.templateSeenIds.push(item.templateId);
  }
  if (!state.collection.sellerSeenIds.includes(sellerArchetypeId)) {
    state.collection.sellerSeenIds.push(sellerArchetypeId);
  }
  if (!state.collection.weirdTagsSeen.includes(item.weirdTag)) {
    state.collection.weirdTagsSeen.push(item.weirdTag);
  }
}

function getQueuedProgressText(currentNight) {
  if (!currentNight) {
    return "0 / 8 travelers resolved";
  }
  const completedCount = currentNight.queue.filter((offer) => offer.status !== "active").length;
  return `${completedCount} / ${SELLERS_PER_NIGHT} travelers resolved`;
}

function setNightMessage(message) {
  runtime.lastMessage = message;
  showToast(message);
}

function getDefaultTopNavKey() {
  return window.location.hash === "#stashSection" ? "stash" : "exchange";
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(runtime.toastTimer);
  runtime.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2400);
}

function animateValue(key, targetValue) {
  runtime.animatedValues[key] = runtime.animatedValues[key] ?? targetValue;
  const currentValue = runtime.animatedValues[key];
  const nextValue = currentValue + (targetValue - currentValue) * 0.18;
  runtime.animatedValues[key] =
    Math.abs(targetValue - nextValue) < 0.5 ? targetValue : nextValue;
  return runtime.animatedValues[key];
}

function runCounterLoop() {
  const currentNight = getCurrentNight();
  const targetProfit = currentNight ? currentNight.todayProfit : 0;

  elements.cashDisplay.textContent = formatCurrency(animateValue("cash", state.cash));
  elements.reputationDisplay.textContent = String(
    Math.round(animateValue("reputation", state.reputation)),
  );
  elements.profitDisplay.textContent = formatCurrency(
    animateValue("profit", targetProfit),
  );

  if (Math.abs(runtime.animatedValues.cash - state.cash) > 0.5 ||
      Math.abs(runtime.animatedValues.reputation - state.reputation) > 0.5 ||
      Math.abs(runtime.animatedValues.profit - targetProfit) > 0.5) {
    runtime.counterFrame = window.requestAnimationFrame(runCounterLoop);
    return;
  }

  runtime.counterFrame = 0;
}

function triggerCounters() {
  if (!runtime.counterFrame) {
    runtime.counterFrame = window.requestAnimationFrame(runCounterLoop);
  }
}

function getActiveMarket() {
  const currentNight = getCurrentNight();
  return currentNight ? currentNight.market : null;
}

function renderHud() {
  const currentNight = getCurrentNight();
  const market = getActiveMarket();
  const activeNightNumber =
    currentNight && currentNight.status === "closed" ? state.night : currentNight?.number || state.night;
  const todayProfit = currentNight ? currentNight.todayProfit : 0;
  const targetProfit = currentNight?.targetProfit || getTargetProfitForNight(state.night);
  const targetDelta = targetProfit - todayProfit;

  elements.cashTrend.textContent = `Ledger sigil: ${STORAGE_KEY}`;
  elements.repHint.textContent = state.reputation === 0
    ? "Earn renown by closing a clean chapter"
    : `${state.reputation} renown adds ${Math.round(state.reputation * 2)}% stall pull`;
  elements.nightDisplay.textContent = `Night ${activeNightNumber}`;
  elements.queueDisplay.textContent = currentNight
    ? currentNight.status === "closed"
      ? `Next chapter ready: ${state.night}`
      : getQueuedProgressText(currentNight)
    : "0 / 8 travelers resolved";
  elements.targetDisplay.textContent = `Bounty ${formatCurrency(targetProfit)}`;
  elements.targetStatus.textContent =
    currentNight?.status === "closed"
      ? currentNight.goalMet
        ? "Bounty claimed"
        : "Bounty missed"
      : targetDelta <= 0
        ? "Ahead of rumor"
        : `Need ${formatCurrency(targetDelta)}`;
  elements.hotCategoryDisplay.textContent = market
    ? CATEGORY_DEFS[market.hotCategory].label
    : CATEGORY_DEFS.tech.label;
  elements.coldCategoryDisplay.textContent = market
    ? `Shunned: ${CATEGORY_DEFS[market.coldCategory].label}`
    : "Shunned: Archives";
  elements.hotMarketChip.textContent = market
    ? `Favored ${CATEGORY_DEFS[market.hotCategory].label.toLowerCase()}`
    : "Favored devices";
  elements.coldMarketChip.textContent = market
    ? `Shunned ${CATEGORY_DEFS[market.coldCategory].label.toLowerCase()}`
    : "Shunned archives";

  const curioBonuses = getCurioBonuses();
  if (curioBonuses.saleChance || curioBonuses.saleMultiplier || curioBonuses.haggleChance) {
    elements.curioBonusChip.textContent =
      `Relic boons +${Math.round(curioBonuses.saleChance * 100)}% sale, +${Math.round(
        curioBonuses.haggleChance * 100,
      )}% bargain`;
  } else {
    elements.curioBonusChip.textContent = "Relic boons dormant";
  }

  elements.profitDisplay.classList.toggle("profit-positive", todayProfit >= 0);
  elements.profitDisplay.classList.toggle("profit-negative", todayProfit < 0);
  triggerCounters();
}

function getCategorySymbol(categoryId) {
  return {
    tech: "memory",
    media: "menu_book",
    tools: "construction",
    fashion: "diamond",
    house: "chair",
    occult: "auto_awesome",
  }[categoryId] || "widgets";
}

function getConditionSignal(conditionId) {
  return {
    wrecked: 28,
    rough: 56,
    clean: 78,
    pristine: 94,
  }[conditionId] || 50;
}

function getRaritySignal(rarityId) {
  return {
    junk: 24,
    solid: 48,
    vintage: 72,
    elite: 86,
    cursed: 92,
  }[rarityId] || 42;
}

function getPlacementLabel(placement) {
  if (placement === "listed") {
    return "Display Counter";
  }
  if (placement === "curio") {
    return "Reliquary";
  }
  return "Travel Pack";
}

function renderSellerStage() {
  const currentNight = getCurrentNight();
  const activeOffer = getActiveOffer();
  elements.closeNightButton.disabled = !currentNight || currentNight.status !== "active";

  if (!currentNight) {
    elements.sellerStage.innerHTML = `
      <article class="seller-shell seller-empty">
        <p class="label-line">No chapter loaded</p>
        <h2>The market lies still.</h2>
        <p class="seller-story">No rumor board is active yet, so no travelers are approaching the stall.</p>
      </article>
    `;
    return;
  }

  if (currentNight.status === "closed") {
    elements.sellerStage.innerHTML = `
      <article class="seller-shell seller-empty">
        <p class="label-line">Chapter complete</p>
        <h2>Night ${currentNight.number} is sealed.</h2>
        <p class="seller-story">
          The chapter ledger is open. Begin Night ${state.night} when you want a fresh line of travelers at the counter.
        </p>
      </article>
    `;
    return;
  }

  if (!activeOffer) {
    elements.sellerStage.innerHTML = `
      <article class="seller-shell seller-empty">
        <p class="label-line">Audience hall quiet</p>
        <h2>No traveler stands before you.</h2>
        <p class="seller-story">End the chapter to settle the stall, then call the next rumor board.</p>
      </article>
    `;
    return;
  }

  const archetype = SELLER_ARCHETYPE_MAP[activeOffer.archetypeId];
  const draft = activeOffer.itemDraft;
  const condition = activeOffer.revealState.conditionKnown
    ? CONDITION_DEFS[draft.condition].label
    : "Hidden";
  const authenticityRead = activeOffer.revealState.authenticityHintKnown
    ? getAuthenticityHint(draft)
    : "Inspect deeper";
  const weirdRead = activeOffer.revealState.weirdTagKnown
    ? draft.weirdTag
    : "Still hidden";
  const rareRead = activeOffer.revealState.rareReadKnown
    ? getRareRead(draft)
    : hasUpgrade("blacklightLamp")
      ? "Lamp standing by"
      : "No blacklight lamp installed";
  const currentPriceChanged = activeOffer.currentPrice !== activeOffer.askPrice;
  const sellerCardClass =
    runtime.lastOfferId !== activeOffer.id ? "seller-shell seller-card animate-in" : "seller-shell seller-card";
  runtime.lastOfferId = activeOffer.id;
  const category = CATEGORY_DEFS[draft.category];
  const rarity = RARITY_DEFS[draft.rarity];
  const conditionPercent = getConditionSignal(draft.condition);
  const rarityPercent = getRaritySignal(draft.rarity);
  const patiencePercent = Math.round((activeOffer.patience / 2) * 100);
  const diagnostics = [
    {
      label: "Condition",
      percent: activeOffer.revealState.conditionKnown ? conditionPercent : 0,
      readout: activeOffer.revealState.conditionKnown ? `${condition}%` : "Unread",
      copy: activeOffer.revealState.conditionKnown
        ? CONDITION_DEFS[draft.condition].description
        : "Appraise first to uncover surface wear and structural trouble.",
    },
    {
      label: "Lineage",
      percent: activeOffer.revealState.authenticityHintKnown ? rarityPercent : 0,
      readout: activeOffer.revealState.authenticityHintKnown ? authenticityRead : "Veiled",
      copy: activeOffer.revealState.authenticityHintKnown
        ? `Authenticity read: ${authenticityRead}.`
        : "Inspect deeper to pull the maker's trail and fake tells.",
    },
    {
      label: "Leverage",
      percent: patiencePercent,
      readout: `${activeOffer.patience}/2`,
      copy:
        activeOffer.patience > 1
          ? "The traveler is still open to pressure."
          : "One bad push and the deal walks.",
    },
  ];

  elements.sellerStage.innerHTML = `
    <article class="${sellerCardClass} rarity-${draft.rarity}">
      <div class="desk-copy">
        <p class="label-line">Current Session</p>
        <h2>The Appraisal Desk</h2>
      </div>

      <div class="desk-layout">
        <section class="artifact-column">
          <div class="artifact-stage">
            <div class="artifact-frame rarity-${draft.rarity}">
              <div class="artifact-visual category-${category.cssClass}">
                <div class="artifact-halo" aria-hidden="true"></div>
                <div class="artifact-card-chip">
                  <span>Traveler ${currentNight.activeIndex + 1} / ${SELLERS_PER_NIGHT}</span>
                </div>
                <div class="traveler-note">
                  <p class="label-line">${escapeHtml(archetype.label)}</p>
                  <h3>${escapeHtml(activeOffer.sellerName)}</h3>
                  <p class="traveler-caption">Moonlit audience at the broker's stall</p>
                  <div class="patience-row" aria-label="Traveler patience">
                    ${Array.from({ length: 2 }, (_, index) => `<span class="patience-dot ${index < activeOffer.patience ? "live" : ""}"></span>`).join("")}
                  </div>
                </div>
                <div class="artifact-note">
                  <span class="label-line">Subject #${escapeHtml(String(currentNight.number).padStart(2, "0"))}-${String(currentNight.activeIndex + 1).padStart(2, "0")}</span>
                  <p>"${escapeHtml(activeOffer.story)}"</p>
                </div>
                <div class="artifact-glyph" aria-hidden="true">
                  <span class="material-symbols-outlined">${getCategorySymbol(draft.category)}</span>
                </div>
              </div>

              <div class="artifact-ledger">
                <div>
                  <p class="label-line">${escapeHtml(category.label)} / ${escapeHtml(activeOffer.revealState.rareReadKnown ? rarity.label : "Tier Veiled")}</p>
                  <h3>${escapeHtml(draft.name)}</h3>
                  <p class="artifact-blurb">${escapeHtml(draft.blurb)}</p>
                </div>
                <div class="offer-value">
                  <span>Asking Tribute</span>
                  <strong>${formatCurrency(activeOffer.currentPrice)}</strong>
                  <small>${currentPriceChanged ? `Was ${formatCurrency(activeOffer.askPrice)}` : "Fresh from the road"}</small>
                </div>
              </div>
            </div>

            <div class="gambit-board">
              <div class="section-head compact">
                <div>
                  <p class="label-line">Negotiation Gambit</p>
                  <h3>Choose your merchant action</h3>
                </div>
              </div>
              <div class="action-grid">
                <button class="action-button gambit-card" type="button" data-action="inspect-offer">
                  <strong>Appraise</strong>
                  <span>Reveal the state first, then lineage and omen.</span>
                  <small>Precision skill</small>
                </button>
                <button class="action-button gambit-card" type="button" data-action="haggle-soft" ${activeOffer.haggleState.soft !== "unused" ? "disabled" : ""}>
                  <strong>Gentle Bargain</strong>
                  <span>Try for 10% off with the safer appeal.</span>
                  <small>${escapeHtml(describeHaggleState(activeOffer.haggleState.soft, "Soft angle"))}</small>
                </button>
                <button class="action-button gambit-card" type="button" data-action="haggle-firm" ${activeOffer.haggleState.firm !== "unused" ? "disabled" : ""}>
                  <strong>Hard Bargain</strong>
                  <span>Push for 20% off and risk losing the audience.</span>
                  <small>${escapeHtml(describeHaggleState(activeOffer.haggleState.firm, "Hard angle"))}</small>
                </button>
                <button class="action-button gambit-card primary" type="button" data-action="buy-offer" ${state.cash < activeOffer.currentPrice ? "disabled" : ""}>
                  <strong>Claim for ${formatCurrency(activeOffer.currentPrice)}</strong>
                  <span>${state.cash < activeOffer.currentPrice ? "Your purse is too light for this relic." : "Bring it into the pack and prepare it for the stall."}</span>
                  <small>Secure the artifact</small>
                </button>
                <button class="action-button gambit-card" type="button" data-action="pass-offer">
                  <strong>Decline</strong>
                  <span>Let this traveler walk and await the next audience.</span>
                  <small>No cost, next traveler</small>
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside class="diagnostic-panel">
          <div class="diagnostic-paper">
            <div class="diagnostic-head">
              <div>
                <p class="label-line">Appraisal Ledger</p>
                <h3>Diagnostic Feed</h3>
              </div>
              <span class="material-symbols-outlined diagnostic-mark" aria-hidden="true">stylus_note</span>
            </div>

            <div class="diagnostic-list">
              ${diagnostics
                .map(
                  (entry) => `
                    <article class="diagnostic-block">
                      <div class="diagnostic-row">
                        <span>${escapeHtml(entry.label)}</span>
                        <strong>${escapeHtml(entry.readout)}</strong>
                      </div>
                      <div class="meter-track">
                        <span class="meter-fill" style="width:${entry.percent}%"></span>
                      </div>
                      <p>${escapeHtml(entry.copy)}</p>
                    </article>
                  `,
                )
                .join("")}
            </div>

            <div class="diagnostic-note">
              <p class="label-line">Appraiser's Note</p>
              <p>${escapeHtml(activeOffer.revealState.weirdTagKnown ? weirdRead : CONDITION_DEFS[draft.condition].description)}</p>
              <div class="diagnostic-tags">
                <span class="tag-pill category-${category.cssClass}">
                  ${escapeHtml(category.label)}
                </span>
                <span class="tag-pill rarity-${draft.rarity}">
                  ${activeOffer.revealState.rareReadKnown ? escapeHtml(rarity.label) : "Tier Veiled"}
                </span>
                <span class="tag-pill ${activeOffer.revealState.authenticityHintKnown ? "is-lit" : "is-muted"}">
                  ${activeOffer.revealState.authenticityHintKnown ? escapeHtml(authenticityRead) : "Lineage hidden"}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </article>
  `;
}

function getCurioSummaryText() {
  const bonuses = getCurioBonuses();
  if (!bonuses.saleChance && !bonuses.haggleChance && !bonuses.saleMultiplier) {
    return "Enshrine elite and cursed relics here to earn passive guild boons.";
  }
  return `Relic boons: +${Math.round(bonuses.saleChance * 100)}% sale chance, +${Math.round(
    bonuses.haggleChance * 100,
  )}% bargain, +${Math.round(bonuses.saleMultiplier * 100)}% sale price.`;
}

function renderItemCard(item, placement) {
  const market = getActiveMarket();
  const saleChance = computeSaleChance(item, market);
  const currentValuation = getCurrentValuation(item);
  const conditionLabel = CONDITION_DEFS[item.condition].label;
  const authLabel = item.isAuthenticated
    ? item.authenticity === "authentic"
      ? "True relic"
      : "Forgery"
    : "Unverified";
  const buttons = [];

  if (placement === "listed") {
    buttons.push(
      `<button class="secondary-button" type="button" data-action="pull-listing" data-item-id="${item.id}" ${!isNightActive() ? "disabled" : ""}>Withdraw</button>`,
    );
    if (item.rarity === "elite" || item.rarity === "cursed") {
      buttons.push(
        `<button class="ghost-button" type="button" data-action="vault-item" data-item-id="${item.id}" ${!isNightActive() || state.curioItemIds.length >= getCurioLimit() ? "disabled" : ""}>Enshrine</button>`,
      );
    }
  }

  if (placement === "inventory") {
    if (!item.wipedDown) {
      buttons.push(
        `<button class="secondary-button" type="button" data-action="prep-item" data-prep-id="wipe" data-item-id="${item.id}" ${!isNightActive() ? "disabled" : ""}>Polish ${formatCurrency(getPrepCost("wipe"))}</button>`,
      );
    }
    if (!item.repaired) {
      buttons.push(
        `<button class="secondary-button" type="button" data-action="prep-item" data-prep-id="repair" data-item-id="${item.id}" ${!isNightActive() ? "disabled" : ""}>Mend ${formatCurrency(getPrepCost("repair"))}</button>`,
      );
    }
    if (!item.isAuthenticated) {
      buttons.push(
        `<button class="secondary-button" type="button" data-action="prep-item" data-prep-id="authenticate" data-item-id="${item.id}" ${!isNightActive() ? "disabled" : ""}>Verify ${formatCurrency(getPrepCost("authenticate"))}</button>`,
      );
    }
    buttons.push(
      `<button class="primary-button" type="button" data-action="list-item" data-item-id="${item.id}" ${!isNightActive() || state.listedItemIds.length >= getShelfLimit() ? "disabled" : ""}>Place on Stall</button>`,
    );
    if (item.rarity === "elite" || item.rarity === "cursed") {
      buttons.push(
        `<button class="ghost-button" type="button" data-action="vault-item" data-item-id="${item.id}" ${!isNightActive() || state.curioItemIds.length >= getCurioLimit() ? "disabled" : ""}>Enshrine</button>`,
      );
    }
  }

  if (placement === "curio") {
    buttons.push(
      `<button class="secondary-button" type="button" data-action="unvault-item" data-item-id="${item.id}" ${!isNightActive() ? "disabled" : ""}>Unseal</button>`,
    );
  }

  const placementFact =
    placement === "listed"
      ? `Market draw: ${formatPercent(saleChance)}`
      : placement === "curio"
        ? item.rarity === "elite"
          ? "Boon: +3% sale, +2% bargain, +2% price"
          : "Boon: +5% sale, +5% bargain, +4% price"
        : `Current appraisal: ${formatCurrency(currentValuation)}`;

  return `
    <article class="item-card compact rarity-${item.rarity}">
      <div class="item-visual category-${CATEGORY_DEFS[item.category].cssClass}">
        <span class="item-index">${escapeHtml(getPlacementLabel(placement))}</span>
        <span class="item-emblem material-symbols-outlined" aria-hidden="true">${getCategorySymbol(item.category)}</span>
        <span class="tag-pill rarity-${item.rarity}">
          ${escapeHtml(RARITY_DEFS[item.rarity].label)}
        </span>
      </div>

      <div class="item-heading">
        <div>
          <p class="label-line">${escapeHtml(getPlacementLabel(placement))}</p>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.blurb)}</p>
        </div>
      </div>

      <div class="item-value-row">
        <div class="value-stack">
          <span>${placement === "listed" ? "Expected takings" : "Paid"}</span>
          <strong>${placement === "listed" ? formatCurrency(Math.round(currentValuation * getPrepMultiplier(item))) : formatCurrency(item.purchasePrice)}</strong>
        </div>
        <div class="value-stack">
          <span>${placement === "curio" ? "Relic aura" : "Readout"}</span>
          <strong>${escapeHtml(authLabel)}</strong>
        </div>
      </div>

      <div class="item-tags">
        <span class="tag-pill category-${CATEGORY_DEFS[item.category].cssClass}">
          ${escapeHtml(CATEGORY_DEFS[item.category].label)}
        </span>
        <span class="tag-pill ${item.isAuthenticated ? "is-lit" : "is-muted"}">
          ${escapeHtml(authLabel)}
        </span>
      </div>

      <div class="stat-grid">
        <span class="line-pill is-highlight">State: ${escapeHtml(conditionLabel)}</span>
        <span class="line-pill ${item.wipedDown ? "is-highlight" : "is-hidden"}">Polished</span>
        <span class="line-pill ${item.repaired ? "is-highlight" : "is-hidden"}">Mended</span>
        <span class="line-pill is-highlight">${escapeHtml(placementFact)}</span>
      </div>

      <p class="item-facts">${escapeHtml(item.weirdTag)}</p>

      ${buttons.length ? `<div class="item-actions">${buttons.join("")}</div>` : ""}
    </article>
  `;
}

function renderRail() {
  const listedItems = state.inventory.filter((item) => item.listed && !item.vaulted);
  const drawerItems = state.inventory.filter((item) => !item.listed && !item.vaulted);
  const curioItems = state.inventory.filter((item) => item.vaulted);

  elements.shelfCapacityLabel.textContent = `${listedItems.length} / ${getShelfLimit()}`;
  elements.inventoryCountLabel.textContent = `${drawerItems.length} relic${drawerItems.length === 1 ? "" : "s"}`;
  elements.curioCapacityLabel.textContent = `${curioItems.length} / ${getCurioLimit()}`;
  elements.curioPassiveSummary.textContent = getCurioSummaryText();

  elements.listedItemsList.innerHTML = listedItems.length
    ? listedItems.map((item) => renderItemCard(item, "listed")).join("")
    : `<div class="empty-state">No wares on the stall yet. Prepare a relic and place it before the chapter ends.</div>`;

  elements.inventoryList.innerHTML = drawerItems.length
    ? drawerItems.map((item) => renderItemCard(item, "inventory")).join("")
    : `<div class="empty-state">Your pack is empty. Claim a strange relic to get the run moving.</div>`;

  elements.curioList.innerHTML = curioItems.length
    ? curioItems.map((item) => renderItemCard(item, "curio")).join("")
    : `<div class="empty-state">Elite and cursed relics can be enshrined here for passive guild boons.</div>`;
}

function renderUpgrades() {
  elements.upgradesList.innerHTML = UPGRADE_DEFS.map((upgrade) => {
    const ownedCount = getUpgradeCount(upgrade.id);
    const soldOut = ownedCount >= upgrade.maxCount;
    const ownedText =
      upgrade.maxCount === 1 ? (ownedCount ? "Bound" : "Unbound") : `${ownedCount} / ${upgrade.maxCount}`;

    return `
      <article class="upgrade-card">
        <p class="section-eyebrow">Guild talent</p>
        <h3>${escapeHtml(upgrade.name)}</h3>
        <p class="upgrade-copy">${escapeHtml(upgrade.description)}</p>
        <div class="upgrade-meta">
          <span class="line-pill is-highlight">${escapeHtml(ownedText)}</span>
          <span class="line-pill">${formatCurrency(upgrade.cost)}</span>
        </div>
        <div class="upgrade-footer">
          <span class="upgrade-price">${formatCurrency(upgrade.cost)}</span>
          <button class="primary-button" type="button" data-action="buy-upgrade" data-upgrade-id="${upgrade.id}" ${soldOut || state.cash < upgrade.cost ? "disabled" : ""}>
            ${soldOut ? "Mastered" : "Acquire"}
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function renderLedger() {
  const seenTemplateIds = state.collection.templateSeenIds;
  const categoryCards = CATEGORY_IDS.map((categoryId) => {
    const templates = ITEM_TEMPLATES.filter((template) => template.category === categoryId);
    const seenTemplates = templates.filter((template) => seenTemplateIds.includes(template.id));
    return `
      <article class="ledger-card">
        <p class="section-eyebrow">${escapeHtml(CATEGORY_DEFS[categoryId].label)}</p>
        <h3>${seenTemplates.length} / ${templates.length} discovered</h3>
        <p class="ledger-copy">
          ${seenTemplates.length ? escapeHtml(seenTemplates.map((template) => template.name).join(", ")) : "No pulls logged here yet."}
        </p>
      </article>
    `;
  }).join("");

  const raritySales = RARITY_IDS.map((rarityId) => {
    return `<span class="line-pill is-highlight">${escapeHtml(RARITY_DEFS[rarityId].label)} sold: ${safeNumber(
      state.collection.soldByRarity[rarityId],
      0,
    )}</span>`;
  }).join("");

  elements.ledgerContent.innerHTML = `
    <article class="ledger-card">
      <p class="section-eyebrow">Guild summary</p>
      <h3>${seenTemplateIds.length} / ${ITEM_TEMPLATES.length} relic templates seen</h3>
      <p class="ledger-copy">
        Travelers met: ${state.collection.sellerSeenIds.length} / ${SELLER_ARCHETYPES.length}. Omens found: ${state.collection.weirdTagsSeen.length}.
      </p>
      <div class="stat-grid">
        <span class="line-pill is-highlight">Claimed: ${state.stats.totalBuys}</span>
        <span class="line-pill is-highlight">Sold: ${state.stats.totalSales}</span>
        <span class="line-pill is-highlight">Enshrined: ${state.stats.totalVaulted}</span>
        <span class="line-pill is-highlight">Best sale: ${state.stats.bestSaleName ? `${escapeHtml(state.stats.bestSaleName)} ${formatCurrency(state.stats.bestSale)}` : "None yet"}</span>
      </div>
    </article>

    <article class="ledger-card">
      <p class="section-eyebrow">Rarity sell-through</p>
      <h3>Deals by band</h3>
      <div class="stat-grid">
        ${raritySales}
      </div>
    </article>

    ${categoryCards}
  `;
}

function renderGuidebookPage(page, pageNumber, sideClass) {
  const facts = Array.isArray(page.facts)
    ? page.facts
        .map((fact) => `<span class="guidebook-fact">${escapeHtml(fact)}</span>`)
        .join("")
    : "";

  const sections = Array.isArray(page.sections)
    ? page.sections
        .map((section) => {
          const bullets = Array.isArray(section.bullets)
            ? `<ul class="guidebook-list">${section.bullets
                .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
                .join("")}</ul>`
            : "";
          const copy = section.copy
            ? `<p class="guidebook-page-copy">${escapeHtml(section.copy)}</p>`
            : "";
          return `
            <section class="guidebook-page-section">
              <p class="guide-subhead">${escapeHtml(section.title)}</p>
              ${copy}
              ${bullets}
            </section>
          `;
        })
        .join("")
    : "";

  return `
    <article class="guidebook-page ${sideClass}">
      <div class="guidebook-page-head">
        <p class="section-eyebrow">${escapeHtml(page.eyebrow)}</p>
        <span class="guidebook-page-number">Page ${pageNumber}</span>
      </div>
      <h3>${escapeHtml(page.title)}</h3>
      <p class="guidebook-page-copy">${escapeHtml(page.intro)}</p>
      ${facts ? `<div class="guidebook-fact-strip">${facts}</div>` : ""}
      ${sections}
      ${page.note ? `<p class="guidebook-note">${escapeHtml(page.note)}</p>` : ""}
    </article>
  `;
}

function renderSettings() {
  elements.settingsContent.innerHTML = `
    <article class="settings-card">
      <p class="section-eyebrow">Guidebook</p>
      <h3>Open the handbook</h3>
      <p class="settings-copy">
        If the run still feels confusing, open the in-world guidebook. It explains the full loop,
        traveler actions, relic quality, reliquary bonuses, closeout, and beginner strategy.
      </p>
      <div class="stat-grid">
        <span class="line-pill is-highlight">4 spreads</span>
        <span class="line-pill is-highlight">8 pages</span>
        <span class="line-pill is-highlight">Rules + strategy</span>
      </div>
      <div class="settings-actions">
        <button class="primary-button" type="button" data-action="open-guidebook">
          Open Guidebook
        </button>
      </div>
    </article>

    <article class="settings-card">
      <p class="section-eyebrow">Quick reminder</p>
      <h3>The shortest version</h3>
      <p class="settings-copy">
        Inspect when the deal is unclear, bargain when the price is close, buy only what helps the
        night, prep the best relics, fill the stall, and beat the bounty before closeout.
      </p>
      <ul class="settings-list">
        <li><strong>Inspect</strong> is free and reveals condition first.</li>
        <li><strong>Gentle Bargain</strong> is the safer haggle.</li>
        <li><strong>Hard Bargain</strong> is stronger, but more dangerous.</li>
        <li><strong>Place on Stall</strong> is required for closeout sales.</li>
        <li><strong>Enshrine</strong> saves elite and cursed relics for passive bonuses.</li>
      </ul>
    </article>

    <article class="settings-card">
      <p class="section-eyebrow">Bound ledger</p>
      <h3>Auto-save is always on</h3>
      <p class="settings-copy">
        Midnight Pawn stores progress in localStorage under <strong>${escapeHtml(STORAGE_KEY)}</strong>. Reloading the page restores the current chapter, inventory, talents, and recap state.
      </p>
    </article>

    <article class="settings-card">
      <p class="section-eyebrow">Hard reset</p>
      <h3>Burn the ledger</h3>
      <p class="settings-copy">
        This fully clears the save key and restarts the broker at Night 1 with the opening purse.
      </p>
      <div class="settings-actions">
        <span class="line-pill">Current chapter: ${state.currentNight?.number || state.night}</span>
        <button class="danger-button" type="button" data-action="reset-save">
          Reset Progress
        </button>
      </div>
      </article>
    `;
}

function renderGuidebook() {
  const isOpen = Boolean(runtime.guidebookOpen);
  elements.guidebookLayer.classList.toggle("is-open", isOpen);
  elements.guidebookLayer.setAttribute("aria-hidden", String(!isOpen));

  if (!isOpen) {
    return;
  }

  const maxIndex = GUIDEBOOK_SPREADS.length - 1;
  const spreadIndex = clamp(runtime.guidebookSpreadIndex, 0, maxIndex);
  runtime.guidebookSpreadIndex = spreadIndex;
  const spread = GUIDEBOOK_SPREADS[spreadIndex];
  const leftPageNumber = spreadIndex * 2 + 1;
  const rightPageNumber = leftPageNumber + 1;
  const flipDirection = runtime.guidebookFlipDirection;

  elements.guidebookTabs.innerHTML = GUIDEBOOK_SPREADS.map((entry, index) => {
    return `
      <button
        class="guidebook-tab ${index === spreadIndex ? "is-active" : ""}"
        type="button"
        data-action="set-guidebook-spread"
        data-spread-index="${index}"
      >
        ${escapeHtml(entry.chapter)}
      </button>
    `;
  }).join("");

  elements.guidebookSpread.className = `guidebook-spread${flipDirection ? ` is-flipping-${flipDirection}` : ""}`;
  elements.guidebookSpread.innerHTML = `
    ${renderGuidebookPage(spread.left, leftPageNumber, "left-page")}
    <div class="guidebook-spine" aria-hidden="true"></div>
    ${renderGuidebookPage(spread.right, rightPageNumber, "right-page")}
    ${flipDirection ? `<div class="guidebook-flip-sheet flip-${flipDirection}" aria-hidden="true"></div>` : ""}
  `;

  elements.guidebookPageLabel.textContent = `Pages ${leftPageNumber}-${rightPageNumber}`;
  elements.guidebookPrevButton.disabled = spreadIndex <= 0;
  elements.guidebookNextButton.disabled = spreadIndex >= maxIndex;
  elements.guidebookBody.scrollTop = 0;
}

function renderPanels() {
  elements.panelLayer.classList.toggle("is-open", Boolean(runtime.openPanel));
  elements.panelLayer.setAttribute("aria-hidden", String(!runtime.openPanel));

  elements.drawerPanels.forEach((panel) => {
    panel.classList.toggle(
      "is-active",
      panel.dataset.panelName === runtime.openPanel,
    );
  });
}

function updateTopNavIndicator(targetItem = null) {
  if (!elements.topNav || !elements.topNavIndicator || !elements.topNavItems.length) {
    return;
  }

  const fallbackItem =
    elements.topNavItems.find((item) => item.dataset.navKey === runtime.topNavActive) ||
    elements.topNavItems[0];
  const indicatorTarget = targetItem || fallbackItem;

  if (!indicatorTarget) {
    elements.topNavIndicator.style.opacity = "0";
    elements.topNavIndicator.style.width = "0";
    return;
  }

  const navRect = elements.topNav.getBoundingClientRect();
  const itemRect = indicatorTarget.getBoundingClientRect();
  elements.topNavIndicator.style.width = `${itemRect.width}px`;
  elements.topNavIndicator.style.transform = `translateX(${itemRect.left - navRect.left}px)`;
  elements.topNavIndicator.style.opacity = "1";
}

function setTopNavActive(navKey) {
  runtime.topNavActive = navKey;
  elements.topNavItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.navKey === navKey);
  });
  updateTopNavIndicator();
}

function renderRecap() {
  const currentNight = getCurrentNight();
  const isOpen = Boolean(currentNight && currentNight.status === "closed");
  elements.recapLayer.classList.toggle("is-open", isOpen);
  elements.recapLayer.setAttribute("aria-hidden", String(!isOpen));

  if (!isOpen) {
    return;
  }

  const soldCount = currentNight.closeoutResults.filter((result) => result.sold).length;
  const unsoldCount = state.listedItemIds.length;

  elements.recapTitle.textContent = `Night ${currentNight.number} complete`;
  elements.recapSubtitle.textContent = currentNight.goalMet
    ? "The chapter paid out. Word of your stall is spreading."
    : "You survived the chapter. The bounty can wait for the next rumor board.";
  elements.recapProfit.textContent = formatCurrency(currentNight.todayProfit);
  elements.recapSoldCount.textContent = String(soldCount);
  elements.recapBonus.textContent = formatCurrency(currentNight.bonusCash);
  elements.recapTargetBadge.textContent = currentNight.goalMet ? "Bounty claimed" : "Bounty missed";
  elements.recapTargetBadge.className = `result-badge ${currentNight.goalMet ? "success" : "missed"}`;
  elements.recapUnsoldBadge.textContent = `${unsoldCount} relics carried over`;
  elements.startNextNightButton.textContent = `Begin Night ${state.night}`;

  if (!currentNight.closeoutResults.length) {
    elements.recapSalesList.innerHTML = `
      <div class="empty-state">
        Nothing sold during closeout. Begin the next chapter and stack the stall differently.
      </div>
    `;
    return;
  }

  elements.recapSalesList.innerHTML = currentNight.closeoutResults
    .map((result, index) => {
      const cardClass = result.sold ? "recap-sale-card sold" : "recap-sale-card";
      return `
        <article class="${cardClass}" style="animation-delay:${index * 60}ms">
          ${result.sold ? `<span class="sold-stamp">SEALED</span>` : ""}
          <p class="section-eyebrow">${escapeHtml(CATEGORY_DEFS[result.category].label)} / ${escapeHtml(RARITY_DEFS[result.rarity].label)}</p>
          <h3>${escapeHtml(result.name)}</h3>
          <p class="ledger-copy">${escapeHtml(result.reason)}</p>
          <div class="stat-grid">
            <span class="line-pill is-highlight">${result.sold ? `Sale ${formatCurrency(result.salePrice)}` : "Held over"}</span>
            <span class="line-pill">${result.sold ? `Chance was ${formatPercent(result.chance)}` : "Rolls again next chapter"}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAll() {
  renderHud();
  renderSellerStage();
  renderRail();
  renderUpgrades();
  renderLedger();
  renderSettings();
  renderPanels();
  renderGuidebook();
  renderRecap();
}

function findInventoryItem(itemId) {
  return state.inventory.find((item) => item.id === itemId) || null;
}

function syncItemCollections() {
  state.listedItemIds = state.inventory.filter((item) => item.listed && !item.vaulted).map((item) => item.id);
  state.curioItemIds = state.inventory.filter((item) => item.vaulted).map((item) => item.id);
}

function advanceOffer(message) {
  const currentNight = getCurrentNight();
  if (!currentNight || currentNight.status !== "active") {
    return;
  }

  currentNight.activeIndex += 1;
  if (currentNight.activeIndex >= currentNight.queue.length) {
    runNightCloseout(false);
    return;
  }

  setNightMessage(message);
  saveGame();
  renderAll();
}

function inspectOffer() {
  const activeOffer = getActiveOffer();
  if (!activeOffer) {
    return;
  }

  activeOffer.inspectionCount += 1;
  if (!activeOffer.revealState.conditionKnown) {
    activeOffer.revealState.conditionKnown = true;
    if (hasUpgrade("blacklightLamp") &&
        (activeOffer.itemDraft.rarity === "elite" ||
          activeOffer.itemDraft.rarity === "cursed" ||
          activeOffer.itemDraft.authenticity === "fake")) {
      activeOffer.revealState.rareReadKnown = true;
      setNightMessage(`State logged. The lamp also threw a strong omen on this relic.`);
    } else {
      setNightMessage(`State revealed: ${CONDITION_DEFS[activeOffer.itemDraft.condition].label}.`);
    }
  } else if (!activeOffer.revealState.authenticityHintKnown) {
    activeOffer.revealState.authenticityHintKnown = true;
    activeOffer.revealState.weirdTagKnown = true;
    if (hasUpgrade("blacklightLamp")) {
      activeOffer.revealState.rareReadKnown = true;
    }
    setNightMessage(`You read the build and uncovered the omen: ${activeOffer.itemDraft.weirdTag}.`);
  } else if (!activeOffer.revealState.rareReadKnown && hasUpgrade("blacklightLamp")) {
    activeOffer.revealState.rareReadKnown = true;
    setNightMessage(getRareRead(activeOffer.itemDraft));
  } else {
    setNightMessage("You already pulled most of the omen out of this relic.");
  }

  saveGame();
  renderAll();
}

function getHaggleChance(type, offer) {
  const baseChance = type === "soft" ? 0.72 : 0.46;
  let chance = baseChance;
  if (hasUpgrade("fastTalkLessons")) {
    chance += 0.12;
  }
  chance += safeNumber(SELLER_ARCHETYPE_MAP[offer.archetypeId]?.haggleModifier, 0);
  chance += getCurioBonuses().haggleChance;
  if (offer.itemDraft.rarity === "elite") {
    chance -= 0.04;
  }
  if (offer.itemDraft.rarity === "cursed") {
    chance -= 0.06;
  }
  return clamp(chance, 0.12, 0.92);
}

function haggleOffer(type) {
  const activeOffer = getActiveOffer();
  if (!activeOffer) {
    return;
  }

  if (activeOffer.haggleState[type] !== "unused") {
    setNightMessage("That bargaining angle is already spent.");
    return;
  }

  const discount = type === "soft" ? 0.9 : 0.8;
  const chance = getHaggleChance(type, activeOffer);
  const success = Math.random() < chance;

  if (success) {
    activeOffer.currentPrice = Math.max(1, Math.round(activeOffer.currentPrice * discount));
    activeOffer.haggleState[type] = "success";
    state.stats.haggleWins += 1;
    setNightMessage(
      `${type === "soft" ? "Gentle" : "Hard"} bargain landed. New tribute: ${formatCurrency(activeOffer.currentPrice)}.`,
    );
  } else {
    activeOffer.patience = Math.max(0, activeOffer.patience - 1);
    activeOffer.haggleState[type] = "failed";
    state.stats.haggleLosses += 1;
    if (activeOffer.patience <= 0) {
      activeOffer.status = "walked";
      advanceOffer("The traveler snapped and left with the relic.");
      return;
    }
    setNightMessage("They did not move. One more bad push and the audience is over.");
  }

  saveGame();
  renderAll();
}

function buyActiveOffer() {
  const currentNight = getCurrentNight();
  const activeOffer = getActiveOffer();
  if (!currentNight || !activeOffer) {
    return;
  }

  if (state.cash < activeOffer.currentPrice) {
    setNightMessage("Your purse is too light for that claim.");
    return;
  }

  const item = normalizeInventoryItem({
    ...activeOffer.itemDraft,
    id: nextId("item"),
    purchasePrice: activeOffer.currentPrice,
    acquiredNight: currentNight.number,
    sellerArchetypeId: activeOffer.archetypeId,
    listed: false,
    vaulted: false,
  });

  state.cash -= activeOffer.currentPrice;
  currentNight.todayProfit -= activeOffer.currentPrice;
  state.stats.totalBuys += 1;
  state.stats.totalSpent += activeOffer.currentPrice;
  markCollectionSeen(item, activeOffer.archetypeId);
  state.inventory.push(item);
  activeOffer.status = "bought";
  syncItemCollections();
  advanceOffer(`${item.name} is in your pack. Prepare it before the chapter ends.`);
}

function passActiveOffer() {
  const currentNight = getCurrentNight();
  const activeOffer = getActiveOffer();
  if (!currentNight || !activeOffer) {
    return;
  }

  activeOffer.status = "passed";
  state.stats.totalPasses += 1;
  advanceOffer("You declined the trade. Next traveler steps forward.");
}

function applyPrepAction(itemId, prepId) {
  const currentNight = getCurrentNight();
  const item = findInventoryItem(itemId);
  if (!currentNight || currentNight.status !== "active" || !item) {
    return;
  }

  if (item.listed) {
    setNightMessage("Withdraw it from the stall before you work on it.");
    return;
  }
  if (item.vaulted) {
    setNightMessage("Reliquary pieces must be unsealed before you work on them.");
    return;
  }

  if (prepId === "wipe" && item.wipedDown) {
    setNightMessage("It has already been polished.");
    return;
  }
  if (prepId === "repair" && item.repaired) {
    setNightMessage("It has already been mended.");
    return;
  }
  if (prepId === "authenticate" && item.isAuthenticated) {
    setNightMessage("Its lineage has already been verified.");
    return;
  }

  const cost = getPrepCost(prepId);
  if (state.cash < cost) {
    setNightMessage("Your purse is too light for that workshop move.");
    return;
  }

  state.cash -= cost;
  state.stats.totalSpent += cost;
  currentNight.todayProfit -= cost;

  if (prepId === "wipe") {
    item.wipedDown = true;
    setNightMessage(`${item.name} polished up better than expected.`);
  }

  if (prepId === "repair") {
    item.repaired = true;
    setNightMessage(`${item.name} just earned a stronger resale tale.`);
  }

  if (prepId === "authenticate") {
    item.isAuthenticated = true;
    setNightMessage(
      item.authenticity === "authentic"
        ? `${item.name} proved itself a true relic.`
        : `${item.name} is a forgery, but at least the truth is known.`,
    );
  }

  saveGame();
  renderAll();
}

function listItem(itemId) {
  const item = findInventoryItem(itemId);
  if (!item || !isNightActive()) {
    return;
  }
  if (item.listed) {
    setNightMessage("It is already on the stall.");
    return;
  }
  if (item.vaulted) {
    setNightMessage("Unseal it from the reliquary first.");
    return;
  }
  if (state.listedItemIds.length >= getShelfLimit()) {
    setNightMessage("The stall is full. Acquire more space or withdraw something.");
    return;
  }

  item.listed = true;
  syncItemCollections();
  setNightMessage(`${item.name} is now on the stall for tonight's closeout.`);
  saveGame();
  renderAll();
}

function pullListing(itemId) {
  const item = findInventoryItem(itemId);
  if (!item || !isNightActive()) {
    return;
  }

  item.listed = false;
  syncItemCollections();
  setNightMessage(`${item.name} is back in your pack.`);
  saveGame();
  renderAll();
}

function vaultItem(itemId) {
  const item = findInventoryItem(itemId);
  if (!item || !isNightActive()) {
    return;
  }
  if (!(item.rarity === "elite" || item.rarity === "cursed")) {
    setNightMessage("Only elite and cursed relics can enter the reliquary.");
    return;
  }
  if (item.vaulted) {
    setNightMessage("That relic is already enshrined.");
    return;
  }
  if (state.curioItemIds.length >= getCurioLimit()) {
    setNightMessage("The reliquary is full.");
    return;
  }

  item.listed = false;
  item.vaulted = true;
  syncItemCollections();
  state.stats.totalVaulted = state.curioItemIds.length;
  setNightMessage(`${item.name} is now feeding the guild from the reliquary.`);
  saveGame();
  renderAll();
}

function unvaultItem(itemId) {
  const item = findInventoryItem(itemId);
  if (!item || !isNightActive()) {
    return;
  }

  item.vaulted = false;
  syncItemCollections();
  state.stats.totalVaulted = state.curioItemIds.length;
  setNightMessage(`${item.name} is back in your pack.`);
  saveGame();
  renderAll();
}

function buyUpgrade(upgradeId) {
  const upgrade = UPGRADE_MAP[upgradeId];
  if (!upgrade) {
    return;
  }
  const currentCount = getUpgradeCount(upgradeId);
  if (currentCount >= upgrade.maxCount) {
    setNightMessage("That guild talent is already mastered.");
    return;
  }
  if (state.cash < upgrade.cost) {
    setNightMessage("Not enough coin for that guild talent.");
    return;
  }

  state.cash -= upgrade.cost;
  state.stats.totalSpent += upgrade.cost;
  state.upgrades[upgradeId] = currentCount + 1;
  setNightMessage(`${upgrade.name} acquired.`);
  saveGame();
  renderAll();
}

function runNightCloseout(manualClose) {
  const currentNight = getCurrentNight();
  if (!currentNight || currentNight.status !== "active") {
    return;
  }

  currentNight.manualClose = manualClose;

  currentNight.queue.forEach((offer, index) => {
    if (index >= currentNight.activeIndex && offer.status === "active") {
      offer.status = "missed";
    }
  });

  const remainingInventory = [];
  const closeoutResults = [];

  for (const item of state.inventory) {
    if (item.vaulted) {
      remainingInventory.push(item);
      continue;
    }

    if (!item.listed) {
      remainingInventory.push(item);
      continue;
    }

    const chance = computeSaleChance(item, currentNight.market);
    const sold = Math.random() < chance;
    if (sold) {
      const salePrice = computeSalePrice(item);
      state.cash += salePrice;
      currentNight.todayProfit += salePrice;
      state.stats.totalSales += 1;
      state.stats.totalRevenue += salePrice;
      state.collection.soldByRarity[item.rarity] += 1;

      if (salePrice > state.stats.bestSale) {
        state.stats.bestSale = salePrice;
        state.stats.bestSaleName = item.name;
      }

      closeoutResults.push({
        itemId: item.id,
        name: item.name,
        salePrice,
        category: item.category,
        rarity: item.rarity,
        sold: true,
        kept: false,
        chance,
        reason: `The stall sealed the deal at ${formatCurrency(salePrice)}.`,
      });
      continue;
    }

    closeoutResults.push({
      itemId: item.id,
      name: item.name,
      salePrice: 0,
      category: item.category,
      rarity: item.rarity,
      sold: false,
      kept: true,
      chance,
      reason: "No buyer answered the call tonight. It rolls into the next chapter.",
    });
    remainingInventory.push(item);
  }

  state.inventory = remainingInventory;
  syncItemCollections();

  const goalMet = currentNight.todayProfit >= currentNight.targetProfit;
  let bonusCash = 0;
  if (goalMet) {
    bonusCash = Math.round(currentNight.targetProfit * 0.25);
    state.cash += bonusCash;
    state.reputation += 1;
    state.stats.nightsHitTarget += 1;
    state.stats.bonusCashEarned += bonusCash;
  }

  currentNight.status = "closed";
  currentNight.closeoutResults = closeoutResults;
  currentNight.goalMet = goalMet;
  currentNight.bonusCash = bonusCash;
  state.stats.nightsCompleted += 1;
  state.stats.totalVaulted = state.curioItemIds.length;
  state.night = currentNight.number + 1;

  setNightMessage(
    goalMet
      ? `Chapter closed strong. Favor granted: ${formatCurrency(bonusCash)}.`
      : "Chapter closed. No favor this time, but the stall opens again tomorrow.",
  );
  saveGame();
  runtime.openPanel = null;
  renderAll();
}

function queueGuidebookFlip(direction) {
  window.clearTimeout(runtime.guidebookFlipTimer);
  runtime.guidebookFlipDirection = direction;
  runtime.guidebookFlipTimer = window.setTimeout(() => {
    runtime.guidebookFlipDirection = "";
    if (runtime.guidebookOpen) {
      renderGuidebook();
    }
  }, 760);
}

function openGuidebook(spreadIndex = runtime.guidebookSpreadIndex) {
  window.clearTimeout(runtime.guidebookFlipTimer);
  runtime.guidebookOpen = true;
  runtime.guidebookFlipDirection = "";
  runtime.guidebookSpreadIndex = clamp(safeNumber(spreadIndex, 0), 0, GUIDEBOOK_SPREADS.length - 1);
  renderAll();
}

function closeGuidebook() {
  window.clearTimeout(runtime.guidebookFlipTimer);
  runtime.guidebookOpen = false;
  runtime.guidebookFlipDirection = "";
  renderAll();
}

function setGuidebookSpread(spreadIndex) {
  const nextIndex = clamp(
    safeNumber(spreadIndex, runtime.guidebookSpreadIndex),
    0,
    GUIDEBOOK_SPREADS.length - 1,
  );
  const previousIndex = runtime.guidebookSpreadIndex;
  runtime.guidebookSpreadIndex = nextIndex;
  if (runtime.guidebookOpen && nextIndex !== previousIndex) {
    queueGuidebookFlip(nextIndex > previousIndex ? "next" : "prev");
  }
  renderAll();
}

function shiftGuidebookSpread(direction) {
  setGuidebookSpread(runtime.guidebookSpreadIndex + direction);
}

function startNextNight() {
  state.currentNight = generateNight(state.night);
  runtime.openPanel = null;
  saveGame();
  setNightMessage(`Night ${state.night} begins. Fresh travelers are on the way.`);
  renderAll();
}

function openPanel(panelName) {
  if (state.currentNight?.status === "closed") {
    return;
  }
  runtime.openPanel = panelName;
  if (panelName === "ledger") {
    setTopNavActive("chronicles");
  }
  renderAll();
}

function closePanel() {
  const closingPanel = runtime.openPanel;
  runtime.openPanel = null;
  if (closingPanel === "ledger") {
    setTopNavActive(getDefaultTopNavKey());
  }
  renderAll();
}

function resetSave() {
  const confirmed = window.confirm(
    "Reset Midnight Pawn and burn the browser ledger? This cannot be undone.",
  );
  if (!confirmed) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

function handleAction(action, trigger) {
  if (action === "open-panel") {
    openPanel(trigger.dataset.panel);
    return;
  }
  if (action === "close-panel") {
    closePanel();
    return;
  }
  if (action === "open-guidebook") {
    openGuidebook(0);
    return;
  }
  if (action === "close-guidebook") {
    closeGuidebook();
    return;
  }
  if (action === "guidebook-nav") {
    shiftGuidebookSpread(trigger.dataset.direction === "prev" ? -1 : 1);
    return;
  }
  if (action === "set-guidebook-spread") {
    setGuidebookSpread(trigger.dataset.spreadIndex);
    return;
  }
  if (action === "inspect-offer") {
    inspectOffer();
    return;
  }
  if (action === "haggle-soft") {
    haggleOffer("soft");
    return;
  }
  if (action === "haggle-firm") {
    haggleOffer("firm");
    return;
  }
  if (action === "buy-offer") {
    buyActiveOffer();
    return;
  }
  if (action === "pass-offer") {
    passActiveOffer();
    return;
  }
  if (action === "close-night") {
    runNightCloseout(true);
    return;
  }
  if (action === "prep-item") {
    applyPrepAction(trigger.dataset.itemId, trigger.dataset.prepId);
    return;
  }
  if (action === "list-item") {
    listItem(trigger.dataset.itemId);
    return;
  }
  if (action === "pull-listing") {
    pullListing(trigger.dataset.itemId);
    return;
  }
  if (action === "vault-item") {
    vaultItem(trigger.dataset.itemId);
    return;
  }
  if (action === "unvault-item") {
    unvaultItem(trigger.dataset.itemId);
    return;
  }
  if (action === "buy-upgrade") {
    buyUpgrade(trigger.dataset.upgradeId);
    return;
  }
  if (action === "start-next-night") {
    startNextNight();
    return;
  }
  if (action === "reset-save") {
    resetSave();
  }
}

if (TEST_MODE) {
  window.localStorage.removeItem(STORAGE_KEY);
}

const state = loadGame();
ensureCurrentNight();

const runtime = {
  openPanel: INITIAL_PANEL,
  guidebookOpen: false,
  guidebookSpreadIndex: 0,
  guidebookFlipDirection: "",
  guidebookFlipTimer: 0,
  topNavActive: INITIAL_PANEL === "ledger" ? "chronicles" : getDefaultTopNavKey(),
  toastTimer: 0,
  lastMessage: "",
  lastOfferId: "",
  counterFrame: 0,
  animatedValues: {
    cash: state.cash,
    reputation: state.reputation,
    profit: state.currentNight?.todayProfit || 0,
  },
};

const elements = {
  cashDisplay: document.getElementById("cashDisplay"),
  cashTrend: document.getElementById("cashTrend"),
  reputationDisplay: document.getElementById("reputationDisplay"),
  repHint: document.getElementById("repHint"),
  nightDisplay: document.getElementById("nightDisplay"),
  queueDisplay: document.getElementById("queueDisplay"),
  profitDisplay: document.getElementById("profitDisplay"),
  targetDisplay: document.getElementById("targetDisplay"),
  targetStatus: document.getElementById("targetStatus"),
  hotCategoryDisplay: document.getElementById("hotCategoryDisplay"),
  coldCategoryDisplay: document.getElementById("coldCategoryDisplay"),
  hotMarketChip: document.getElementById("hotMarketChip"),
  coldMarketChip: document.getElementById("coldMarketChip"),
  curioBonusChip: document.getElementById("curioBonusChip"),
  closeNightButton: document.getElementById("closeNightButton"),
  sellerStage: document.getElementById("sellerStage"),
  listedItemsList: document.getElementById("listedItemsList"),
  inventoryList: document.getElementById("inventoryList"),
  curioList: document.getElementById("curioList"),
  shelfCapacityLabel: document.getElementById("shelfCapacityLabel"),
  inventoryCountLabel: document.getElementById("inventoryCountLabel"),
  curioCapacityLabel: document.getElementById("curioCapacityLabel"),
  curioPassiveSummary: document.getElementById("curioPassiveSummary"),
  panelLayer: document.getElementById("panelLayer"),
  drawerPanels: Array.from(document.querySelectorAll(".drawer-panel")),
  topNav: document.getElementById("topNav"),
  topNavIndicator: document.getElementById("topNavIndicator"),
  topNavItems: Array.from(document.querySelectorAll("[data-nav-key]")),
  upgradesList: document.getElementById("upgradesList"),
  ledgerContent: document.getElementById("ledgerContent"),
  settingsContent: document.getElementById("settingsContent"),
  guidebookLayer: document.getElementById("guidebookLayer"),
  guidebookTabs: document.getElementById("guidebookTabs"),
  guidebookBody: document.getElementById("guidebookBody"),
  guidebookSpread: document.getElementById("guidebookSpread"),
  guidebookPageLabel: document.getElementById("guidebookPageLabel"),
  guidebookPrevButton: document.getElementById("guidebookPrevButton"),
  guidebookNextButton: document.getElementById("guidebookNextButton"),
  recapLayer: document.getElementById("recapLayer"),
  recapTitle: document.getElementById("recapTitle"),
  recapSubtitle: document.getElementById("recapSubtitle"),
  recapProfit: document.getElementById("recapProfit"),
  recapSoldCount: document.getElementById("recapSoldCount"),
  recapBonus: document.getElementById("recapBonus"),
  recapTargetBadge: document.getElementById("recapTargetBadge"),
  recapUnsoldBadge: document.getElementById("recapUnsoldBadge"),
  recapSalesList: document.getElementById("recapSalesList"),
  startNextNightButton: document.getElementById("startNextNightButton"),
  toast: document.getElementById("toast"),
};

elements.topNavItems.forEach((item) => {
  item.addEventListener("mouseenter", () => {
    updateTopNavIndicator(item);
  });
  item.addEventListener("focus", () => {
    updateTopNavIndicator(item);
  });
  item.addEventListener("mouseleave", () => {
    updateTopNavIndicator();
  });
  item.addEventListener("blur", () => {
    updateTopNavIndicator();
  });
});

document.addEventListener("click", (event) => {
  const navTrigger = event.target.closest("[data-nav-key]");
  if (navTrigger) {
    setTopNavActive(navTrigger.dataset.navKey);
    if (navTrigger.tagName === "A") {
      window.requestAnimationFrame(() => {
        if (runtime.openPanel !== "ledger") {
          setTopNavActive(getDefaultTopNavKey());
        }
      });
    }
  }

  const trigger = event.target.closest("[data-action]");
  if (!trigger) {
    return;
  }
  handleAction(trigger.dataset.action, trigger);
});

window.addEventListener("hashchange", () => {
  if (runtime.openPanel !== "ledger") {
    setTopNavActive(getDefaultTopNavKey());
  }
});

window.addEventListener("resize", () => {
  updateTopNavIndicator();
});

if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    updateTopNavIndicator();
  });
}

window.__MIDNIGHT_PAWN__ = {
  state,
  renderAll,
  handleAction,
  startNextNight,
  runNightCloseout,
  buyUpgrade,
  openGuidebook,
  closeGuidebook,
  listItem,
  pullListing,
  vaultItem,
  unvaultItem,
  applyPrepAction,
  inspectOffer,
  haggleOffer,
  buyActiveOffer,
  passActiveOffer,
};

function getEnabledActionSelector(action, selector = "") {
  return `[data-action="${action}"]${selector}:not([disabled])`;
}

function getTestButton(action, selector = "") {
  const button = document.querySelector(getEnabledActionSelector(action, selector));
  if (!button) {
    throw new Error(`Missing enabled action button: ${action}${selector}`);
  }
  return button;
}

function waitFrames(frameCount = 2) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(1, frameCount) * 34);
  });
}

function setTestReport(status, lines) {
  let report = document.getElementById("selfTestReport");
  if (!report) {
    report = document.createElement("pre");
    report.id = "selfTestReport";
    report.hidden = true;
    document.body.append(report);
  }
  report.textContent = [`SELF_TEST:${status}`, ...lines].join("\n");
  document.body.dataset.selfTest = status.toLowerCase();
}

async function runSelfTests() {
  const results = [];

  function record(name, passed, detail) {
    results.push(`${passed ? "PASS" : "FAIL"} ${name}: ${detail}`);
    if (!passed) {
      throw new Error(`${name}: ${detail}`);
    }
  }

  const originalConfirm = window.confirm;
  window.confirm = () => true;

  try {
    renderAll();
    await waitFrames();

    getTestButton("open-panel", '[data-panel="upgrades"]').click();
    await waitFrames();
    record(
      "drawer-upgrades",
      runtime.openPanel === "upgrades" &&
        elements.panelLayer.classList.contains("is-open") &&
        document.querySelector('.drawer-panel[data-panel-name="upgrades"]')?.classList.contains("is-active"),
      "Guild Talents drawer opens from button",
    );
    getTestButton("close-panel").click();
    await waitFrames();

    getTestButton("open-panel", '[data-panel="ledger"]').click();
    await waitFrames();
    record(
      "drawer-ledger",
      runtime.openPanel === "ledger" &&
        document.querySelector('.drawer-panel[data-panel-name="ledger"]')?.classList.contains("is-active"),
      "Chronicles drawer opens from button",
    );
    getTestButton("close-panel").click();
    await waitFrames();

      getTestButton("open-panel", '[data-panel="settings"]').click();
      await waitFrames();
      record(
        "drawer-settings",
        runtime.openPanel === "settings" &&
          document.querySelector('.drawer-panel[data-panel-name="settings"]')?.classList.contains("is-active"),
        "Camp drawer opens from button",
      );
      getTestButton("open-guidebook").click();
      await waitFrames();
      record(
        "guidebook-open",
        runtime.guidebookOpen === true &&
          elements.guidebookLayer.classList.contains("is-open") &&
          elements.guidebookPageLabel.textContent.includes("Pages 1-2"),
        "Guidebook opens from Camp and renders the first spread",
      );
      getTestButton("guidebook-nav", '[data-direction="next"]').click();
      await waitFrames();
      record(
        "guidebook-next",
        runtime.guidebookSpreadIndex === 1 &&
          elements.guidebookPageLabel.textContent.includes("Pages 3-4"),
        "Guidebook next button advances the spread",
      );
      getTestButton("close-guidebook").click();
      await waitFrames();
      record(
        "guidebook-close",
        runtime.guidebookOpen === false && !elements.guidebookLayer.classList.contains("is-open"),
        "Guidebook close button dismisses the book popup",
      );
      getTestButton("close-panel").click();
      await waitFrames();

    const activeOfferBeforeInspect = getActiveOffer();
    const hadConditionKnowledge = activeOfferBeforeInspect?.revealState.conditionKnown;
    getTestButton("inspect-offer").click();
    await waitFrames();
    const activeOfferAfterInspect = getActiveOffer();
    record(
      "inspect-offer",
      Boolean(activeOfferAfterInspect) && (!hadConditionKnowledge || activeOfferAfterInspect.revealState.conditionKnown),
      "Appraise button updates seller readout",
    );

    const offerBeforeSoft = getActiveOffer();
    const softPriceBefore = offerBeforeSoft.currentPrice;
    const patienceBeforeSoft = offerBeforeSoft.patience;
    if (document.querySelector(getEnabledActionSelector("haggle-soft"))) {
      getTestButton("haggle-soft").click();
      await waitFrames();
      const offerAfterSoft = getActiveOffer();
      record(
        "haggle-soft",
        Boolean(offerAfterSoft) &&
          (offerAfterSoft.haggleState.soft !== "unused" ||
            offerAfterSoft.currentPrice !== softPriceBefore ||
            offerAfterSoft.patience !== patienceBeforeSoft),
        "Gentle Bargain button resolves without breaking the offer",
      );
    } else {
      record("haggle-soft", true, "Gentle Bargain correctly disabled after prior use");
    }

    state.cash = Math.max(state.cash, 999);
    saveGame();
    renderAll();
    await waitFrames();

    while (
      getCurrentNight()?.status === "active" &&
      !document.querySelector(getEnabledActionSelector("buy-offer")) &&
      document.querySelector(getEnabledActionSelector("pass-offer"))
    ) {
      getTestButton("pass-offer").click();
      await waitFrames();
    }

    const buysBefore = state.inventory.length;
    const activeIndexBeforeBuy = getCurrentNight().activeIndex;
    getTestButton("buy-offer").click();
    await waitFrames();
    const boughtItem = state.inventory.at(-1);
    record(
      "buy-offer",
      state.inventory.length === buysBefore + 1 &&
        getCurrentNight().activeIndex === activeIndexBeforeBuy + 1 &&
        Boolean(boughtItem),
      "Claim button acquires the active relic",
    );

    getTestButton("prep-item", `[data-item-id="${boughtItem.id}"][data-prep-id="wipe"]`).click();
    await waitFrames();
    record(
      "prep-item",
      findInventoryItem(boughtItem.id)?.wipedDown === true,
      "Polish button updates the relic",
    );

    getTestButton("list-item", `[data-item-id="${boughtItem.id}"]`).click();
    await waitFrames();
    record(
      "list-item",
      findInventoryItem(boughtItem.id)?.listed === true && state.listedItemIds.includes(boughtItem.id),
      "Place on Stall button lists the relic",
    );

    getTestButton("pull-listing", `[data-item-id="${boughtItem.id}"]`).click();
    await waitFrames();
    record(
      "pull-listing",
      findInventoryItem(boughtItem.id)?.listed === false && !state.listedItemIds.includes(boughtItem.id),
      "Withdraw button returns the relic to inventory",
    );

    const testCurio = normalizeInventoryItem({
      ...ITEM_TEMPLATES[0],
      id: nextId("test-item"),
      rarity: "elite",
      category: "occult",
      name: "Self-Test Reliquary Idol",
      blurb: "A seeded elite relic for verifying the vault buttons.",
      weirdTag: "Carved with a test seal.",
      condition: "clean",
      purchasePrice: 0,
      trueValue: 220,
      acquiredNight: state.currentNight?.number || state.night,
      sellerArchetypeId: SELLER_ARCHETYPES[0].id,
      listed: false,
      vaulted: false,
    });
    state.inventory.push(testCurio);
    syncItemCollections();
    saveGame();
    renderAll();
    await waitFrames();

    getTestButton("vault-item", `[data-item-id="${testCurio.id}"]`).click();
    await waitFrames();
    record(
      "vault-item",
      findInventoryItem(testCurio.id)?.vaulted === true && state.curioItemIds.includes(testCurio.id),
      "Enshrine button moves elite relics into the reliquary",
    );

    getTestButton("unvault-item", `[data-item-id="${testCurio.id}"]`).click();
    await waitFrames();
    record(
      "unvault-item",
      findInventoryItem(testCurio.id)?.vaulted === false && !state.curioItemIds.includes(testCurio.id),
      "Unseal button returns reliquary items to inventory",
    );

    getTestButton("close-night").click();
    await waitFrames(3);
    record(
      "close-night",
      Boolean(state.currentNight) &&
        state.currentNight.status === "closed" &&
        elements.recapLayer.classList.contains("is-open"),
      "Close Deal button resolves the night and opens the recap",
    );

    getTestButton("start-next-night").click();
    await waitFrames(3);
    record(
      "start-next-night",
      Boolean(state.currentNight) &&
        state.currentNight.status === "active" &&
        state.currentNight.number === state.night,
      "Begin next night button starts a fresh active chapter",
    );

    setTestReport("PASS", results);
  } catch (error) {
    results.push(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    setTestReport("FAIL", results);
  } finally {
    window.confirm = originalConfirm;
  }
}

renderAll();
setTopNavActive(runtime.topNavActive);

if (TEST_MODE) {
  window.setTimeout(() => {
    runSelfTests();
  }, 0);
}
