import type { DialogueProfile } from "../../memory/types";

export const dialogueProfiles: DialogueProfile[] = [
  {
    npcId: "system_intro",
    variants: [
      {
        id: "opening_intro",
        entryPageId: "intro_1",
        pages: [
          {
            id: "intro_1",
            speakerId: "system_intro",
            speakerName: "Narrator",
            text: [
              "The lantern roads of the Cinder Reach are failing one by one.",
              "Tonight, your route into Emberwharf ends with smoke on the Greenway and the sound of a city bell gone thin.",
            ],
            nextPageId: "intro_2",
          },
          {
            id: "intro_2",
            speakerId: "system_intro",
            speakerName: "Narrator",
            text: [
              "Move with WASD or the arrow keys. Attack with J, dodge with Space, cast Lantern Spark with K, interact with E, and open the pause menu with Esc.",
              "Start by speaking with Warden Sable in the Guildhall.",
            ],
            actions: [{ type: "setFlag", key: "story.intro_seen", value: true }],
            choices: [{ id: "begin", label: "Step into Emberwharf", close: true }],
          },
        ],
      },
    ],
  },
  {
    npcId: "sable_voss",
    variants: [
      {
        id: "embers_turnin",
        conditions: [{ type: "quest", key: "main_embers_at_gate", state: "turnInReady" }],
        entryPageId: "sable_done",
        pages: [
          {
            id: "sable_done",
            speakerId: "sable_voss",
            speakerName: "Sable Voss",
            text: [
              "That should buy the road a few calm nights. More important, it proves you can keep moving when blades come out.",
              "Take this seal. Sunglade will listen once they know you're carrying the oath.",
            ],
            actions: [{ type: "completeQuest", id: "main_embers_at_gate" }],
            choices: [{ id: "accept", label: "I'll head for Sunglade.", close: true }],
          },
        ],
      },
      {
        id: "embers_active",
        conditions: [{ type: "quest", key: "main_embers_at_gate", state: "active" }],
        entryPageId: "sable_active",
        pages: [
          {
            id: "sable_active",
            speakerId: "sable_voss",
            speakerName: "Sable Voss",
            text: [
              "Bandits favor the old road's bends and broken markers. Keep your feet under you and don't chase one into another.",
              "Clear three of them, then report back.",
            ],
            choices: [{ id: "leave", label: "Back to the road.", close: true }],
          },
        ],
      },
      {
        id: "embers_offer",
        conditions: [
          { type: "quest", key: "main_embers_at_gate", state: "active", not: true },
          { type: "quest", key: "main_embers_at_gate", state: "completed", not: true },
        ],
        entryPageId: "sable_offer",
        pages: [
          {
            id: "sable_offer",
            speakerId: "sable_voss",
            speakerName: "Sable Voss",
            text: [
              "You're the courier Mara mentioned. Good. The Greenway is bleeding oil and patience.",
              "Bandits have been cutting carriers off before the city turn. If you can move and fight, I can use you.",
            ],
            choices: [
              { id: "take_job", label: "I'll clear the road.", nextPageId: "sable_accept" },
              { id: "decline", label: "Not yet.", close: true },
            ],
          },
          {
            id: "sable_accept",
            speakerId: "sable_voss",
            speakerName: "Sable Voss",
            text: [
              "Then welcome to the Lantern Oath. Thin the cinder bandits on the old road and report back.",
              "Keep moving. Standing still is how the Reach eats people.",
            ],
            actions: [{ type: "startQuest", id: "main_embers_at_gate" }],
            choices: [{ id: "go", label: "I'm on it.", close: true }],
          },
        ],
      },
      {
        id: "post_embers",
        conditions: [{ type: "quest", key: "main_embers_at_gate", state: "completed" }],
        entryPageId: "sable_after",
        pages: [
          {
            id: "sable_after",
            speakerId: "sable_voss",
            speakerName: "Sable Voss",
            text: [
              "Sunglade's archive bell has been off-tone for a week. If the city cannot keep its cores lit, the whole Reach is in trouble.",
            ],
            choices: [{ id: "close", label: "I'll remember that.", close: true }],
          },
        ],
      },
    ],
  },
  {
    npcId: "mara_ashdown",
    variants: [
      {
        id: "final_turnin",
        conditions: [{ type: "quest", key: "main_last_hearth", state: "turnInReady" }],
        entryPageId: "mara_final_done",
        pages: [
          {
            id: "mara_final_done",
            speakerId: "mara_ashdown",
            speakerName: "Mara Ashdown",
            text: [
              "You brought the hearth back. Look at the brazier. It hasn't burned that clean in years.",
              "The Reach will remember tonight by the roads it gets to keep.",
            ],
            actions: [{ type: "completeQuest", id: "main_last_hearth" }],
            choices: [{ id: "close", label: "The oath holds.", close: true }],
          },
        ],
      },
      {
        id: "final_active",
        conditions: [{ type: "quest", key: "main_last_hearth", state: "active" }],
        entryPageId: "mara_final_active",
        pages: [
          {
            id: "mara_final_active",
            speakerId: "mara_ashdown",
            speakerName: "Mara Ashdown",
            text: [
              "Glassroot won't give its heart back for free. Once you're below, dodge first and strike second.",
              "Bring the Sun Shard home.",
            ],
            choices: [{ id: "close", label: "I'll return with it.", close: true }],
          },
        ],
      },
      {
        id: "final_offer",
        conditions: [
          { type: "quest", key: "main_open_the_roots", state: "completed" },
          { type: "quest", key: "main_last_hearth", state: "active", not: true },
          { type: "quest", key: "main_last_hearth", state: "completed", not: true },
        ],
        entryPageId: "mara_final_offer",
        pages: [
          {
            id: "mara_final_offer",
            speakerId: "mara_ashdown",
            speakerName: "Mara Ashdown",
            text: [
              "Lyra got the seal to open, but opening a door isn't the same thing as surviving what's behind it.",
              "Glassroot took good couriers long before it took lantern cores. I won't lie to you about that.",
            ],
            choices: [
              { id: "accept", label: "I'll bring the light back.", nextPageId: "mara_final_accept" },
              { id: "wait", label: "I need a little time.", close: true },
            ],
          },
          {
            id: "mara_final_accept",
            speakerId: "mara_ashdown",
            speakerName: "Mara Ashdown",
            text: [
              "Good. Then take the road north, keep your dodge ready, and don't get greedy in close.",
              "The hearth under Glassroot has waited this long. It can wait one more steady breath.",
            ],
            actions: [{ type: "startQuest", id: "main_last_hearth" }],
            choices: [{ id: "close", label: "I'm going.", close: true }],
          },
        ],
      },
      {
        id: "evening_post_turnin",
        conditions: [{ type: "quest", key: "side_evening_post", state: "turnInReady" }],
        entryPageId: "mara_post_done",
        pages: [
          {
            id: "mara_post_done",
            speakerId: "mara_ashdown",
            speakerName: "Mara Ashdown",
            text: [
              "On time. That's the difference between a runner and a route-keeper.",
              "Keep at it and the roads start trusting you back.",
            ],
            actions: [{ type: "completeQuest", id: "side_evening_post" }],
            choices: [{ id: "close", label: "Another delivery made.", close: true }],
          },
        ],
      },
      {
        id: "evening_post_active",
        conditions: [{ type: "quest", key: "side_evening_post", state: "active" }],
        entryPageId: "mara_post_active",
        pages: [
          {
            id: "mara_post_active",
            speakerId: "mara_ashdown",
            speakerName: "Mara Ashdown",
            text: [
              "Captain Hale needs that post before dusk. Don't let the road make you late.",
            ],
            choices: [{ id: "close", label: "I'll move.", close: true }],
          },
        ],
      },
      {
        id: "evening_post_offer",
        conditions: [
          { type: "quest", key: "main_bells_of_sunglade", state: "completed" },
          { type: "quest", key: "side_evening_post", state: "active", not: true },
          { type: "quest", key: "side_evening_post", state: "completed", not: true },
        ],
        entryPageId: "mara_post_offer",
        pages: [
          {
            id: "mara_post_offer",
            speakerId: "mara_ashdown",
            speakerName: "Mara Ashdown",
            text: [
              "You've got city feet now, so here's a proper dusk run.",
              "Hale needs this evening post before the patrol turns. Want the route?",
            ],
            choices: [
              {
                id: "accept",
                label: "Hand it over.",
                actions: [
                  { type: "startQuest", id: "side_evening_post" },
                  { type: "grantItem", id: "sealed_dispatch", amount: 1 },
                ],
                close: true,
              },
              { id: "later", label: "Another time.", close: true },
            ],
          },
        ],
      },
      {
        id: "courier_default",
        entryPageId: "mara_default",
        pages: [
          {
            id: "mara_default",
            speakerId: "mara_ashdown",
            speakerName: "Mara Ashdown",
            text: [
              "Routes aren't won by the strongest blade. They're won by knowing when to cut, when to dodge, and when to keep running.",
              "Need work or advice?",
            ],
            choices: [
              {
                id: "job",
                label: "I want a courier shift.",
                actions: [{ type: "openJob", id: "courier" }],
                close: true,
              },
              { id: "advice", label: "Any route advice?", nextPageId: "mara_advice" },
              { id: "leave", label: "Just checking in.", close: true },
            ],
          },
          {
            id: "mara_advice",
            speakerId: "mara_ashdown",
            speakerName: "Mara Ashdown",
            text: [
              "If an enemy winds up, don't finish your swing out of pride. Dodge through the danger, then punish the recovery.",
              "Road fighters live by timing, not stubbornness.",
            ],
            choices: [{ id: "close", label: "That's useful.", close: true }],
          },
        ],
      },
    ],
  },
  {
    npcId: "lyra_quill",
    variants: [
      {
        id: "open_roots_turnin",
        conditions: [{ type: "quest", key: "main_open_the_roots", state: "turnInReady" }],
        entryPageId: "lyra_roots_done",
        pages: [
          {
            id: "lyra_roots_done",
            speakerId: "lyra_quill",
            speakerName: "Lyra Quill",
            text: [
              "The script holds, the ore holds, and for one rare afternoon so do my nerves.",
              "Take the lantern blade. If the seal opens, you'll need steel as well as light.",
            ],
            actions: [{ type: "completeQuest", id: "main_open_the_roots" }],
            choices: [{ id: "close", label: "I'll be ready.", close: true }],
          },
        ],
      },
      {
        id: "open_roots_active",
        conditions: [{ type: "quest", key: "main_open_the_roots", state: "active" }],
        entryPageId: "lyra_roots_active",
        pages: [
          {
            id: "lyra_roots_active",
            speakerId: "lyra_quill",
            speakerName: "Lyra Quill",
            text: [
              "I need a ruin rubbing and fresh glow ore. The old seal requires both memory and heat.",
            ],
            choices: [{ id: "close", label: "I'll gather them.", close: true }],
          },
        ],
      },
      {
        id: "open_roots_offer",
        conditions: [
          { type: "quest", key: "main_bells_of_sunglade", state: "completed" },
          { type: "quest", key: "main_open_the_roots", state: "active", not: true },
          { type: "quest", key: "main_open_the_roots", state: "completed", not: true },
        ],
        entryPageId: "lyra_roots_offer",
        pages: [
          {
            id: "lyra_roots_offer",
            speakerId: "lyra_quill",
            speakerName: "Lyra Quill",
            text: [
              "The bell failures and the stolen cores point to one place: Glassroot.",
              "If I can open the seal road, you can reach the heart beneath it. But I need proper materials first.",
            ],
            choices: [
              { id: "accept", label: "Tell me what you need.", nextPageId: "lyra_roots_accept" },
              { id: "later", label: "I need a moment.", close: true },
            ],
          },
          {
            id: "lyra_roots_accept",
            speakerId: "lyra_quill",
            speakerName: "Lyra Quill",
            text: [
              "Bring me one archive rubbing from Glassroot and three pieces of fresh glow ore from Ridgewatch.",
              "Old words unlock old doors, but only if they are heated with living light.",
            ],
            actions: [{ type: "startQuest", id: "main_open_the_roots" }],
            choices: [{ id: "close", label: "I'll return with both.", close: true }],
          },
        ],
      },
      {
        id: "bells_turnin",
        conditions: [{ type: "quest", key: "main_bells_of_sunglade", state: "turnInReady" }],
        entryPageId: "lyra_bells_done",
        pages: [
          {
            id: "lyra_bells_done",
            speakerId: "lyra_quill",
            speakerName: "Lyra Quill",
            text: [
              "Then Hale confirmed it as well. The city cores weren't merely failing; they were being drained.",
              "You're exactly the sort of trouble I needed to meet today.",
            ],
            actions: [{ type: "completeQuest", id: "main_bells_of_sunglade" }],
            choices: [{ id: "close", label: "What comes next?", close: true }],
          },
        ],
      },
      {
        id: "bells_active",
        conditions: [{ type: "quest", key: "main_bells_of_sunglade", state: "active" }],
        entryPageId: "lyra_bells_active",
        pages: [
          {
            id: "lyra_bells_active",
            speakerId: "lyra_quill",
            speakerName: "Lyra Quill",
            text: [
              "Captain Hale has the patrol reports I need. Speak with him before the afternoon bell.",
            ],
            choices: [{ id: "close", label: "I'll find him.", close: true }],
          },
        ],
      },
      {
        id: "bells_offer",
        conditions: [
          { type: "quest", key: "main_embers_at_gate", state: "completed" },
          { type: "quest", key: "main_bells_of_sunglade", state: "active", not: true },
          { type: "quest", key: "main_bells_of_sunglade", state: "completed", not: true },
        ],
        entryPageId: "lyra_bells_offer",
        pages: [
          {
            id: "lyra_bells_offer",
            speakerId: "lyra_quill",
            speakerName: "Lyra Quill",
            text: [
              "So the road warden finally sent someone who can move faster than paperwork.",
              "The archive bell is dimming, and I suspect stolen lantern cores are feeding something below the Reach.",
            ],
            choices: [
              { id: "accept", label: "I can investigate.", nextPageId: "lyra_bells_accept" },
              { id: "later", label: "Not right this second.", close: true },
            ],
          },
          {
            id: "lyra_bells_accept",
            speakerId: "lyra_quill",
            speakerName: "Lyra Quill",
            text: [
              "Then begin by speaking with Captain Hale. His patrols saw who kept slipping away from the lantern wagons.",
            ],
            actions: [{ type: "startQuest", id: "main_bells_of_sunglade" }],
            choices: [{ id: "close", label: "I'll track him down.", close: true }],
          },
        ],
      },
      {
        id: "rubble_turnin",
        conditions: [{ type: "quest", key: "side_rubble_rubbings", state: "turnInReady" }],
        entryPageId: "lyra_rubble_done",
        pages: [
          {
            id: "lyra_rubble_done",
            speakerId: "lyra_quill",
            speakerName: "Lyra Quill",
            text: [
              "Perfect. Duplicate copies survive where single records die.",
              "Take this tome. If the ruins answer with force, answer in kind.",
            ],
            actions: [{ type: "completeQuest", id: "side_rubble_rubbings" }],
            choices: [{ id: "close", label: "Happy to help.", close: true }],
          },
        ],
      },
      {
        id: "rubble_offer",
        conditions: [
          { type: "quest", key: "main_bells_of_sunglade", state: "completed" },
          { type: "quest", key: "side_rubble_rubbings", state: "active", not: true },
          { type: "quest", key: "side_rubble_rubbings", state: "completed", not: true },
        ],
        entryPageId: "lyra_rubble_offer",
        pages: [
          {
            id: "lyra_rubble_offer",
            speakerId: "lyra_quill",
            speakerName: "Lyra Quill",
            text: [
              "If you return to Glassroot, bring me extra rubbings. One seal copy is none; two is a chance.",
            ],
            choices: [
              { id: "accept", label: "I'll collect them.", actions: [{ type: "startQuest", id: "side_rubble_rubbings" }], close: true },
              { id: "later", label: "Another run later.", close: true },
            ],
          },
        ],
      },
      {
        id: "scribe_default",
        entryPageId: "lyra_default",
        pages: [
          {
            id: "lyra_default",
            speakerId: "lyra_quill",
            speakerName: "Lyra Quill",
            text: [
              "The Reach forgets quickly when people are hungry and afraid. The archive exists so the roads do not lose their memory.",
            ],
            choices: [
              { id: "job", label: "Any scribe work?", actions: [{ type: "openJob", id: "scribe" }], close: true },
              { id: "close", label: "I'll keep that in mind.", close: true },
            ],
          },
        ],
      },
    ],
  },
  {
    npcId: "captain_hale",
    variants: [
      {
        id: "road_warrant_turnin",
        conditions: [{ type: "quest", key: "side_road_warrant", state: "turnInReady" }],
        entryPageId: "hale_warrant_done",
        pages: [
          {
            id: "hale_warrant_done",
            speakerId: "captain_hale",
            speakerName: "Captain Hale",
            text: [
              "That's enough cleared road to convince the council the patrol isn't dead on its feet yet.",
              "Take the jerkin. Better on you than on a peg.",
            ],
            actions: [{ type: "completeQuest", id: "side_road_warrant" }],
            choices: [{ id: "close", label: "Road's a little safer.", close: true }],
          },
        ],
      },
      {
        id: "road_warrant_offer",
        conditions: [
          { type: "quest", key: "main_bells_of_sunglade", state: "completed" },
          { type: "quest", key: "side_road_warrant", state: "active", not: true },
          { type: "quest", key: "side_road_warrant", state: "completed", not: true },
        ],
        entryPageId: "hale_warrant_offer",
        pages: [
          {
            id: "hale_warrant_offer",
            speakerId: "captain_hale",
            speakerName: "Captain Hale",
            text: [
              "You've got a habit of returning alive. I appreciate habits like that.",
              "If you can drive off five more bandits, I can file a road warrant worth something.",
            ],
            choices: [
              { id: "accept", label: "I'll do it.", actions: [{ type: "startQuest", id: "side_road_warrant" }], close: true },
              { id: "later", label: "Maybe later.", close: true },
            ],
          },
        ],
      },
      {
        id: "bells_progress",
        conditions: [{ type: "quest", key: "main_bells_of_sunglade", state: "active" }],
        entryPageId: "hale_main",
        pages: [
          {
            id: "hale_main",
            speakerId: "captain_hale",
            speakerName: "Captain Hale",
            text: [
              "You're Lyra's runner? Fine. My scouts saw stripped lantern wagons headed toward Glassroot by way of the old seal road.",
              "Whoever's behind it knows the city routes better than they should.",
            ],
            choices: [{ id: "close", label: "That's enough to report.", close: true }],
          },
        ],
      },
      {
        id: "guard_default",
        entryPageId: "hale_default",
        pages: [
          {
            id: "hale_default",
            speakerId: "captain_hale",
            speakerName: "Captain Hale",
            text: [
              "A fighter who can dodge is worth two who only know how to swing. What do you need?",
            ],
            choices: [
              { id: "job", label: "Any patrol work?", actions: [{ type: "openJob", id: "guard" }], close: true },
              { id: "close", label: "Just passing through.", close: true },
            ],
          },
        ],
      },
    ],
  },
  {
    npcId: "brann_tul",
    variants: [
      {
        id: "smith_turnin",
        conditions: [{ type: "quest", key: "side_smithing_stock", state: "turnInReady" }],
        entryPageId: "brann_done",
        pages: [
          {
            id: "brann_done",
            speakerId: "brann_tul",
            speakerName: "Brann Tul",
            text: [
              "Ore with living color and a shard that still rings. Good. I can make something honest with this.",
              "Take the spear. Reach is too wide for short weapons all the time.",
            ],
            actions: [{ type: "completeQuest", id: "side_smithing_stock" }],
            choices: [{ id: "close", label: "Appreciated.", close: true }],
          },
        ],
      },
      {
        id: "smith_offer",
        conditions: [
          { type: "quest", key: "main_bells_of_sunglade", state: "completed" },
          { type: "quest", key: "side_smithing_stock", state: "active", not: true },
          { type: "quest", key: "side_smithing_stock", state: "completed", not: true },
        ],
        entryPageId: "brann_offer",
        pages: [
          {
            id: "brann_offer",
            speakerId: "brann_tul",
            speakerName: "Brann Tul",
            text: [
              "If you're going after whoever is feeding Glassroot, don't do it with junk steel.",
              "Bring me ore and one clean shard from the ruins. I'll forge you something worth carrying.",
            ],
            choices: [
              { id: "accept", label: "I'll fetch them.", actions: [{ type: "startQuest", id: "side_smithing_stock" }], close: true },
              { id: "later", label: "Later.", close: true },
            ],
          },
        ],
      },
      {
        id: "brann_default",
        entryPageId: "brann_default_page",
        pages: [
          {
            id: "brann_default_page",
            speakerId: "brann_tul",
            speakerName: "Brann Tul",
            text: [
              "Good steel and good timing solve more trouble than speeches do.",
            ],
            choices: [
              { id: "shop", label: "Show me your wares.", actions: [{ type: "openShop", id: "forgehouse_shop" }], close: true },
              { id: "job", label: "Need a forge runner?", actions: [{ type: "openJob", id: "smith" }], close: true },
              { id: "close", label: "That's all.", close: true },
            ],
          },
        ],
      },
    ],
  },
  {
    npcId: "nessa_reed",
    variants: [
      {
        id: "herbal_turnin",
        conditions: [{ type: "quest", key: "side_herbal_night", state: "turnInReady" }],
        entryPageId: "nessa_done",
        pages: [
          {
            id: "nessa_done",
            speakerId: "nessa_reed",
            speakerName: "Nessa Reed",
            text: [
              "Fresh enough to use, and that's a mercy. Here, take a pair of tonics before somebody else needs them first.",
            ],
            actions: [{ type: "completeQuest", id: "side_herbal_night" }],
            choices: [{ id: "close", label: "Take care.", close: true }],
          },
        ],
      },
      {
        id: "herbal_offer",
        conditions: [
          { type: "quest", key: "side_herbal_night", state: "active", not: true },
          { type: "quest", key: "side_herbal_night", state: "completed", not: true },
        ],
        entryPageId: "nessa_offer",
        pages: [
          {
            id: "nessa_offer",
            speakerId: "nessa_reed",
            speakerName: "Nessa Reed",
            text: [
              "The evening damp is turning every cough in town ugly. I could use help gathering reedmint before nightfall.",
            ],
            choices: [
              { id: "accept", label: "I'll gather it.", actions: [{ type: "startQuest", id: "side_herbal_night" }], close: true },
              { id: "later", label: "When I can.", close: true },
            ],
          },
        ],
      },
      {
        id: "nessa_default",
        entryPageId: "nessa_default_page",
        pages: [
          {
            id: "nessa_default_page",
            speakerId: "nessa_reed",
            speakerName: "Nessa Reed",
            text: [
              "Road work bruises the body. Fear bruises the rest of a person.",
            ],
            choices: [
              { id: "shop", label: "Show me remedies.", actions: [{ type: "openShop", id: "apothecary_shop" }], close: true },
              { id: "job", label: "Need an herb aide?", actions: [{ type: "openJob", id: "apothecary" }], close: true },
              { id: "close", label: "I'll be careful.", close: true },
            ],
          },
        ],
      },
    ],
  },
  {
    npcId: "pell_barrow",
    variants: [
      {
        id: "orchard_turnin",
        conditions: [{ type: "quest", key: "side_orchard_watch", state: "turnInReady" }],
        entryPageId: "pell_orchard_done",
        pages: [
          {
            id: "pell_orchard_done",
            speakerId: "pell_barrow",
            speakerName: "Pell Barrow",
            text: [
              "That's the first quiet night these trees are likely to get all week. Much obliged.",
            ],
            actions: [{ type: "completeQuest", id: "side_orchard_watch" }],
            choices: [{ id: "close", label: "Happy to help.", close: true }],
          },
        ],
      },
      {
        id: "orchard_offer",
        conditions: [
          { type: "quest", key: "side_mill_rats", state: "completed" },
          { type: "quest", key: "side_orchard_watch", state: "active", not: true },
          { type: "quest", key: "side_orchard_watch", state: "completed", not: true },
        ],
        entryPageId: "pell_orchard_offer",
        pages: [
          {
            id: "pell_orchard_offer",
            speakerId: "pell_barrow",
            speakerName: "Pell Barrow",
            text: [
              "Now it's bog moths in the orchard bark. Trouble never even has the courtesy to repeat itself cleanly.",
            ],
            choices: [
              { id: "accept", label: "I'll clear them.", actions: [{ type: "startQuest", id: "side_orchard_watch" }], close: true },
              { id: "later", label: "Another time.", close: true },
            ],
          },
        ],
      },
      {
        id: "mill_turnin",
        conditions: [{ type: "quest", key: "side_mill_rats", state: "turnInReady" }],
        entryPageId: "pell_done",
        pages: [
          {
            id: "pell_done",
            speakerId: "pell_barrow",
            speakerName: "Pell Barrow",
            text: [
              "Good work. If we'd lost another sack of grain, I'd have started charging the mosslings rent.",
            ],
            actions: [{ type: "completeQuest", id: "side_mill_rats" }],
            choices: [{ id: "close", label: "Keep the grain safe.", close: true }],
          },
        ],
      },
      {
        id: "mill_offer",
        conditions: [
          { type: "quest", key: "side_mill_rats", state: "active", not: true },
          { type: "quest", key: "side_mill_rats", state: "completed", not: true },
        ],
        entryPageId: "pell_offer",
        pages: [
          {
            id: "pell_offer",
            speakerId: "pell_barrow",
            speakerName: "Pell Barrow",
            text: [
              "I'd pay good coin for somebody to clear the mosslings chewing at the grain shed.",
            ],
            choices: [
              { id: "accept", label: "I'll take care of it.", actions: [{ type: "startQuest", id: "side_mill_rats" }], close: true },
              { id: "later", label: "Maybe later.", close: true },
            ],
          },
        ],
      },
      {
        id: "pell_default",
        entryPageId: "pell_default_page",
        pages: [
          {
            id: "pell_default_page",
            speakerId: "pell_barrow",
            speakerName: "Pell Barrow",
            text: [
              "Every calm harvest starts with a dozen ugly little crises.",
            ],
            choices: [
              { id: "job", label: "Need a fieldhand?", actions: [{ type: "openJob", id: "farmer" }], close: true },
              { id: "close", label: "Understood.", close: true },
            ],
          },
        ],
      },
    ],
  },
  {
    npcId: "brindle_roe",
    variants: [
      {
        id: "net_turnin",
        conditions: [{ type: "quest", key: "side_missing_net", state: "turnInReady" }],
        entryPageId: "brindle_done",
        pages: [
          {
            id: "brindle_done",
            speakerId: "brindle_roe",
            speakerName: "Brindle Roe",
            text: [
              "That'll cover the catch I lost. Have a bowl on me before the gulls claim that too.",
            ],
            actions: [{ type: "completeQuest", id: "side_missing_net" }],
            choices: [{ id: "close", label: "Fair trade.", close: true }],
          },
        ],
      },
      {
        id: "net_offer",
        conditions: [
          { type: "quest", key: "side_missing_net", state: "active", not: true },
          { type: "quest", key: "side_missing_net", state: "completed", not: true },
        ],
        entryPageId: "brindle_offer",
        pages: [
          {
            id: "brindle_offer",
            speakerId: "brindle_roe",
            speakerName: "Brindle Roe",
            text: [
              "Lost a drift-net and most of today's catch with it. Bring me enough silverfin to patch the loss?",
            ],
            choices: [
              { id: "accept", label: "I'll bring some in.", actions: [{ type: "startQuest", id: "side_missing_net" }], close: true },
              { id: "later", label: "Not today.", close: true },
            ],
          },
        ],
      },
      {
        id: "brindle_default",
        entryPageId: "brindle_default_page",
        pages: [
          {
            id: "brindle_default_page",
            speakerId: "brindle_roe",
            speakerName: "Brindle Roe",
            text: [
              "Fish the pools when the water still looks like metal. If it starts looking like ink, go home.",
            ],
            choices: [
              { id: "job", label: "Any fishing work?", actions: [{ type: "openJob", id: "fisher" }], close: true },
              { id: "close", label: "I'll watch the tide.", close: true },
            ],
          },
        ],
      },
    ],
  },
  {
    npcId: "toma_fenn",
    variants: [
      {
        id: "cask_turnin",
        conditions: [{ type: "quest", key: "side_cask_for_song", state: "turnInReady" }],
        entryPageId: "toma_done",
        pages: [
          {
            id: "toma_done",
            speakerId: "toma_fenn",
            speakerName: "Toma Fenn",
            text: [
              "A tavern with no song is just a damp room with chairs. You saved tonight's mood.",
            ],
            actions: [{ type: "completeQuest", id: "side_cask_for_song" }],
            choices: [{ id: "close", label: "Glad I could help.", close: true }],
          },
        ],
      },
      {
        id: "cask_offer",
        conditions: [
          { type: "quest", key: "side_cask_for_song", state: "active", not: true },
          { type: "quest", key: "side_cask_for_song", state: "completed", not: true },
        ],
        entryPageId: "toma_offer",
        pages: [
          {
            id: "toma_offer",
            speakerId: "toma_fenn",
            speakerName: "Toma Fenn",
            text: [
              "Need a small favor with a loud reward? I need timber for a cask stand before tonight's singer walks.",
            ],
            choices: [
              { id: "accept", label: "I'll bring the timber.", actions: [{ type: "startQuest", id: "side_cask_for_song" }], close: true },
              { id: "later", label: "Later.", close: true },
            ],
          },
        ],
      },
      {
        id: "toma_default",
        entryPageId: "toma_default_page",
        pages: [
          {
            id: "toma_default_page",
            speakerId: "toma_fenn",
            speakerName: "Toma Fenn",
            text: [
              "Bellglass sells three things with equal pride: soup, gossip, and second chances.",
            ],
            choices: [
              { id: "shop", label: "What are you serving?", actions: [{ type: "openShop", id: "tavern_shop" }], close: true },
              {
                id: "job",
                label: "Need an innhand?",
                actions: [{ type: "openJob", id: "innhand" }],
                close: true,
              },
              { id: "rest", label: "Let me catch my breath.", actions: [{ type: "rest" }], close: true },
            ],
          },
        ],
      },
    ],
  },
  {
    npcId: "vale_hunter",
    variants: [
      {
        id: "hunter_turnin",
        conditions: [{ type: "quest", key: "side_hunter_dues", state: "turnInReady" }],
        entryPageId: "vale_done",
        pages: [
          {
            id: "vale_done",
            speakerId: "vale_hunter",
            speakerName: "Vale",
            text: [
              "Good cuts. Clean work. Keep moving like that and the wilds will hate you properly.",
            ],
            actions: [{ type: "completeQuest", id: "side_hunter_dues" }],
            choices: [{ id: "close", label: "I'll take that as praise.", close: true }],
          },
        ],
      },
      {
        id: "hunter_offer",
        conditions: [
          { type: "quest", key: "side_hunter_dues", state: "active", not: true },
          { type: "quest", key: "side_hunter_dues", state: "completed", not: true },
        ],
        entryPageId: "vale_offer",
        pages: [
          {
            id: "vale_offer",
            speakerId: "vale_hunter",
            speakerName: "Vale",
            text: [
              "Road beasts are stripping kills and leaving nothing but panic behind. Bring me pelts and I'll know the numbers are dropping.",
            ],
            choices: [
              { id: "accept", label: "I'll hunt them.", actions: [{ type: "startQuest", id: "side_hunter_dues" }], close: true },
              { id: "later", label: "Another hunt another day.", close: true },
            ],
          },
        ],
      },
      {
        id: "vale_default",
        entryPageId: "vale_default_page",
        pages: [
          {
            id: "vale_default_page",
            speakerId: "vale_hunter",
            speakerName: "Vale",
            text: [
              "Don't dodge away from a charge if you can dodge through it. Shorter path. Better angle.",
            ],
            choices: [
              { id: "job", label: "Any hunt contracts?", actions: [{ type: "openJob", id: "hunter" }], close: true },
              { id: "close", label: "I'll remember that.", close: true },
            ],
          },
        ],
      },
    ],
  },
  {
    npcId: "orsa_vek",
    variants: [
      {
        id: "miner_turnin",
        conditions: [{ type: "quest", key: "side_miner_spark", state: "turnInReady" }],
        entryPageId: "orsa_done",
        pages: [
          {
            id: "orsa_done",
            speakerId: "orsa_vek",
            speakerName: "Orsa Vek",
            text: [
              "Beetles down and lamps still standing. That's what I call a productive shift.",
            ],
            actions: [{ type: "completeQuest", id: "side_miner_spark" }],
            choices: [{ id: "close", label: "The mine's breathing again.", close: true }],
          },
        ],
      },
      {
        id: "miner_offer",
        conditions: [
          { type: "quest", key: "side_miner_spark", state: "active", not: true },
          { type: "quest", key: "side_miner_spark", state: "completed", not: true },
        ],
        entryPageId: "orsa_offer",
        pages: [
          {
            id: "orsa_offer",
            speakerId: "orsa_vek",
            speakerName: "Orsa Vek",
            text: [
              "Glass beetles keep smashing the lamps before my crews can brace the next seam. Break three and I'll pay proper.",
            ],
            choices: [
              { id: "accept", label: "I'll clear them.", actions: [{ type: "startQuest", id: "side_miner_spark" }], close: true },
              { id: "later", label: "Not this minute.", close: true },
            ],
          },
        ],
      },
      {
        id: "orsa_default",
        entryPageId: "orsa_default_page",
        pages: [
          {
            id: "orsa_default_page",
            speakerId: "orsa_vek",
            speakerName: "Orsa Vek",
            text: [
              "Ore looks pretty right up until it explodes, shifts, or caves the roof in. Respect it anyway.",
            ],
            choices: [
              { id: "job", label: "Need a miner?", actions: [{ type: "openJob", id: "miner" }], close: true },
              { id: "close", label: "Understood.", close: true },
            ],
          },
        ],
      },
    ],
  },
  {
    npcId: "garrick_elm",
    variants: [
      {
        id: "cache_turnin",
        conditions: [{ type: "quest", key: "side_lost_cache", state: "turnInReady" }],
        entryPageId: "garrick_done",
        pages: [
          {
            id: "garrick_done",
            speakerId: "garrick_elm",
            speakerName: "Garrick Elm",
            text: [
              "You found it? Hah. Thought Moonwell had eaten that stash for good.",
              "Take this charm. Safer with a runner than in my workshop drawer.",
            ],
            actions: [{ type: "completeQuest", id: "side_lost_cache" }],
            choices: [{ id: "close", label: "Glad I found it.", close: true }],
          },
        ],
      },
      {
        id: "cache_offer",
        conditions: [
          { type: "quest", key: "side_lost_cache", state: "active", not: true },
          { type: "quest", key: "side_lost_cache", state: "completed", not: true },
        ],
        entryPageId: "garrick_offer",
        pages: [
          {
            id: "garrick_offer",
            speakerId: "garrick_elm",
            speakerName: "Garrick Elm",
            text: [
              "I hid a supply satchel out near Moonwell Glen before the road got ugly. Can't spare the time to fetch it myself.",
            ],
            choices: [
              { id: "accept", label: "I'll look for it.", actions: [{ type: "startQuest", id: "side_lost_cache" }], close: true },
              { id: "later", label: "Another run, maybe.", close: true },
            ],
          },
        ],
      },
    ],
  },
  {
    npcId: "suri_bell",
    variants: [
      {
        id: "suri_default",
        entryPageId: "suri_page",
        pages: [
          {
            id: "suri_page",
            speakerId: "suri_bell",
            speakerName: "Suri Bell",
            text: [
              "If you need gear that looks respectable on a city street but survives a road fight, that's my specialty.",
            ],
            choices: [
              { id: "shop", label: "Show me your stock.", actions: [{ type: "openShop", id: "market_shop" }], close: true },
              { id: "close", label: "Maybe later.", close: true },
            ],
          },
        ],
      },
    ],
  },
  {
    npcId: "elder_sen",
    variants: [
      {
        id: "elder_default",
        entryPageId: "elder_page",
        pages: [
          {
            id: "elder_page",
            speakerId: "elder_sen",
            speakerName: "Elder Sen",
            text: [
              "That brazier has outlived storms, kings, and bad ferrymen. Keep it fed, and Emberwharf remembers who it is.",
            ],
            choices: [{ id: "close", label: "I'll remember that.", close: true }],
          },
        ],
      },
    ],
  },
  {
    npcId: "jori_penn",
    variants: [
      {
        id: "jori_default",
        entryPageId: "jori_page",
        pages: [
          {
            id: "jori_page",
            speakerId: "jori_penn",
            speakerName: "Jori Penn",
            text: [
              "Every courier swears their route trouble is unique. Funny thing is, the forms all end up looking the same.",
            ],
            choices: [{ id: "close", label: "Sounds about right.", close: true }],
          },
        ],
      },
    ],
  },
  {
    npcId: "dessa_wren",
    variants: [
      {
        id: "dessa_default",
        entryPageId: "dessa_page",
        pages: [
          {
            id: "dessa_page",
            speakerId: "dessa_wren",
            speakerName: "Dessa Wren",
            text: [
              "Mara says fast feet only matter if the letter gets there dry. I'm still working on the second part.",
            ],
            choices: [{ id: "close", label: "Keep running, then.", close: true }],
          },
        ],
      },
    ],
  },
  {
    npcId: "nill_stone",
    variants: [
      {
        id: "nill_default",
        entryPageId: "nill_page",
        pages: [
          {
            id: "nill_page",
            speakerId: "nill_stone",
            speakerName: "Nill Stone",
            text: [
              "If the mine groans, I listen. If Orsa groans, I move faster. Both habits keep me alive.",
            ],
            choices: [{ id: "close", label: "Good habits.", close: true }],
          },
        ],
      },
    ],
  },
  {
    npcId: "hesta_lane",
    variants: [
      {
        id: "hesta_default",
        entryPageId: "hesta_page",
        pages: [
          {
            id: "hesta_page",
            speakerId: "hesta_lane",
            speakerName: "Hesta Lane",
            text: [
              "If the room's still noisy, the soup's hot enough and nobody's started a chair-fight. That's a successful night.",
            ],
            choices: [{ id: "close", label: "I'll leave you to it.", close: true }],
          },
        ],
      },
    ],
  },
  {
    npcId: "marlo_sheen",
    variants: [
      {
        id: "marlo_default",
        entryPageId: "marlo_page",
        pages: [
          {
            id: "marlo_page",
            speakerId: "marlo_sheen",
            speakerName: "Marlo Sheen",
            text: [
              "Frontier songs only become worth hearing after the third verse, when everybody's brave enough to sing the sad part.",
            ],
            choices: [{ id: "close", label: "I'll listen for it.", close: true }],
          },
        ],
      },
    ],
  },
  {
    npcId: "fara_glass",
    variants: [
      {
        id: "fara_default",
        entryPageId: "fara_page",
        pages: [
          {
            id: "fara_page",
            speakerId: "fara_glass",
            speakerName: "Fara Glass",
            text: [
              "The ruin stones shift when the roots are restless. If you hear glass singing under your boots, don't wait around to learn the tune.",
            ],
            choices: [{ id: "close", label: "Good warning.", close: true }],
          },
        ],
      },
    ],
  },
  {
    npcId: "veil_hunter",
    variants: [
      {
        id: "after_boss",
        conditions: [{ type: "quest", key: "main_last_hearth", state: "completed" }],
        entryPageId: "veil_after",
        pages: [
          {
            id: "veil_after",
            speakerId: "veil_hunter",
            speakerName: "The Veil Hunter",
            text: [
              "You did what the wardens could not. The roots will remember the wound you gave them.",
            ],
            choices: [{ id: "close", label: "Let them.", close: true }],
          },
        ],
      },
      {
        id: "warning",
        entryPageId: "veil_warning",
        pages: [
          {
            id: "veil_warning",
            speakerId: "veil_hunter",
            speakerName: "The Veil Hunter",
            text: [
              "Glassroot hates hesitation. If the great stag lowers its head, do not meet it where it wants you.",
              "Cut across the charge. Live in the opening it leaves behind.",
            ],
            choices: [{ id: "close", label: "I'll keep moving.", close: true }],
          },
        ],
      },
    ],
  },
];
