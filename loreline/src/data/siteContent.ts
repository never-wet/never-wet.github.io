export type ValuePillar = {
  sceneId: 'nexus' | 'atlas' | 'characters' | 'narrative' | 'writing'
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  featured?: boolean
}

export const valuePillars: ValuePillar[] = [
  {
    sceneId: 'nexus',
    eyebrow: 'Connected Story System',
    title: 'Build the world, the cast, the history, and the manuscript inside the same creative environment.',
    description:
      'Loreline is not a chapter machine. It is a story-universe platform where world logic, plot architecture, and the writing process are all part of the same creative fabric.',
    bullets: ['World graph and story links', 'Canon-aware manuscript', 'Planning and drafting in one ecosystem'],
    featured: true,
  },
  {
    sceneId: 'atlas',
    eyebrow: 'Worldbuilding Depth',
    title: 'Give places, cultures, systems, and history the structure they deserve.',
    description:
      'Map locations, codify magic or technology, record cultural detail, and let every part of the world stay queryable and connected instead of buried in prose.',
    bullets: ['Places, regions, and maps', 'Culture, politics, religion, and law', 'History, eras, and systemic rules'],
  },
  {
    sceneId: 'characters',
    eyebrow: 'Character Systems',
    title: 'Track who people are, what they want, and how they move through the world.',
    description:
      'Characters stay linked to their factions, relationships, histories, scenes, and transformations so the cast feels alive inside the setting.',
    bullets: ['Relationship networks', 'Arc progression and pressure points', 'World-linked character dossiers'],
  },
  {
    sceneId: 'narrative',
    eyebrow: 'Narrative Structure',
    title: 'Organize plot, chronology, and causality without flattening the mystery of the story.',
    description:
      'Plot beats, story arcs, lore reveals, and historical events remain visible as a system, so you can build sagas with real continuity discipline.',
    bullets: ['Timeline and chronology layers', 'Plot threads and turning points', 'Cause-and-effect story architecture'],
  },
  {
    sceneId: 'writing',
    eyebrow: 'Immersive Writing',
    title: 'Write inside the world instead of switching away from it.',
    description:
      'The manuscript room is focused and elegant, but it never loses access to the world that supports the scene. Context appears only when the work calls for it.',
    bullets: ['Distraction-free manuscript mode', 'Reference drawers on demand', 'World-aware drafting flow'],
  },
]

export type WorkspaceMetric = {
  label: string
  value: string
}

export type WorkspaceSupportItem = {
  title: string
  detail: string
}

export type WorkspaceView = {
  id: string
  label: string
  eyebrow: string
  title: string
  description: string
  chips: string[]
  railTitle: string
  railItems: string[]
  documentKicker: string
  documentTitle: string
  documentExcerpt: string[]
  supportTitle: string
  supportItems: WorkspaceSupportItem[]
  metrics: WorkspaceMetric[]
}

export const workspaceViews: WorkspaceView[] = [
  {
    id: 'nexus',
    label: 'Story Nexus',
    eyebrow: 'Interconnected workspace',
    title: 'See the entire story universe as a connected system, not a pile of disconnected pages.',
    description:
      'Characters connect to places, places connect to maps and factions, events connect to timeline logic, and the manuscript keeps pointing back into the same canon.',
    chips: ['Entity links', 'Plot graph', 'World-aware manuscript'],
    railTitle: 'Connected objects',
    railItems: [
      'Mira Sol -> Tide Warden archive',
      'Ashline Harbour -> Salt Charter district',
      'The Glass Orchard -> Fire of Year 342',
      'Council Hearing -> Manuscript Act II',
    ],
    documentKicker: 'Story system view',
    documentTitle: 'The Salt Charter dispute is linked to four characters, two districts, one religious rite, and the manuscript climax.',
    documentExcerpt: [
      'Instead of storing lore in isolation, the workspace makes every important object part of a relationship network. Characters carry affiliations, places carry history, and manuscript scenes inherit that context instead of forcing the writer to reconstruct it mentally every time.',
      'The result is a world that stays coherent under pressure, even when the story spans multiple regions, factions, eras, or books.',
    ],
    supportTitle: 'Connection drawer',
    supportItems: [
      {
        title: 'Plot dependency',
        detail: 'The charter riot only works if the harbor tax reforms are already present in district lore and faction policy.',
      },
      {
        title: 'Location context',
        detail: 'The eastern quay is controlled by the bell wardens, which affects who can legally witness a public oath.',
      },
      {
        title: 'Manuscript link',
        detail: 'Act II scene 04 cites the charter dispute as the political reason the council hearing becomes unavoidable.',
      },
    ],
    metrics: [
      { label: 'Linked entities', value: '148' },
      { label: 'Active plot threads', value: '23' },
      { label: 'Manuscript references', value: '41' },
    ],
  },
  {
    id: 'atlas',
    label: 'World Atlas',
    eyebrow: 'Locations, maps, and lore',
    title: 'Give the setting the weight of a real place, with geography, culture, history, and internal logic.',
    description:
      'Build regions, routes, landmarks, climates, power centers, cultural practices, and map-aware location notes without treating the world like secondary material.',
    chips: ['Maps', 'Places', 'Lore'],
    railTitle: 'Atlas index',
    railItems: ['Ashline Harbour', 'Glass Orchard', 'Sunken Chapel road', 'Salt frontier routes', 'Bell district wards'],
    documentKicker: 'Location record',
    documentTitle: 'Ashline Harbour',
    documentExcerpt: [
      'A ceremonial trade city organized around contracts, public witnesses, and a clocktower whose bells shape law as much as schedule. District identity matters here: who belongs where changes what can be traded, promised, or concealed.',
      'The harbor is not just scenery. It is a social machine tied to class, ritual, factional power, and the emotional weather of the book.',
    ],
    supportTitle: 'Atlas drawer',
    supportItems: [
      {
        title: 'Map note',
        detail: 'The tide gate route closes during eclipse weather, which changes travel time for the chapter nine pursuit.',
      },
      {
        title: 'Faction anchor',
        detail: 'The Bell Archivists claim central authority over the harbor clock, but river merchants dispute their right to regulate trade ritual.',
      },
      {
        title: 'Culture layer',
        detail: 'Witnessed promises are public performance here, not merely legal paperwork.',
      },
    ],
    metrics: [
      { label: 'Mapped places', value: '34' },
      { label: 'Culture notes', value: '12' },
      { label: 'Linked routes', value: '19' },
    ],
  },
  {
    id: 'chronicle',
    label: 'Chronicle Engine',
    eyebrow: 'Timelines and history',
    title: 'Keep mythology, politics, wars, revelations, and scene chronology inside one controlled timeline.',
    description:
      'Chronology works at multiple scales: ancient history, recent backstory, current plot beats, and custom calendars for worlds that run on their own time logic.',
    chips: ['Timeline', 'History', 'Calendars'],
    railTitle: 'Chronicle layers',
    railItems: ['Age of Lantern Kings', 'The orchard fire', 'Bell silence morning', 'Council hearing week', 'Warden descent'],
    documentKicker: 'Historical chain',
    documentTitle: 'Year 342 -> The bell silence cannot happen before the charter fracture becomes public.',
    documentExcerpt: [
      'Plot is easier to trust when the chronology is explicit. Historical scars, travel limits, faction decisions, and revelation timing can all be coordinated before the manuscript drifts into contradiction.',
      'This is where large stories stop feeling fragile. Sagas, campaigns, and multi-book arcs gain a real structural spine.',
    ],
    supportTitle: 'Continuity drawer',
    supportItems: [
      {
        title: 'Calendar logic',
        detail: 'Festival of Glass must happen two nights before the eclipse to preserve the political aftermath in act three.',
      },
      {
        title: 'Historical echo',
        detail: 'The current harbor law repeats a clause first introduced after the river mutiny seventy years earlier.',
      },
      {
        title: 'Scene timing',
        detail: 'Manuscript chapter eleven currently arrives one day too early for the funeral rites already established in the canon.',
      },
    ],
    metrics: [
      { label: 'Timeline layers', value: '05' },
      { label: 'Historical events', value: '72' },
      { label: 'Continuity alerts', value: '06' },
    ],
  },
  {
    id: 'manuscript',
    label: 'Writing Room',
    eyebrow: 'Immersive writing experience',
    title: 'Write in a focused manuscript room that still knows the world around the scene.',
    description:
      'The writing interface stays quiet and readable, but characters, place logic, lore, and timeline context remain one deliberate action away instead of being locked in another tool.',
    chips: ['Focused editor', 'Context drawer', 'Story-aware draft'],
    railTitle: 'Scene stack',
    railItems: ['Act II - Charter fracture', 'Chapter 08 - Quiet harbor', 'Scene 03 - Oath ledger', 'Scene 04 - Council summons'],
    documentKicker: 'Manuscript mode',
    documentTitle: 'The bell did not ring, and that was how the whole city understood the world had slipped.',
    documentExcerpt: [
      "The manuscript is not the product's lonely center. It is the place where every earlier decision finally starts to matter. World notes, factions, and character pressure do not crowd the page, but they remain available the instant the scene needs them.",
      'That creates a writing experience that feels calm on the surface and deep underneath it.',
    ],
    supportTitle: 'Writing drawer',
    supportItems: [
      {
        title: 'Scene support',
        detail: 'Pull character motives, location rules, and unresolved plot threads into the scene without leaving manuscript mode.',
      },
      {
        title: 'Lore reminder',
        detail: 'The salt charter language in this chapter must stay consistent with the ritual definitions stored in the codex.',
      },
      {
        title: 'Draft discipline',
        detail: 'The room stays low-friction first; secondary controls remain tucked away until the writer asks for them.',
      },
    ],
    metrics: [
      { label: 'Linked scene references', value: '12' },
      { label: 'Context actions hidden by default', value: '87%' },
      { label: 'Average uninterrupted focus block', value: '52 min' },
    ],
  },
]

export type ModuleCard = {
  eyebrow: string
  title: string
  description: string
  points: string[]
}

export const moduleCards: ModuleCard[] = [
  {
    eyebrow: 'Characters',
    title: 'Track motives, relationships, wounds, loyalties, and arcs.',
    description:
      'Character work becomes part of the same world logic, not a disconnected spreadsheet of names and traits.',
    points: ['Relationship networks', 'Arc tracking', 'Faction and manuscript links'],
  },
  {
    eyebrow: 'Locations and Maps',
    title: 'Build real places with geography, routes, districts, and atmosphere.',
    description:
      'Locations are more than folders. They hold map logic, travel implications, setting detail, and cultural context.',
    points: ['Regions and landmarks', 'Travel routes', 'Map-aware world notes'],
  },
  {
    eyebrow: 'Lore and Codex',
    title: 'Organize history, belief systems, customs, myths, and canon.',
    description:
      'A codex for serious worldbuilders: interconnected, searchable, and tied back into scenes, people, and events.',
    points: ['History and mythology', 'Cultural records', 'Canon references'],
  },
  {
    eyebrow: 'Timelines and History',
    title: 'Coordinate eras, revelations, scenes, campaigns, and cause-and-effect.',
    description: 'Keep epic stories coherent across decades, dynasties, wars, or multiple books.',
    points: ['Historical layers', 'Scene chronology', 'Continuity control'],
  },
  {
    eyebrow: 'Systems',
    title: 'Define magic, technology, religion, politics, law, and power structures.',
    description:
      'Formalize the rules that make the world believable and let those rules influence plot and manuscript decisions.',
    points: ['Magic or technology frameworks', 'Institutions and governance', 'Rule-driven world logic'],
  },
  {
    eyebrow: 'Factions and Cultures',
    title: 'Give societies, orders, families, and movements real structure.',
    description:
      'Track alliances, rivalries, values, rituals, and social tensions so conflict grows from the world itself.',
    points: ['Political blocs', 'Cultural identity', 'Conflict ecosystems'],
  },
  {
    eyebrow: 'Plot Threads',
    title: 'Shape arcs, mysteries, turning points, and narrative pressure.',
    description:
      'Plot is treated as one more connected layer of the world, not a separate outline floating above it.',
    points: ['Arc architecture', 'Mystery and reveal control', 'Thread-to-scene relationships'],
  },
]

export type CreativeSystemId = 'characters' | 'moodboard' | 'wiki' | 'ambience' | 'plots' | 'calendar'

export type CreativeSystem = {
  id: CreativeSystemId
  eyebrow: string
  title: string
  description: string
  highlights: string[]
  span: 'tall' | 'wide' | 'stack' | 'compact' | 'feature'
}

export const creativeSystems: CreativeSystem[] = [
  {
    id: 'characters',
    eyebrow: 'Character Architecture',
    title: 'Build real people with pressure, history, contradiction, and connection.',
    description:
      'Track motives, wounds, habits, loyalties, and relational tension so the cast feels psychologically structured instead of loosely sketched.',
    highlights: ['Interpersonal links', 'Arc pressure tracking', 'Faction-aware character dossiers'],
    span: 'tall',
  },
  {
    id: 'moodboard',
    eyebrow: 'Aesthetic Boards',
    title: 'Compose the atmosphere of the world before the scene even opens.',
    description:
      'Collect visual motifs, material language, color anchors, and tonal references so the setting carries a deliberate emotional texture.',
    highlights: ['Mood frames and references', 'Palette and symbol anchors', 'Scene-tone boards'],
    span: 'wide',
  },
  {
    id: 'wiki',
    eyebrow: 'Personal Codex',
    title: 'Keep a private wiki for history, lore, culture, and canon.',
    description:
      'Your world bible stays searchable, layered, and linked back into factions, places, timelines, and manuscript scenes.',
    highlights: ['History and culture shelves', 'Lore categories', 'Searchable canon memory'],
    span: 'stack',
  },
  {
    id: 'ambience',
    eyebrow: 'Studio Atmosphere',
    title: 'Shape a writing room that feels like home for the world you are making.',
    description:
      'Ambient cues, theme states, and ritual-like workspace touches help the product feel personal without turning it into clutter.',
    highlights: ['Ambient player states', 'Theme accents', 'Private ritual space'],
    span: 'compact',
  },
  {
    id: 'plots',
    eyebrow: 'Plot Weaving',
    title: 'Thread intricate plots across scenes, revelations, and long arcs.',
    description:
      'Organize plot cards, causality, and character involvement so complicated sagas remain legible without flattening their mystery.',
    highlights: ['Scene-to-scene linkage', 'Causal chains', 'Multi-book thread control'],
    span: 'feature',
  },
  {
    id: 'calendar',
    eyebrow: 'Custom Calendars',
    title: 'Let the world run on its own months, moons, weather, and holidays.',
    description:
      'Coordinate custom time systems and ritual dates so the world keeps its own rhythm instead of borrowing a generic calendar.',
    highlights: ['World-specific months', 'Moon and weather states', 'Holiday and rite scheduling'],
    span: 'compact',
  },
]

export type WritingSignal = {
  title: string
  description: string
}

export const writingSignals: WritingSignal[] = [
  {
    title: 'Focused manuscript room',
    description: 'A calm editorial writing surface with readable line length, restrained controls, and minimal interface noise.',
  },
  {
    title: 'Context on demand',
    description: 'Open characters, lore, places, systems, or timeline context only when the scene calls for them.',
  },
  {
    title: 'World-aware drafting',
    description: 'The manuscript does not sit outside the worldbuilding process. It grows directly out of the same connected system.',
  },
]

export type OwnershipPoint = {
  title: string
  description: string
}

export const ownershipPoints: OwnershipPoint[] = [
  {
    title: 'Private creative work',
    description:
      'The experience should feel like a serious place for private making, not a content treadmill or prompt casino.',
  },
  {
    title: 'Creator-owned process',
    description:
      'Your world, your canon, your structure, your manuscript. The product serves the creator instead of trying to replace the act of creation.',
  },
  {
    title: 'Focused by design',
    description:
      'No noisy feed, no shallow gamification, and no clutter-first dashboard energy. The software stays disciplined so the work can stay deep.',
  },
]

export const ownershipQuote = {
  quote:
    'I learned this, at least, by my experiment: that if one advances confidently in the direction of his dreams, and endeavors to live the life which he has imagined, he will meet with a success unexpected in common hours.',
  caption: 'Henry David Thoreau, Walden (1854)',
  sourceLabel: 'Public-domain source',
  sourceUrl: 'https://gutenberg.org/files/205/205-h/205-h.htm',
}

export type DifferenceSignal = {
  id: string
  label: string
}

export const differenceSignals: DifferenceSignal[] = [
  { id: 'canon', label: 'Creator-owned canon' },
  { id: 'private', label: 'Private creative work' },
  { id: 'world', label: 'World + manuscript linked' },
  { id: 'maps', label: 'Places, maps, and systems' },
  { id: 'timeline', label: 'Timeline logic' },
  { id: 'character', label: 'Character webs' },
  { id: 'calm', label: 'Calm interface' },
  { id: 'no-prompt', label: 'No prompt-casino energy' },
]

export type DifferencePoint = {
  negative: string
  positive: string
}

export const differencePoints: DifferencePoint[] = [
  {
    negative: 'Not just an AI text generator chasing chapter output.',
    positive: 'A unified storytelling ecosystem for worldbuilding, structure, and manuscript creation.',
  },
  {
    negative: 'Not just a notes app or wiki filled with isolated pages.',
    positive: 'An interconnected workspace where lore, characters, places, timelines, and scenes reference each other deliberately.',
  },
  {
    negative: 'Not just a chapter editor with a few side panels.',
    positive: 'A full story development environment where the manuscript grows from inside the world itself.',
  },
  {
    negative: 'Not just a graph of disconnected concepts.',
    positive: 'A structured creative system designed for usable depth, narrative clarity, and worldbuilding discipline.',
  },
]

export type ComparisonColumnId = 'loreline' | 'aiWriter' | 'notesWiki' | 'plainEditor' | 'generalWorkspace'

export type ComparisonColumn = {
  id: ComparisonColumnId
  label: string
  featured?: boolean
}

export type ComparisonCell = {
  kind: 'deep' | 'partial' | 'light' | 'manual' | 'no'
  label: string
}

export type ComparisonRow = {
  label: string
  values: Record<ComparisonColumnId, ComparisonCell>
}

export const comparisonColumns: ComparisonColumn[] = [
  { id: 'loreline', label: 'Loreline', featured: true },
  { id: 'aiWriter', label: 'AI chapter tool' },
  { id: 'notesWiki', label: 'Notes / wiki app' },
  { id: 'plainEditor', label: 'Plain manuscript editor' },
  { id: 'generalWorkspace', label: 'General workspace' },
]

export const comparisonRows: ComparisonRow[] = [
  {
    label: 'World + manuscript in one system',
    values: {
      loreline: { kind: 'deep', label: 'Deep' },
      aiWriter: { kind: 'light', label: 'Surface' },
      notesWiki: { kind: 'partial', label: 'Partial' },
      plainEditor: { kind: 'no', label: 'No' },
      generalWorkspace: { kind: 'partial', label: 'Partial' },
    },
  },
  {
    label: 'Characters, factions, and relationship webs',
    values: {
      loreline: { kind: 'deep', label: 'Deep' },
      aiWriter: { kind: 'no', label: 'No' },
      notesWiki: { kind: 'manual', label: 'Manual' },
      plainEditor: { kind: 'no', label: 'No' },
      generalWorkspace: { kind: 'partial', label: 'Partial' },
    },
  },
  {
    label: 'Places, maps, and world geography',
    values: {
      loreline: { kind: 'deep', label: 'Deep' },
      aiWriter: { kind: 'no', label: 'No' },
      notesWiki: { kind: 'partial', label: 'Partial' },
      plainEditor: { kind: 'no', label: 'No' },
      generalWorkspace: { kind: 'light', label: 'Light' },
    },
  },
  {
    label: 'Timeline logic and custom calendars',
    values: {
      loreline: { kind: 'deep', label: 'Deep' },
      aiWriter: { kind: 'no', label: 'No' },
      notesWiki: { kind: 'manual', label: 'Manual' },
      plainEditor: { kind: 'no', label: 'No' },
      generalWorkspace: { kind: 'partial', label: 'Partial' },
    },
  },
  {
    label: 'Plot threads across long arcs',
    values: {
      loreline: { kind: 'deep', label: 'Deep' },
      aiWriter: { kind: 'light', label: 'Surface' },
      notesWiki: { kind: 'manual', label: 'Manual' },
      plainEditor: { kind: 'light', label: 'Light' },
      generalWorkspace: { kind: 'partial', label: 'Partial' },
    },
  },
  {
    label: 'Focused writing room with hidden context',
    values: {
      loreline: { kind: 'deep', label: 'Deep' },
      aiWriter: { kind: 'light', label: 'Light' },
      notesWiki: { kind: 'no', label: 'No' },
      plainEditor: { kind: 'partial', label: 'Partial' },
      generalWorkspace: { kind: 'no', label: 'No' },
    },
  },
  {
    label: 'Creative support systems around the draft',
    values: {
      loreline: { kind: 'deep', label: 'Deep' },
      aiWriter: { kind: 'no', label: 'No' },
      notesWiki: { kind: 'light', label: 'Light' },
      plainEditor: { kind: 'no', label: 'No' },
      generalWorkspace: { kind: 'light', label: 'Light' },
    },
  },
  {
    label: 'Creator-first private workflow',
    values: {
      loreline: { kind: 'deep', label: 'High' },
      aiWriter: { kind: 'light', label: 'Low' },
      notesWiki: { kind: 'partial', label: 'Medium' },
      plainEditor: { kind: 'partial', label: 'Medium' },
      generalWorkspace: { kind: 'light', label: 'Low' },
    },
  },
]

export const finalChecklist: string[] = [
  'Worldbuilding depth across maps, lore, factions, systems, and timelines',
  'Interconnected manuscript, canon, and plot architecture',
  'Private, focused, premium creative environment for serious storytellers',
]
