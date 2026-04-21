export type StudioReferenceGroup = {
  title: string
  detail: string
}

export type StudioReferenceTab = 'characters' | 'places' | 'lore' | 'timeline' | 'notebook'

export type StudioScene = {
  id: string
  chapterLabel: string
  title: string
  location: string
  pointOfView: string
  status: string
  targetWords: number
  synopsis: string
  initialText: string
  continuityNotes: string[]
  references: {
    characters: StudioReferenceGroup[]
    places: StudioReferenceGroup[]
    lore: StudioReferenceGroup[]
    timeline: StudioReferenceGroup[]
  }
}

export const studioProject = {
  title: 'Empire of Salt',
  subtitle: 'Private manuscript studio',
  summary:
    'A focused drafting room connected to locations, factions, rituals, law, and political history across the same story universe.',
  metrics: [
    { label: 'Scenes in draft', value: '03' },
    { label: 'Linked canon entries', value: '148' },
    { label: 'Open plot threads', value: '23' },
  ],
}

export const studioTabs: { id: StudioReferenceTab; label: string }[] = [
  { id: 'characters', label: 'Characters' },
  { id: 'places', label: 'Places' },
  { id: 'lore', label: 'Lore' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'notebook', label: 'Notebook' },
]

export const studioNotebookSeed = `Questions to resolve before the council sequence:

- Does Mira reveal the original witness seal in this chapter or save it for the harbor steps?
- The Bell Archivists need one quieter internal split before the public hearing.
- Keep the eclipse weather present in the sound design of the scene.
- Check whether the funeral rite language matches the codex entry revised in chapter five.
`

export const studioScenes: StudioScene[] = [
  {
    id: 'chapter-08-scene-01',
    chapterLabel: 'Chapter 08',
    title: 'Quiet Harbor',
    location: 'Ashline Harbour',
    pointOfView: 'Mira Sol',
    status: 'Drafting',
    targetWords: 1450,
    synopsis:
      'Mira crosses the harbor before dawn and realizes the city has already chosen a side in the charter conflict.',
    initialText: `The harbor should have been louder than this.

Before sunrise the district usually rehearsed its ordinary arguments out in the open: chains striking wood, oath clerks calling for witnesses, gulls fighting over fish offal near the quay. But this morning the sound had been pressed thin, as though the fog had laid a palm over the whole ward and asked the city to keep its secrets until noon.

Mira followed the stone edge of the water with the charter tube beneath her arm. Every shutter that remained closed felt deliberate. Every boat tied too neatly to the rail felt instructed. By the time she reached the customs bridge, she understood that silence in Ashline Harbour was never the absence of news. It was the shape news took when power had reached the district first.

At the witness post a boy in bell-grey inked the registry without looking at her name. That was wrong enough to make her stop.

"You know who I am," Mira said.

The boy set down the pen. "Everyone in the harbor knows who you are this morning."

That answer carried more fear than insolence. Mira turned toward the upper terraces where the clocktower bells waited behind their carved stone mouths. If the council meant to bury the dispute before the hearing, they had started with the oldest trick in the city: let ritual keep its posture, but drain it of honesty.`,
    continuityNotes: [
      'The harbor must already know about the charter fracture before the council summons arrives.',
      'Keep the witness registry ritual consistent with the codex entry on public oaths.',
      'The bell tower remains silent until the end of the next scene.',
    ],
    references: {
      characters: [
        {
          title: 'Mira Sol',
          detail: 'Harbor-born negotiator carrying the disputed charter and trying to prove the registry was altered.',
        },
        {
          title: 'Tarin Voss',
          detail: 'Council witness clerk whose silence hints that the Bell Archivists have already intervened.',
        },
      ],
      places: [
        {
          title: 'Ashline Harbour',
          detail: 'Ceremonial trade district where witness law is treated as public theater as much as civil procedure.',
        },
        {
          title: 'Customs Bridge',
          detail: 'Checkpoint between merchant docks and council stone, used here as the moment the political temperature becomes visible.',
        },
      ],
      lore: [
        {
          title: 'Salt Charter',
          detail: 'Foundational agreement that determines who may tax, witness, and publicly validate trade across the district.',
        },
        {
          title: 'Witness Registry',
          detail: 'Ritual-legal system requiring named observers for promises, disputes, and transfers of civic authority.',
        },
      ],
      timeline: [
        {
          title: 'Morning before the hearing',
          detail: 'This scene must occur two days before the eclipse and several hours before the council chamber sequence.',
        },
        {
          title: 'After the orchard fire revisions',
          detail: 'The citys distrust of sealed records only makes sense if the orchard archive fire is already established as recent memory.',
        },
      ],
    },
  },
  {
    id: 'chapter-08-scene-02',
    chapterLabel: 'Chapter 08',
    title: 'Council Chamber',
    location: 'Upper Council Hall',
    pointOfView: 'Mira Sol',
    status: 'Drafting',
    targetWords: 1700,
    synopsis:
      'The hearing begins under formal restraint, but every rule in the room starts bending around the altered charter.',
    initialText: `The council chamber was built to make every voice sound measured.

Even outrage arrived trimmed into civility there. Stone columns kept the air cool, and the shallow dome above the benches returned every sentence with enough dignity to make panic sound considered. Mira hated the room for that. It let frightened men hear themselves as guardians of order.

She placed the charter at the center table and waited for the registrar to acknowledge the broken seal. He did not. Instead he unfolded a fresh witness cloth, spread it carefully over the fracture, and turned the whole matter into a question of procedure.

"Before any accusation is entered," he said, "the council requests confirmation of chain custody."

That was how they meant to do it. Not by denying the document. By forcing the truth to walk through every ceremonial gate until the day itself gave out.

Mira kept one hand on the parchment.

"Chain custody is not in dispute," she said. "Authority is."

Along the eastern wall, the Bell Archivists remained so still they looked built into the chamber. On the western bench the river merchants pretended indifference badly enough to prove they were terrified. Everyone already knew the charter had been touched. The only question left was who the city would allow to say so first.`,
    continuityNotes: [
      'The registrar covers the broken seal before anyone else names it directly.',
      'Bell Archivists must stay outwardly motionless in this scene.',
      'Keep the merchants tense but not openly defiant yet.',
    ],
    references: {
      characters: [
        {
          title: 'Registrar Oren',
          detail: 'Council officer using procedural language to delay public recognition of the damaged charter.',
        },
        {
          title: 'Bell Archivists',
          detail: 'Faction responsible for ceremonial authority over sealed records and witness cloths.',
        },
      ],
      places: [
        {
          title: 'Upper Council Hall',
          detail: 'Formal civic chamber engineered to flatten emotion and convert political violence into respectable speech.',
        },
      ],
      lore: [
        {
          title: 'Witness Cloth',
          detail: 'Ceremonial covering placed over contested records until an authorized witness names the breach aloud.',
        },
        {
          title: 'Chain Custody Law',
          detail: 'Used here as a stalling tactic even though the real issue is the legitimacy of the charter seal.',
        },
      ],
      timeline: [
        {
          title: 'Council hearing week',
          detail: 'This scene must still happen before the bell silence is publicly interpreted as an accusation.',
        },
        {
          title: 'Same day as harbor crossing',
          detail: 'Keep the emotional carryover from the harbor quiet rather than resetting the tension.',
        },
      ],
    },
  },
  {
    id: 'chapter-08-scene-03',
    chapterLabel: 'Chapter 08',
    title: 'Bell Silence',
    location: 'Clocktower Ward',
    pointOfView: 'Joren Vale',
    status: 'Outline locked',
    targetWords: 1100,
    synopsis:
      'The city hears the missing bell and understands that ritual order has failed in public.',
    initialText: `Joren had lived beneath the bells long enough to know each silence by its weight.

There was the ordinary pause of mechanism, the weathered pause of bad rope, the respectful pause before a funeral toll. This was none of those. This was a silence with witnesses in it. It moved through the ward faster than sound because every market table, shrine step, and council runner understood what the missing bell implied before anyone dared say it.

By the time Joren reached the east stair, people had already turned toward the tower as if facing a verdict.

No one shouted. No one ran. Public fear in Ashline Harbour preferred posture first. But he saw the old harbor women close their ledgers. He saw the river boys leave a rope half-knotted at the quay. He saw two archivists refuse to look at one another as they crossed the square.

That was how a city confessed.

Not with a declaration. With choreography.

Joren stopped beneath the clockface and waited for the next impossible minute to arrive.`,
    continuityNotes: [
      'The bell silence becomes a citywide interpretation, not a private observation.',
      'This is the first scene from Joren point of view in chapter eight.',
      'Do not let anyone explain the silence too early; let the public choreography carry the meaning.',
    ],
    references: {
      characters: [
        {
          title: 'Joren Vale',
          detail: 'Clocktower keeper who understands the ritual weight of the bells better than the council does.',
        },
      ],
      places: [
        {
          title: 'Clocktower Ward',
          detail: 'Public heart of the harbor where bell law, ceremony, and rumor become inseparable.',
        },
      ],
      lore: [
        {
          title: 'Bell Silence',
          detail: 'A missing toll is interpreted as institutional failure only when witnessed across multiple public stations.',
        },
      ],
      timeline: [
        {
          title: 'Late afternoon, same day',
          detail: 'Happens after the council chamber stalls the hearing but before news reaches the river settlements.',
        },
      ],
    },
  },
]
