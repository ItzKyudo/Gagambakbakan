// Source: pasted 16-node spider skill specification. Keep each node's copy and prerequisites together.
export const SKILL_CATALOG = {
  "weaver": {
    "name": "Orb Weaver",
    "element": "Water",
    "innatePassive": {
    "name": "Soaked Strike",
    "trigger": "Heavy Attack",
    "effect": "Soaked (15% slow, 3s)",
    "description": "Heavy Attack applies Soaked (15% slow for 3s)"
},
    "nodes": {
      "S1": {
        "name": "Dewdrop Lash",
        "cooldown": 2.5,
        "description": "Whips a water-heavy silk strand forward, dealing 40 damage and applying **Soaked** (15% slow for 3s).",
        "animation": "Rears front legs and snaps a glistening blue thread forward that splashes on impact.",
        "icon": "A glowing cyan silk thread coiled inside a falling water droplet.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Single-Target","Projectile","CC (Slow)"],
        "damage": "40 (+60% Light ATK) • 15% Slow",
        "range": "7m Line",
        "duration": "Debuff: 3s"
      },
      "S2": {
        "name": "Surface Tension Glide",
        "cooldown": 6.0,
        "description": "Skates across the ground on a film of water for 2s, gaining 40% movement speed and ignoring terrain friction.",
        "animation": "Lowers body as glowing water ripples form beneath all eight tarsi, sliding smoothly like a water strider.",
        "icon": "Four spider leg tips resting on concentric blue water ripples.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Mobility (Dash)","Buff (Speed)"],
        "damage": "+40% Move Speed • Ignores terrain friction",
        "range": "Self (6m travel)",
        "duration": "Buff: 2s"
      },
      "S3": {
        "name": "Condensation Snare",
        "cooldown": 9.0,
        "description": "Spins a 3-meter hydro-web on the ground. Enemies stepping on it take 30 damage, become **Soaked**, and are rooted for 1.2s.",
        "animation": "Spins in a tight 360-degree circle, anchoring a geometric web beaded with pulsing water orbs.",
        "icon": "An octagonal spiderweb sparkling with three oversized aqua pearls.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["AoE","Trap / Hazard","CC (Root, Slow)"],
        "damage": "30 (+40% Light ATK) • Root + Soaked",
        "range": "3m Radius",
        "duration": "Root: 1.2s"
      },
      "S4": {
        "name": "Mist Veil Carapace",
        "cooldown": 11.0,
        "description": "Wraps the abdomen in dense vapor, reducing incoming damage by 25% for 3.5s and extinguishing Fire burns.",
        "animation": "Expels cool white-blue steam from spinnerets that swirls around the body like a liquid shield.",
        "icon": "A spider carapace half-submerged in swirling pale-blue fog.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Defense (Mitigation)","Cleanse"],
        "damage": "25% Damage Reduction • Cleanses Ignite",
        "range": "Self",
        "duration": "Buff: 3.5s"
      },
      "S5": {
        "name": "Pressurized Fang Jet",
        "cooldown": 5.0,
        "description": "Fires twin high-pressure water beams from chelicerae, dealing 65 damage and knocking back **Soaked** targets.",
        "animation": "Juts jaws forward as two razor-thin aqua lasers burst out with white foam recoil.",
        "icon": "Twin curved fangs shooting pressurized cyan water streams.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S1"
        ],
        "tags": ["Line / Piercing","Projectile","CC (Knockback)"],
        "damage": "65 (+80% Heavy ATK) • 2.5m Knockback on Soaked",
        "range": "8m Beam",
        "duration": "Instant"
      },
      "S6": {
        "name": "Riptide Pendulum",
        "cooldown": 8.0,
        "description": "Latches a hydro-thread onto terrain or an enemy and swings in an arc, dealing 55 damage and pulling the target slightly.",
        "animation": "Fires a liquid tether, leaps sideways, and carves a crescent wave wake through the air.",
        "icon": "A curved tidal wave hooked to a taut silver web line.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S1",
          "S2"
        ],
        "tags": ["Mobility (Grapple)","Displacement (Pull)","Single-Target"],
        "damage": "55 (+70% Light ATK) • Pulls target 2.5m",
        "range": "7m Tether",
        "duration": "Instant"
      },
      "S7": {
        "name": "Fogbank Slipstream",
        "cooldown": 10.0,
        "description": "Dashes backward while leaving a 4m mist cloud that obscures enemy vision and grants the Orb Weaver 20% evasion.",
        "animation": "Backflips gracefully while bursting a water sac from spinnerets into thick, lingering vapor.",
        "icon": "A shadowy spider silhouette fading into layered teal mist.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S2",
          "S3"
        ],
        "tags": ["Mobility (Dash)","AoE (Zone)","Buff (Evasion)"],
        "damage": "+20% Evasion • Obscures enemy vision",
        "range": "4m Dash / 4m Cloud",
        "duration": "Zone: 3s"
      },
      "S8": {
        "name": "Whirlpool Radial Web",
        "cooldown": 12.0,
        "description": "Spins a 3.5m whirlpool web that drags nearby enemies toward its center over 2.5s. Gains +25% pull strength if cast on an existing **Condensation Snare**.",
        "animation": "Plunges front legs into the ground, causing the nearby web trap to spin rapidly like a whirlpool drain.",
        "icon": "A spiral water vortex woven with geometric white silk spokes.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S3"
        ],
        "tags": ["AoE","Trap / Hazard","Displacement (Pull)"],
        "damage": "Continuous inward vortex drag",
        "range": "3.5m Radius",
        "duration": "Vortex: 2.5s"
      },
      "S9": {
        "name": "Capillary Spines",
        "cooldown": 9.0,
        "description": "Coats leg bristles in pressurized water needles for 4s; melee attackers take 35 reflective damage and become **Soaked**.",
        "animation": "Shudders violently as translucent icicle-like water beads erect along all eight legs.",
        "icon": "A spiked spider leg glistening with sharp aqua droplets.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S3",
          "S4"
        ],
        "tags": ["Buff (Thorns / Reflect)","CC (Slow)"],
        "damage": "35 (+50% Light ATK) reflect per melee hit + Soaked",
        "range": "Self (Melee)",
        "duration": "Buff: 4s"
      },
      "S10": {
        "name": "Osmotic Regeneration",
        "cooldown": 14.0,
        "description": "Absorbs moisture from nearby webs and **Soaked** enemies within 6m, healing 45 HP per source over 3s.",
        "animation": "Raises front legs skyward as glowing blue water droplets lift off nearby foes and stream into the spider's body.",
        "icon": "A glowing turquoise heart encased inside a woven water bubble.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S4",
          "S9"
        ],
        "tags": ["AoE (Drain)","Sustain (Heal)"],
        "damage": "Heals 45 HP (+40% Light ATK) per web/Soaked foe",
        "range": "6m Radius",
        "duration": "Over 3s"
      },
      "S11": {
        "name": "Geyser Rupture Bite",
        "cooldown": 10.0,
        "description": "Lunges to bite a target for 80 damage; if the target is **Soaked**, a water geyser erupts underneath them for an 0.8s knock-up.",
        "animation": "Dives fangs-first into the foe, followed immediately by a vertical column of foaming water blasting upward.",
        "icon": "Pair of venomous jaws clamping down atop an erupting blue geyser.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S5",
          "S6"
        ],
        "tags": ["Melee","Single-Target","CC (Knock-up)"],
        "damage": "80 (+100% Heavy ATK) • 0.8s Knock-up on Soaked",
        "range": "3m Lunge",
        "duration": "Instant"
      },
      "S12": {
        "name": "Monsoon Vault",
        "cooldown": 11.0,
        "description": "Launches high into the air on a water-jet tether and slams down, dealing 70 AoE damage and creating a **Condensation Snare**.",
        "animation": "Propels upward via spinneret water-jets, curls into a sphere, and crashes down in a ring of splashing silk.",
        "icon": "A spider plummeting downward inside a comet-like water drop.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S6",
          "S7"
        ],
        "tags": ["Mobility (Leap)","AoE","Trap / Hazard"],
        "damage": "70 (+85% Heavy ATK) • Spawns S3 Snare on land",
        "range": "6m Leap / 3.5m AoE",
        "duration": "Instant"
      },
      "S13": {
        "name": "Undertow Tether",
        "cooldown": 13.0,
        "description": "Binds an enemy with a heavy elastic water-cord for 3s. If they move more than 5m away, they are yanked back and stunned for 1s.",
        "animation": "Spits a thick braided rope of water and silk that wraps around the enemy's torso with a glowing blue anchor rune.",
        "icon": "A braided aqua rope tied into a constricting slipknot.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S7",
          "S8"
        ],
        "tags": ["Single-Target","Displacement (Yank)","CC (Stun)"],
        "damage": "Yanks back if distance > 5m + 1s Stun",
        "range": "6m Range",
        "duration": "Tether: 3s"
      },
      "S14": {
        "name": "Deluge Barrier",
        "cooldown": 15.0,
        "description": "Erect a vertical wall of woven hydro-silk (6m wide) for 4s that blocks enemy projectiles and slows enemies passing through by 50%.",
        "animation": "Sweeps abdomen horizontally left to right, pulling up a shimmering curtain of cascading water and silk threads.",
        "icon": "A vertical waterfall crisscrossed with glowing silver web patterns.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S8",
          "S9"
        ],
        "tags": ["Terrain / Wall","Projectile Block","CC (Slow)"],
        "damage": "Blocks projectiles • 50% Slow to enemies passing",
        "range": "6m Wide Wall",
        "duration": "Wall: 4s"
      },
      "S15": {
        "name": "Abyssal Maelstrom Loom",
        "cooldown": 20.0,
        "description": "Spins a massive 10m hydro-vortex for 5s that continuously pulls enemies inward, deals 35 damage per second, and refreshes **Soaked**.",
        "animation": "Leaps to the center, anchors eight giant hydro-cables outward, and spins violently to create a roaring whirlpool storm.",
        "icon": "A dark-blue oceanic maelstrom framed by an intricate golden-cyan orb web.",
        "tier": 4,
        "cost": 3,
        "requires": [
          "S11",
          "S12",
          "S13"
        ],
        "tags": ["Ultimate","AoE (DoT)","Displacement (Pull)","CC (Slow)"],
        "damage": "28 dmg/s (+24% Light ATK/s) • Strong inward pull",
        "range": "6m Radius",
        "duration": "Duration: 4s"
      },
      "S16": {
        "name": "Mirror Lake Sanctum",
        "cooldown": 22.0,
        "description": "Floods an 8m arena with calm, reflective water for 6s. Inside, the Orb Weaver gains 35% cooldown reduction, immunity to roots, and heals 25 HP/s.",
        "animation": "Gently taps the ground with one pedipalp, sending out a serene turquoise ripple that turns the floor into a glowing mirror pond.",
        "icon": "A serene lotus-shaped spiderweb floating on glowing sapphire water.",
        "tier": 4,
        "cost": 3,
        "requires": [
          "S10",
          "S13",
          "S14"
        ],
        "tags": ["Ultimate","AoE (Zone)","Buff (CDR, Root-Immune)","Sustain (Heal)"],
        "damage": "+35% CDR, Root Immunity, 20 HP/s heal",
        "range": "5m Radius",
        "duration": "Duration: 5s"
      }
    }
  },
  "hunter": {
    "name": "Jumping Spider",
    "element": "Air",
    "innatePassive": {
    "name": "Tailwind Surge",
    "trigger": "Heavy Attack",
    "effect": "+1 Tailwind stack",
    "description": "Heavy Attack grants +1 Tailwind stack on hit"
},
    "nodes": {
      "S1": {
        "name": "Wind-Cutter Pounce",
        "cooldown": 3.0,
        "description": "Micro-leaps 4m forward and slashes with wind-sheathed fangs for 45 damage, granting 1 stack of **Tailwind** (5% speed/leap range, max 4).",
        "animation": "Crouches briefly, wiggles abdomen, and snaps forward in a white wind-streak blur.",
        "icon": "Two cute oversized spider eyes gleaming behind a sharp cyan wind slash.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Mobility (Leap)","Single-Target","Buff (Stacking)"],
        "damage": "45 (+65% Light ATK) • +1 Tailwind stack (max 4)",
        "range": "4m Leap",
        "duration": "Instant"
      },
      "S2": {
        "name": "Thermal Updraft Hop",
        "cooldown": 5.0,
        "description": "Releases a compressed air burst beneath its legs to jump vertically into the air, dodging ground attacks and enabling aerial aim for 1.5s.",
        "animation": "Pops straight up on a spiraling ring of white air, hovering briefly with legs splayed out like a skydiver.",
        "icon": "A jumping spider silhouette ascending above three upward wind chevrons.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Mobility (Vertical Leap)","Evasion"],
        "damage": "Launches 5m vertically • Dodges ground attacks",
        "range": "Vertical Self",
        "duration": "Hover: 1.5s"
      },
      "S3": {
        "name": "Gust Tether",
        "cooldown": 7.0,
        "description": "Fires an air-pressurized dragline at a point or foe; pulls self rapidly to the target or pulls an airborne foe down.",
        "animation": "Shoots a whistling white silk thread surrounded by spiraling wind rings and zips along it instantly.",
        "icon": "A taut silk dragline wrapped in a swirling mint-green tornado coil.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Mobility (Grapple)","Displacement (Pull-Down)"],
        "damage": "Pulls self to target OR slams airborne foe to ground",
        "range": "8m Line",
        "duration": "Instant"
      },
      "S4": {
        "name": "Barometric Eye Focus",
        "cooldown": 10.0,
        "description": "Tunes sensory hairs and anterior eyes to air currents for 4s, increasing critical strike chance by 25% and revealing stealthed enemies within 8m.",
        "animation": "Tilts cephalothorax left and right as its four front eyes flash bright turquoise and sensory leg hairs vibrate.",
        "icon": "Four glowing emerald-cyan spider eyes surrounded by wind-wave radar rings.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Buff (Crit Chance)","Utility (True Sight)"],
        "damage": "+25% Crit Chance • Reveals stealthed enemies",
        "range": "8m Aura",
        "duration": "Buff: 4s"
      },
      "S5": {
        "name": "Vacuum Fang Strike",
        "cooldown": 6.0,
        "description": "Claps front legs and jaws together to fire a crescent air blade 8m forward, dealing 60 damage and slicing enemy web traps.",
        "animation": "Snaps both pedipalps inward, launching a translucent, whistling boomerang of compressed wind.",
        "icon": "A crescent-shaped white wind blade crackling with pale blue air pressure.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S1"
        ],
        "tags": ["Projectile","Line / Piercing","Trap-Break"],
        "damage": "60 (+75% Light ATK) • Destroys web/vine traps",
        "range": "8m Line",
        "duration": "Instant"
      },
      "S6": {
        "name": "Gale-Force Dropkick",
        "cooldown": 7.0,
        "description": "While airborne, dives diagonally at high speed into an enemy, dealing 70 damage and bouncing backward 3m to safety.",
        "animation": "Tucks legs in mid-air, rockets downward inside a cone of Mach-wind, kicks the target, and backflips away.",
        "icon": "Spider front legs thrust downward inside a sharp aerodynamic shockwave cone.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S1",
          "S2"
        ],
        "tags": ["Aerial Dive","Single-Target","Mobility (Disengage)"],
        "damage": "70 (+90% Heavy ATK) • Bounces back 3m on hit",
        "range": "6m Diagonal Dive",
        "duration": "Instant"
      },
      "S7": {
        "name": "Zephyr Mirage",
        "cooldown": 9.0,
        "description": "Side-steps at blinding speed using a burst of wind, leaving a 1.5s air-refraction decoy that bursts to push attackers back if hit.",
        "animation": "Flickers sideways in a zig-zag blur while a shimmering, translucent wind-clone stays behind waving its pedipalps.",
        "icon": "Twin overlapping spider silhouettes, one solid and one made of swirling clouds.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S2",
          "S3"
        ],
        "tags": ["Mobility (Side-Dash)","Decoy / Illusion","CC (Knockback)"],
        "damage": "Leaves decoy; bursts for 2.5m Knockback if struck",
        "range": "3.5m Dash / 2.5m Burst",
        "duration": "Decoy: 1.5s"
      },
      "S8": {
        "name": "Cyclone Anchor",
        "cooldown": 11.0,
        "description": "Pins a wind-spool to the ground for 3s that creates an localized updraft, launching any enemy who steps on it straight into the air for 1s.",
        "animation": "Taps spinnerets to the floor, leaving a miniature spinning white whirlwind tied to a silk anchor.",
        "icon": "A compact vertical tornado tethered to the ground by three silk lines.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S3"
        ],
        "tags": ["Trap / Hazard","AoE","CC (Knock-up)"],
        "damage": "Launches stepping enemies 4m into the air (1s)",
        "range": "2.5m Radius",
        "duration": "Trap: 3s"
      },
      "S9": {
        "name": "Tailwind Deflection",
        "cooldown": 10.0,
        "description": "Spins a rapid vortex shield with front legs for 1.5s that reflects ranged projectiles back toward the attacker and grants 1 **Tailwind** stack.",
        "animation": "Rapidly drums front legs and pedipalps in a circle, generating a flat, spinning disc of deflective wind.",
        "icon": "A circular wind turbine shield deflecting a glowing projectile arrow.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S3",
          "S4"
        ],
        "tags": ["Defense (Projectile Reflect)","Buff (Stacking)"],
        "damage": "Reflects projectiles at 100% dmg + 1 Tailwind",
        "range": "Frontal Arc",
        "duration": "Parry: 1.5s"
      },
      "S10": {
        "name": "Jetstream Carapace",
        "cooldown": 13.0,
        "description": "Consumes all **Tailwind** stacks to wrap self in a frictionless air barrier, granting a 40 HP shield per stack and cleansing slows/roots.",
        "animation": "Spins once in place as sleek, aerodynamic ribbons of glowing white wind wrap tightly around the body.",
        "icon": "A spherical wind barrier encircling a glowing winged spider emblem.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S4",
          "S9"
        ],
        "tags": ["Defense (Shield)","Cleanse"],
        "damage": "40 HP Shield per Tailwind stack (max 160) + Cleanse",
        "range": "Self",
        "duration": "Shield: 4s"
      },
      "S11": {
        "name": "Sonic Boom Ambush",
        "cooldown": 10.0,
        "description": "Teleports-by-leap up to 10m directly onto a marked or airborne target, dealing 95 burst damage and silencing them for 1s.",
        "animation": "Vanishes with an audible sonic crack, leaving a white vapor ring, and reappears instantly atop the enemy's back.",
        "icon": "A shattered sound-barrier ring with two glowing fangs piercing the center.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S5",
          "S6"
        ],
        "tags": ["Mobility (Teleport)","Single-Target","CC (Silence)"],
        "damage": "95 (+105% Heavy ATK) • Silences skills for 1s",
        "range": "10m Blink",
        "duration": "Instant"
      },
      "S12": {
        "name": "Stratosphere Ballooning",
        "cooldown": 14.0,
        "description": "Releases a parachute of electro-static silk to ride high wind currents for 3.5s, becoming untargetable by melee attacks before diving down.",
        "animation": "Raises abdomen skyward, shoots five fanned silk strands that catch the wind, and floats effortlessly above the arena.",
        "icon": "A spider suspended beneath a glowing fan of wind-Swept silk threads.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S6",
          "S7"
        ],
        "tags": ["Mobility (Flight)","Untargetable (Melee)"],
        "damage": "Free aerial flight; immune to melee attacks",
        "range": "Aerial Self",
        "duration": "Flight: 3.5s"
      },
      "S13": {
        "name": "Vortex Downburst",
        "cooldown": 12.0,
        "description": "Slams a compressed sphere of air into the ground from above, dealing 75 damage and pulling enemies within 5m into an airborne knock-up.",
        "animation": "Gathers a spinning orb of wind between front legs in mid-air and hurls it downward, imploding on contact.",
        "icon": "A compressed cyan wind sphere imploding against cracked ground.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S7",
          "S8"
        ],
        "tags": ["Aerial Slam","AoE","Displacement (Pull)","CC (Knock-up)"],
        "damage": "75 (+90% Heavy ATK) • Pulls inward + 0.8s Knock-up",
        "range": "3.5m Radius",
        "duration": "Instant"
      },
      "S14": {
        "name": "Squall Wall",
        "cooldown": 15.0,
        "description": "Summons a howling crosswind corridor (8m long) for 4s that accelerates allied movement by 50% and pushes enemies backward against the current.",
        "animation": "Sweeps both front legs forward in unison, unleashing a persistent, roaring tunnel of visible wind currents.",
        "icon": "Three powerful horizontal wind gusts blowing leaves and dust outward.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S8",
          "S9"
        ],
        "tags": ["Terrain / Zone","Buff (Speed)","CC (Pushback)"],
        "damage": "+50% Ally Speed • Pushes enemies backward",
        "range": "5m Corridor",
        "duration": "Zone: 4s"
      },
      "S15": {
        "name": "Hurricane Sky-Breaker",
        "cooldown": 18.0,
        "description": "Grabs an enemy with a wind-tether, rockets both spiders high into the air, strikes them 5 times from different angles, and slams them down for 160 total damage.",
        "animation": "Uppercuts the foe into a towering tornado, ricochets between wind rings in rapid cyan flashes, and piledrives them into the arena floor.",
        "icon": "A towering cyclone crossed by five glowing zig-zag strike trails.",
        "tier": 4,
        "cost": 3,
        "requires": [
          "S11",
          "S12",
          "S13"
        ],
        "tags": ["Ultimate","Single-Target","CC (Airborne Lock)","Multi-Hit"],
        "damage": "130 (5 × 26 + 96% Heavy ATK) • Aerial combo slam",
        "range": "5m Grab Range",
        "duration": "Combo: 1.8s"
      },
      "S16": {
        "name": "Eye of the Tempest",
        "cooldown": 20.0,
        "description": "Surrounds the Jumping Spider with a 7m mobile storm ring for 6s. Enemies touching the outer ring are knocked back and take 40 damage; inside, jump cooldowns are reduced by 60%.",
        "animation": "Stands calmly in a crystal-clear center while a violent, roaring wall of swirling wind and static orbits at a 7-meter radius.",
        "icon": "A calm glowing spider eye framed inside a raging circular hurricane.",
        "tier": 4,
        "cost": 3,
        "requires": [
          "S10",
          "S13",
          "S14"
        ],
        "tags": ["Ultimate","AoE (Aura)","CC (Knockback)","Buff (CDR)"],
        "damage": "32 dmg + Knockback on ring touch • -60% Jump CDs",
        "range": "4.5m Moving Ring",
        "duration": "Duration: 5s"
      }
    }
  },
  "guardian": {
    "name": "Huntsman",
    "element": "Fire",
    "innatePassive": {
    "name": "Igniting Blow",
    "trigger": "Heavy Attack",
    "effect": "1 Ignite stack",
    "description": "Heavy Attack applies 1 stack of Ignite (6 burn/s, 4s)"
},
    "nodes": {
      "S1": {
        "name": "Cinder Fang Slash",
        "cooldown": 2.0,
        "description": "Rapidly strikes twice with superheated jaws for 35 total damage, applying 1 stack of **Ignite** (6 burn damage/s for 4s, stacks up to 5).",
        "animation": "Lunges forward with wide-spread crab-like front legs and snaps fiery orange mandibles twice in a split second.",
        "icon": "Twin jagged fangs glowing like white-hot forged iron with sparks flying.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Melee","Multi-Hit","DoT (Ignite)"],
        "damage": "35 (2 hits, +55% Light ATK) • +1 Ignite (6/s)",
        "range": "2.5m Melee",
        "duration": "DoT: 4s"
      },
      "S2": {
        "name": "Flashfire Dash",
        "cooldown": 5.5,
        "description": "Scuttles at blistering speed in a 6m line, leaving a trail of embers that deals 20 damage/s and applies **Ignite** to enemies crossed.",
        "animation": "Flatten body low to the ground and blurs forward like a fireball, scorching black tire-like tracks into the floor.",
        "icon": "A flat, blurred spider silhouette streaking forward with a blazing flame tail.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Mobility (Dash)","AoE (Trail)","DoT (Ignite)"],
        "damage": "20 dmg/s fire trail • Applies 1 Ignite",
        "range": "6m Dash",
        "duration": "Trail: 2.5s"
      },
      "S3": {
        "name": "Ember Spark Trap",
        "cooldown": 8.0,
        "description": "Places a volatile cinder cocoon on the ground. Explodes when an enemy approaches, dealing 50 damage and applying 2 **Ignite** stacks.",
        "animation": "Quickly wraps a glowing magma core in dry silk and kicks it into position, where it pulses like a heartbeat.",
        "icon": "A charred silk cocoon cracked open to reveal a glowing orange magma core.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Trap / Hazard","AoE","DoT (Ignite)"],
        "damage": "50 (+65% Light ATK) • Applies 2 Ignite stacks",
        "range": "3m Explosion",
        "duration": "Trap: 12s"
      },
      "S4": {
        "name": "Molten Molt",
        "cooldown": 12.0,
        "description": "Sheds an outer layer of burning exoskeleton, cleansing all movement slows and increasing attack speed by 30% for 4s.",
        "animation": "Shudders as the old dark carapace cracks apart in fiery seams and bursts into ash, revealing a glowing crimson body.",
        "icon": "A cracked dark spider shell bursting apart from internal golden fire.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Cleanse","Buff (Attack Speed)"],
        "damage": "Cleanses all Slows/Roots • +30% Attack Speed",
        "range": "Self",
        "duration": "Buff: 4s"
      },
      "S5": {
        "name": "Searing Mandible Flurry",
        "cooldown": 6.0,
        "description": "Unleashes a 4-hit rapid combo over 1.2s dealing 75 total damage; each hit against an **Ignited** target reduces **Flashfire Dash** cooldown by 0.5s.",
        "animation": "Rears up and drums front four legs and jaws in a ferocious, sparking barrage of fiery arcs.",
        "icon": "Four overlapping fiery claw marks tearing through dark metal.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S1"
        ],
        "tags": ["Melee","Multi-Hit","Cooldown Reset"],
        "damage": "75 (4 hits, +95% Light ATK) • -0.5s S2 CD per hit",
        "range": "2.8m Cone",
        "duration": "Channel: 1.2s"
      },
      "S6": {
        "name": "Blazing Blitz",
        "cooldown": 8.0,
        "description": "Pounces onto a target from up to 7m away in a burst of flame, dealing 60 damage and briefly stunning them for 0.6s if they have 3+ **Ignite** stacks.",
        "animation": "Ignites all eight legs like rocket thrusters and missiles horizontally straight into the opponent's chest.",
        "icon": "A flaming meteor shaped like a lunging huntsman spider.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S1",
          "S2"
        ],
        "tags": ["Mobility (Lunge)","Single-Target","CC (Stun)"],
        "damage": "60 (+80% Heavy ATK) • 0.6s Stun if 3+ Ignite",
        "range": "7m Lunge",
        "duration": "Instant"
      },
      "S7": {
        "name": "Smoke Screen Scuttle",
        "cooldown": 10.0,
        "description": "Releases a dense black soot cloud (5m radius) that blinds enemies inside for 2s while granting the Huntsman 35% movement speed around its perimeter.",
        "animation": "Scrapes back legs rapidly against the ground, kicking up a choking cloud of black ash and red sparks while skittering sideways.",
        "icon": "A swirling cloud of dark charcoal smoke lit from within by red embers.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S2",
          "S3"
        ],
        "tags": ["AoE (Zone)","CC (Blind)","Buff (Speed)"],
        "damage": "Blinds enemies inside (2s) • +35% Move Speed",
        "range": "3.2m Radius",
        "duration": "Cloud: 3.5s"
      },
      "S8": {
        "name": "Ring of Ash",
        "cooldown": 12.0,
        "description": "Encircles a 5m area with flammable silk and ignites it for 3s; enemies crossing the fire ring take 65 damage and suffer 2 **Ignite** stacks.",
        "animation": "Sprints in a lightning-fast circle around the target area, dragging spinnerets to ignite a roaring perimeter wall of fire.",
        "icon": "A circular crown of bright orange flames anchored by charred silk threads.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S3"
        ],
        "tags": ["AoE (Perimeter)","Trap / Hazard","DoT (Ignite)"],
        "damage": "65 (+75% Light ATK) on crossing + 2 Ignite",
        "range": "3.5m Ring",
        "duration": "Ring: 3s"
      },
      "S9": {
        "name": "Flame-Backlash Shell",
        "cooldown": 10.0,
        "description": "Superheats the carapace for 3s. Whenever struck by an enemy attack, releases a 3m fire nova dealing 40 damage and applying 1 **Ignite** stack.",
        "animation": "Vents jets of orange flame from leg joints as the dorsal pattern glows bright yellow-white.",
        "icon": "A spiked spider shield radiating concentric rings of orange heatwaves.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S3",
          "S4"
        ],
        "tags": ["Defense (AoE Retaliation)","DoT (Ignite)"],
        "damage": "40 (+50% Light ATK) AoE nova when hit + 1 Ignite",
        "range": "3m Aura",
        "duration": "Buff: 3s"
      },
      "S10": {
        "name": "Cauterize Wounds",
        "cooldown": 14.0,
        "description": "Consumes nearby fire effects and self-combusts harmlessly to heal 80 HP immediately, plus 15 HP for every **Ignite** stack on nearby enemies.",
        "animation": "Curls legs inward briefly as warm golden flames wash over its wounds, sealing cracks in its exoskeleton with glowing amber.",
        "icon": "A phoenix-like flame wrapping around a mended spider carapace.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S4",
          "S9"
        ],
        "tags": ["Sustain (Burst Heal)"],
        "damage": "Heals 80 HP + 15 HP per active Ignite stack",
        "range": "8m Scan",
        "duration": "Instant"
      },
      "S11": {
        "name": "Detonating Bite",
        "cooldown": 9.0,
        "description": "Bites an enemy for 55 base damage and instantly detonates all **Ignite** stacks on them for 25 burst damage per stack.",
        "animation": "Clamps jaws shut with a loud metallic crunch, triggering a fiery shockwave explosion directly inside the target.",
        "icon": "Two glowing fangs biting down on a detonating fiery bomb symbol.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S5",
          "S6"
        ],
        "tags": ["Melee","Single-Target","Burst / Detonate"],
        "damage": "55 (+80% Heavy ATK) + 25 dmg per Ignite consumed",
        "range": "2.5m Melee",
        "duration": "Instant"
      },
      "S12": {
        "name": "Afterburner Overdrive",
        "cooldown": 13.0,
        "description": "Enters a hyper-metabolic combustion state for 5s, gaining 40% movement speed, 25% attack speed, and leaving a continuous fire wake.",
        "animation": "Blue-hot flames erupt from the abdomen and leg tips as the spider vibrates with intense heat distortion.",
        "icon": "A huntsman spider silhouette glowing blue-white with twin jet-flame trails.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S6",
          "S7"
        ],
        "tags": ["Buff (Speed + ATK Speed)","AoE (Trail)"],
        "damage": "+40% Move Speed, +25% ATK Speed, continuous fire wake",
        "range": "Self",
        "duration": "Buff: 5s"
      },
      "S13": {
        "name": "Pyre Lockdown",
        "cooldown": 14.0,
        "description": "Wraps an enemy in smoldering silk cords that root them for 1.8s and apply 1 **Ignite** stack every 0.6s.",
        "animation": "Spits three glowing red-hot wires that coil tightly around the target's legs like incandescent barbwire.",
        "icon": "Chains of glowing lava-silk constricting around a trapped silhouette.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S7",
          "S8"
        ],
        "tags": ["Projectile","CC (Root)","DoT (Ignite)"],
        "damage": "Roots target 1.8s • Applies 1 Ignite every 0.6s",
        "range": "6.5m Line",
        "duration": "Root: 1.8s"
      },
      "S14": {
        "name": "Scorched Earth Trail",
        "cooldown": 15.0,
        "description": "Ignites all web structures on the map (friendly or enemy) into burning hazards that deal 50 damage/s to opponents and destroy enemy traps.",
        "animation": "Slams both front legs down, sending a rapid wave of fire racing along every silk thread in the arena.",
        "icon": "A burning spiderweb disintegrating into bright orange sparks.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S8",
          "S9"
        ],
        "tags": ["Map-Wide","AoE (DoT)","Trap-Destroy"],
        "damage": "Ignites all webs into 50 dmg/s hazards; destroys traps",
        "range": "Arena-Wide",
        "duration": "Burn: 3s"
      },
      "S15": {
        "name": "Supernova Guillotine",
        "cooldown": 20.0,
        "description": "Sprints at unstoppable speed toward a target, grabs them, leaps into a fiery mid-air spin, and slams down for 150 damage (executes targets below 15% HP).",
        "animation": "Turns into a streaking crimson comet, latches onto the foe, spins into a blazing fire-wheel, and detonates on ground impact.",
        "icon": "A spinning crimson fire-wheel centered on a skull-patterned spider abdomen.",
        "tier": 4,
        "cost": 3,
        "requires": [
          "S11",
          "S12",
          "S13"
        ],
        "tags": ["Ultimate","Mobility (Dash-Grab)","Execute"],
        "damage": "120 (+100% Heavy ATK) • Executes targets below 15% HP",
        "range": "5m Dash",
        "duration": "Instant"
      },
      "S16": {
        "name": "Hellfire Crucible",
        "cooldown": 22.0,
        "description": "Transforms a 9m radius into a volcanic caldera for 6s. Enemies inside cannot leave without dashing, take 20 burn damage/s, and suffer maximum **Ignite** stacks.",
        "animation": "Tears open the arena floor with all eight legs, raising a circular wall of jagged magma rock and roaring flames.",
        "icon": "A ring of jagged volcanic pillars surrounding a blazing inferno pit.",
        "tier": 4,
        "cost": 3,
        "requires": [
          "S10",
          "S13",
          "S14"
        ],
        "tags": ["Ultimate","Terrain / Arena Cage","AoE (DoT)"],
        "damage": "Traps foes inside • 16 dmg/s + max Ignite stacks",
        "range": "5.5m Arena Ring",
        "duration": "Duration: 5s"
      }
    }
  },
  "wolf": {
    "name": "Wolf Spider",
    "element": "Land",
    "innatePassive": {
    "name": "Armor Crush",
    "trigger": "Heavy Attack",
    "effect": "Armor Shred (-8%)",
    "description": "Heavy Attack applies 1 stack of Armor Shred (-8%, 4s)"
},
    "nodes": {
      "S1": {
        "name": "Granite Jaw Crush",
        "cooldown": 3.0,
        "description": "Bites with stone-encrusted chelicerae for 50 damage, shredding the target's armor by 10% for 4s (stacks up to 3 times).",
        "animation": "Lunges forward heavily as rocky plates form over its jaws, clamping down with a pebble-shattering crunch.",
        "icon": "Two massive, jagged stone mandibles crushing a cracked shield.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Melee","Single-Target","Debuff (Armor Shred)"],
        "damage": "50 (+70% Heavy ATK) • -10% Armor (stacks 3x)",
        "range": "2.5m Melee",
        "duration": "Debuff: 4s"
      },
      "S2": {
        "name": "Burrow Tunnel",
        "cooldown": 8.0,
        "description": "Digs underground for up to 2.5s, becoming untargetable by projectiles, moving at +20% speed, and emerging to deal 40 damage.",
        "animation": "Rapidly claws dirt outward, dives into a crumbling hole, moves as a rumbling dirt mound, and bursts back up.",
        "icon": "A spider emerging half-way out of a cracked earthen burrow hole.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Mobility (Subterranean)","Untargetable","AoE"],
        "damage": "Untargetable underground; 40 (+50% Heavy ATK) on emerge",
        "range": "7m Tunnel",
        "duration": "Burrow: 2.5s"
      },
      "S3": {
        "name": "Seismic Stomp",
        "cooldown": 7.0,
        "description": "Slams front four legs to send a 4m shockwave that deals 45 damage and applies **Tremor** (grounds airborne foes and disables jumps for 2s).",
        "animation": "Rears up high and crashes front legs down, fracturing the floor in concentric brown-amber rings.",
        "icon": "Two heavy spider legs slamming into fractured earth with shockwave lines.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["AoE","CC (Ground / Jump-Lock)"],
        "damage": "45 (+65% Heavy ATK) • Grounds airborne foes (2s)",
        "range": "4m Radius",
        "duration": "Instant"
      },
      "S4": {
        "name": "Shale Armor Plating",
        "cooldown": 10.0,
        "description": "Compacts loose earth and stone onto its back, gaining a 90 HP rock shield for 4s and immunity to knockbacks.",
        "animation": "Shakes body as gravel and slate slabs magnetically pull from the ground and lock over its cephalothorax and abdomen.",
        "icon": "A wolf spider carapace armored with interlocking hexagonal stone plates.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Defense (Shield)","CC Immunity (Knockback)"],
        "damage": "90 HP Shield (+15% Max HP) • Knockback immune",
        "range": "Self",
        "duration": "Shield: 4s"
      },
      "S5": {
        "name": "Tectonic Maul",
        "cooldown": 6.0,
        "description": "Grabs an enemy in front, lifts them slightly, and slams them into the dirt for 75 damage; deals +25 bonus damage if their armor is shredded.",
        "animation": "Clamps target with stone-coated pedipalps, heaves upward, and violently body-slams them into a dust cloud.",
        "icon": "Stone-clad spider arms slamming a cracked target into the ground.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S1"
        ],
        "tags": ["Melee","Grab / Slam","Bonus vs Shredded"],
        "damage": "75 (+95% Heavy ATK) • +25 bonus dmg if Armor shredded",
        "range": "2.5m Grab",
        "duration": "Instant"
      },
      "S6": {
        "name": "Sinkhole Breach",
        "cooldown": 9.0,
        "description": "While burrowed or standing, collapses the ground beneath a target 5m away, pulling them inward and dealing 60 damage.",
        "animation": "Dives beneath the surface and erupts directly under the enemy inside a swirling funnel of collapsing dirt and rocks.",
        "icon": "A crumbling earthen sinkhole funnel with glowing amber spider eyes at the center.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S1",
          "S2"
        ],
        "tags": ["AoE","Displacement (Pull)","Mobility"],
        "damage": "60 (+75% Heavy ATK) • Pulls enemies to center",
        "range": "5m Range / 3m AoE",
        "duration": "Instant"
      },
      "S7": {
        "name": "Sandstorm Prowl",
        "cooldown": 11.0,
        "description": "Kicks up a localized 5m swirling grit cloud for 3.5s that moves with the Wolf Spider, slowing nearby enemies by 25% and reducing their vision range.",
        "animation": "Scrapes hind legs violently, enveloping itself in a roaring, abrasive whirlwind of golden-brown sand.",
        "icon": "A glowing pair of wolf spider eyes peering through a swirling desert sandstorm.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S2",
          "S3"
        ],
        "tags": ["AoE (Aura)","CC (Slow + Blind)"],
        "damage": "25% Slow + reduces enemy vision range",
        "range": "3.2m Moving Aura",
        "duration": "Aura: 3.5s"
      },
      "S8": {
        "name": "Faultline Fissure",
        "cooldown": 11.0,
        "description": "Rips a 7m linear crack forward through the ground, dealing 65 damage, applying **Tremor**, and stunning enemies along the fault for 1s.",
        "animation": "Drives both fangs into the floor and wrenches upward, sending a jagged line of erupting rock spikes straight forward.",
        "icon": "A jagged glowing amber canyon fissure splitting dark stone in half.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S3"
        ],
        "tags": ["Line AoE","CC (Stun + Ground)"],
        "damage": "65 (+80% Heavy ATK) • 1s Stun + Tremor",
        "range": "7m Line",
        "duration": "Instant"
      },
      "S9": {
        "name": "Quartz Thorns",
        "cooldown": 10.0,
        "description": "Grows sharp crystalline spikes across its **Shale Armor Plating**; while shielded, increases melee attack damage by 20% and reflects 30% of melee damage taken.",
        "animation": "Flexes legs as jagged amber-quartz crystals burst outward through its stone armor plates.",
        "icon": "A stone carapace bristling with sharp, glowing golden quartz crystals.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S3",
          "S4"
        ],
        "tags": ["Buff (Melee Damage)","Defense (Thorns)"],
        "damage": "+20% Melee DMG & 30% Melee Reflect while shielded",
        "range": "Self",
        "duration": "Buff: 4s"
      },
      "S10": {
        "name": "Bedrock Fortification",
        "cooldown": 15.0,
        "description": "Anchors legs into the earth for 4s, reducing all incoming damage by 25% and regenerating 18 HP/s while remaining mobile at 70% speed.",
        "animation": "Turns dark basalt-gray as heavy stone roots visibly tether its legs to the ground with every heavy step.",
        "icon": "A monolithic stone spider emblem framed by an unbreakable iron-rock bastion.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S4",
          "S9"
        ],
        "tags": ["Defense (Mitigation)","Sustain (HoT)"],
        "damage": "25% Damage Reduction + 18 HP/s heal (-30% speed)",
        "range": "Self",
        "duration": "Buff: 4s"
      },
      "S11": {
        "name": "Obsidian Impale",
        "cooldown": 10.0,
        "description": "Summons a razor-sharp obsidian stalagmite beneath a target, impaling them for 90 damage and causing Bleed (15 damage/s for 3s).",
        "animation": "Stomps a single front leg, causing a glossy black volcanic glass spike to erupt vertically under the enemy.",
        "icon": "A glossy black obsidian spike piercing upward through cracked earth.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S5",
          "S6"
        ],
        "tags": ["Single-Target","DoT (Bleed)"],
        "damage": "90 (+105% Heavy ATK) + 15 dmg/s Bleed (3s)",
        "range": "5.5m Target",
        "duration": "Instant"
      },
      "S12": {
        "name": "Landslide Charge",
        "cooldown": 12.0,
        "description": "Charges forward 8m wrapped in rolling boulders, dragging hit enemies along the path for 70 damage and stunning them for 1.2s if slammed into a wall.",
        "animation": "Lowers armoured head like a battering ram and bulldozes forward surrounded by tumbling rocks and dust.",
        "icon": "An armored spider charging forward at the head of an avalanche of boulders.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S6",
          "S7"
        ],
        "tags": ["Mobility (Charge)","Displacement (Drag)","CC (Stun)"],
        "damage": "70 (+85% Heavy ATK) • Drags foes; 1.2s Wall-Stun",
        "range": "5.5m Charge",
        "duration": "Instant"
      },
      "S13": {
        "name": "Quicksand Pit",
        "cooldown": 14.0,
        "description": "Liquefies a 6m circle of ground into sinking sand for 4s. Enemies inside are progressively slowed from 20% to 70% and cannot use dash or leap skills.",
        "animation": "Vibrates all eight legs rapidly against the floor, turning solid stone into a swirling, golden-brown mud vortex.",
        "icon": "A swirling pit of golden sand pulling a struggling silhouette downward.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S7",
          "S8"
        ],
        "tags": ["AoE (Zone)","CC (Heavy Slow + Dash-Lock)"],
        "damage": "20%→70% escalating Slow • Disables dashes/jumps",
        "range": "3.6m Radius",
        "duration": "Zone: 4s"
      },
      "S14": {
        "name": "Monolith Pillar",
        "cooldown": 14.0,
        "description": "Raises a solid 3m-wide stone pillar from the ground for 5s that blocks movement/projectiles and emits a 4m **Tremor** pulse on creation.",
        "animation": "Hooks front claws into the ground and heaves upward, lifting a massive rune-carved stone obelisk from the earth.",
        "icon": "A towering jagged stone pillar bursting upward from the arena floor.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S8",
          "S9"
        ],
        "tags": ["Terrain / Wall","Projectile Block","AoE"],
        "damage": "Blocks movement/projectiles + 2.5m Tremor pulse",
        "range": "3m Wide Pillar",
        "duration": "Wall: 5s"
      },
      "S15": {
        "name": "Cataclysmic Meteor Slam",
        "cooldown": 20.0,
        "description": "Burrows deep, launches high into the air encased in a giant boulder, and crashes down onto a target area for 155 AoE damage and a 1.8s stun.",
        "animation": "Dives underground, erupts skyward wrapped in a massive craggy rock sphere, and plummets down, shattering the arena floor on impact.",
        "icon": "A giant glowing fissure meteor crashing into a shattered stone arena.",
        "tier": 4,
        "cost": 3,
        "requires": [
          "S11",
          "S12",
          "S13"
        ],
        "tags": ["Ultimate","Mobility (Leap)","AoE","CC (Stun)"],
        "damage": "125 (+104% Heavy ATK) • 1.8s AoE Stun",
        "range": "5.5m Leap / 3m AoE",
        "duration": "Instant"
      },
      "S16": {
        "name": "Continental Bastion",
        "cooldown": 22.0,
        "description": "Raises a 10m ring of jagged canyon walls around the battlefield for 5.5s. Inside, the Wolf Spider gains a 200 HP stone shield and its attacks trigger mini-aftershocks.",
        "animation": "Roars and slams all eight legs sequentially, causing towering stone cliffs to erupt in a full circle around both combatants.",
        "icon": "A circular fortress of jagged stone cliffs surrounding an amber spider crest.",
        "tier": 4,
        "cost": 3,
        "requires": [
          "S10",
          "S13",
          "S14"
        ],
        "tags": ["Ultimate","Terrain / Arena Cage","Defense","AoE"],
        "damage": "Traps foes in canyon ring • 160 HP Shield + aftershocks",
        "range": "6m Arena Ring",
        "duration": "Duration: 4.5s"
      }
    }
  },
  "lynx": {
    "name": "Lynx Spider",
    "element": "Nature",
    "innatePassive": {
    "name": "Toxic Fang",
    "trigger": "Heavy Attack",
    "effect": "Toxin (3s)",
    "description": "Heavy Attack applies Toxin (-30% healing, 5 dmg/s for 3s)"
},
    "nodes": {
      "S1": {
        "name": "Caustic Sap Spit",
        "cooldown": 2.5,
        "description": "Spits a glob of venomous plant sap up to 9m away, dealing 40 damage and applying **Toxin** (reduces healing by 30% and deals 5 poison damage/s for 4s).",
        "animation": "Juts green cephalothorax forward and launches a glowing lime-green liquid projectile that splatters acidically.",
        "icon": "A glowing lime-green venom droplet dripping from two thorny fangs.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Projectile","Single-Target","DoT","Debuff (Anti-Heal)"],
        "damage": "40 (+65% Light ATK) • -30% Healing + 5 dmg/s (4s)",
        "range": "9m Line",
        "duration": "Debuff: 4s"
      },
      "S2": {
        "name": "Vine Swing Leap",
        "cooldown": 6.0,
        "description": "Shoots a living vine tendril to vault 6m in any direction; landing in or near nature hazards grants 25% movement speed for 2s.",
        "animation": "Extends a leafy green vine from spinnerets, swings gracefully in a low arc, and lands lightly on spiny legs.",
        "icon": "A vibrant green vine curled into a hook with small pointed leaves.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Mobility (Grapple-Leap)","Buff (Speed)"],
        "damage": "Vaults 6m; +25% Move Speed near nature hazards (2s)",
        "range": "6m Leap",
        "duration": "Instant"
      },
      "S3": {
        "name": "Briar Thicket Snare",
        "cooldown": 9.0,
        "description": "Seeds a 3.5m patch of thorny brambles. Enemies moving through it take 15 damage per meter traveled and bleed **Leech** spores that heal the Lynx Spider for 10 HP/s.",
        "animation": "Tosses three glowing green seeds that instantly sprout into a tangled mat of rose-like thorns and vines.",
        "icon": "A tangled knot of emerald vines covered in sharp crimson thorns.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["AoE (Zone)","Trap / Hazard","Sustain (Leech)"],
        "damage": "15 dmg/m walked + heals Lynx 10 HP/s",
        "range": "3.5m Radius",
        "duration": "Patch: 6s"
      },
      "S4": {
        "name": "Chlorophyll Camouflage",
        "cooldown": 11.0,
        "description": "Blends into the environment to become invisible for 3s; the next attack from stealth deals +35 bonus damage and refreshes **Toxin**.",
        "animation": "Shimmers with a leafy green wave from head to abdomen, fading into translucent foliage shimmer.",
        "icon": "A spider silhouette half-morphed into a serrated green leaf.",
        "tier": 1,
        "cost": 0,
        "requires": [],
        "tags": ["Stealth (Invisibility)","Buff (Empowered Hit)"],
        "damage": "Invisible for 3s • Next hit deals +35 bonus dmg",
        "range": "Self",
        "duration": "Stealth: 3s"
      },
      "S5": {
        "name": "Neurotoxin Volley",
        "cooldown": 6.0,
        "description": "Fires a 3-shot fan of venom needles up to 8m. Each needle deals 30 damage; hitting a target with at least 2 needles slows their attack speed by 25%.",
        "animation": "Rapidly flicks head left-center-right, spitting three sharp emerald darts in a cone spread.",
        "icon": "Three glowing green thorn-needles flying in a spread formation.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S1"
        ],
        "tags": ["Projectile","Cone AoE","Debuff (ATK Speed Slow)"],
        "damage": "3 × 30 (+40% Light ATK each) • -25% ATK Speed if 2+ hit",
        "range": "8m Cone",
        "duration": "Debuff: 3s"
      },
      "S6": {
        "name": "Needle-Leaf Pounce",
        "cooldown": 7.5,
        "description": "Darts forward 5m with leg spines erect to stab a foe for 60 damage, then immediately backsteps 4m to ranged kiting distance.",
        "animation": "Flashes forward in a swirl of razor-sharp leaves, pierces the target with thorny front legs, and springs backward.",
        "icon": "A thorny green spider leg striking forward amidst swirling razor leaves.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S1",
          "S2"
        ],
        "tags": ["Mobility (Dash-Retreat)","Single-Target"],
        "damage": "60 (+80% Heavy ATK) • Auto-backflips 4m after hit",
        "range": "5m Dash",
        "duration": "Instant"
      },
      "S7": {
        "name": "Spore Cloud Retreat",
        "cooldown": 10.0,
        "description": "Leaps backward while bursting a puffball sac, leaving a 4m yellow-green spore cloud that applies **Toxin** and disorients enemy movement inputs for 1s.",
        "animation": "Backflips off the ground as a bloated fungal pod on its spinnerets pops into glittering neon-green pollen.",
        "icon": "A bursting fungal puffball releasing glowing neon-green spore clouds.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S2",
          "S3"
        ],
        "tags": ["Mobility (Backflip)","AoE (Zone)","CC (Confuse)"],
        "damage": "Applies Toxin + inverts enemy movement inputs (1s)",
        "range": "4m Backflip / 4m Cloud",
        "duration": "Cloud: 3s"
      },
      "S8": {
        "name": "Strangler Root Bind",
        "cooldown": 11.0,
        "description": "Commands underground roots to erupt and wrap a **Toxined** enemy, rooting them in place for 1.6s and draining 40 HP to the Lynx Spider.",
        "animation": "Taps front legs twice as thick, woody roots burst from the floor and coil tightly around the target while glowing green energy flows back.",
        "icon": "Woody gnarled roots coiling around a glowing red life-force orb.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S3"
        ],
        "tags": ["Single-Target","CC (Root)","Sustain (Life Drain)"],
        "damage": "Roots Toxined foe 1.6s • Drains 40 HP (+50% Light ATK)",
        "range": "7m Range",
        "duration": "Root: 1.6s"
      },
      "S9": {
        "name": "Barkskin Symbiosis",
        "cooldown": 10.0,
        "description": "Hardens exoskeleton into living fibrous bark for 4s, reducing incoming damage by 25% and sprouting thorns that poison melee attackers.",
        "animation": "Brown oak bark and green moss rapidly grow over the carapace, with sharp rose thorns protruding from the joints.",
        "icon": "A wooden bark shield overgrown with glowing green moss and thorns.",
        "tier": 2,
        "cost": 1,
        "requires": [
          "S3",
          "S4"
        ],
        "tags": ["Defense (Mitigation)","Thorns (Poison)"],
        "damage": "25% Damage Reduction • Applies Toxin to melee attackers",
        "range": "Self",
        "duration": "Buff: 4s"
      },
      "S10": {
        "name": "Photosynthetic Mend",
        "cooldown": 14.0,
        "description": "Draws solar-nature energy for 3s to heal 75 HP directly, plus 50% increased healing while standing inside a **Briar Thicket** or **Camouflage**.",
        "animation": "Spreads all eight spiny legs wide as warm golden-green light beams down onto its body and vibrant flowers bloom beneath its feet.",
        "icon": "A glowing green leaf-spider bathed in a warm golden sunbeam.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S4",
          "S9"
        ],
        "tags": ["Sustain (Heal)"],
        "damage": "Heals 75 HP (+50% Light ATK); +50% heal in Briar/Stealth",
        "range": "Self",
        "duration": "Over 3s"
      },
      "S11": {
        "name": "Necrotic Bloom Bite",
        "cooldown": 10.0,
        "description": "Injects a parasitic seed into an enemy (or spits it at 6m range) for 65 damage; after 2s, a thorny flower bursts from the target for 55 AoE damage.",
        "animation": "Strikes with glowing purple-green fangs, planting a pulsing bulb on the enemy that blooms violently into jagged briars.",
        "icon": "A predatory Venus-flytrap blossom bursting open with venomous purple fangs.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S5",
          "S6"
        ],
        "tags": ["Single-Target","Delayed AoE Burst"],
        "damage": "65 (+80% Heavy ATK) + 55 (+70% Light ATK) burst after 2s",
        "range": "6m Range / 3.5m Burst",
        "duration": "Delay: 2s"
      },
      "S12": {
        "name": "Canopy Ambush",
        "cooldown": 12.0,
        "description": "Swings high on an overhead vine and drops down stealthily at a target location within 8m, dealing 75 damage and resetting **Caustic Sap Spit**.",
        "animation": "Shoots a vine upward, vanishes into a canopy leaf-flutter overhead, and drops down in a burst of emerald petals.",
        "icon": "A camouflaged spider dropping downward from an overhanging leafy branch.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S6",
          "S7"
        ],
        "tags": ["Mobility (Teleport-Drop)","AoE","Cooldown Reset"],
        "damage": "75 (+90% Heavy ATK) • Resets S1 Caustic Sap Spit",
        "range": "8m Range / 3m AoE",
        "duration": "Instant"
      },
      "S13": {
        "name": "Hallucinogenic Pollen",
        "cooldown": 14.0,
        "description": "Fires a concentrated pollen pod that bursts in a 4m area, dealing 50 damage and causing enemies to see 2 fake Lynx Spider clones attacking them for 2.5s.",
        "animation": "Hurls a glowing magenta-green flower bud that explodes into psychedelic swirling spores and ghostly green spider illusions.",
        "icon": "A glowing magenta-and-green flower releasing hypnotic spiral pollen.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S7",
          "S8"
        ],
        "tags": ["AoE","Decoy / Illusion"],
        "damage": "50 (+60% Light ATK) • Spawns 2 fake attacking clones",
        "range": "4m Range / 2.4m AoE",
        "duration": "Clones: 2.5s"
      },
      "S14": {
        "name": "Overgrowth Barricade",
        "cooldown": 15.0,
        "description": "Sprouts a dense wall of living briar hedges (6m wide) for 4.5s that blocks movement and lashes out with vines at enemies within 2m for 25 damage/s.",
        "animation": "Sweeps pedipalps upward as a massive, writhing hedge of thorny vines and snapping flytrap buds erupts from the floor.",
        "icon": "A dense wall of snapping thorny vines and glowing green briars.",
        "tier": 3,
        "cost": 2,
        "requires": [
          "S8",
          "S9"
        ],
        "tags": ["Terrain / Wall","AoE (DoT)"],
        "damage": "Blocks movement • Lashes foes within 2m for 25 dmg/s",
        "range": "3.6m Wide Wall",
        "duration": "Wall: 4.5s"
      },
      "S15": {
        "name": "Viper-Vine Execution",
        "cooldown": 20.0,
        "description": "Unleashes four giant venomous viper-vines from spinnerets that lash forward 10m, impaling the target for 145 damage, pulling them into a **Briar Thicket**, and draining 75 HP.",
        "animation": "Rears up as four colossal, serpent-headed thorny vines burst from behind it, strike the enemy simultaneously, and siphon glowing green life energy back.",
        "icon": "Four serpent-shaped thorny vines striking inward with dripping emerald venom.",
        "tier": 4,
        "cost": 3,
        "requires": [
          "S11",
          "S12",
          "S13"
        ],
        "tags": ["Ultimate","Line / Multi-Tendril","Displacement (Pull)","Sustain"],
        "damage": "116 (+96% Light ATK) • Pulls into Briar + drains 60 HP",
        "range": "6m Line",
        "duration": "Instant"
      },
      "S16": {
        "name": "Primeval Jungle Domain",
        "cooldown": 22.0,
        "description": "Overgrows an 9m radius into a dense jungle canopy for 6s. Inside, the Lynx Spider re-enters stealth every 1.5s when not attacking, gains +30% ranged spit speed, and enemies suffer constant **Toxin**.",
        "animation": "Releases a burst of emerald spores that instantly covers the arena floor in lush ferns, glowing toxic flowers, and hanging canopy vines.",
        "icon": "A glowing emerald spider emblem crowned by a lush, overgrown jungle canopy.",
        "tier": 4,
        "cost": 3,
        "requires": [
          "S10",
          "S13",
          "S14"
        ],
        "tags": ["Ultimate","AoE (Zone)","Stealth","DoT (Poison)"],
        "damage": "Re-stealths every 1.5s, +30% spit speed, permanent Toxin",
        "range": "5.5m Radius",
        "duration": "Duration: 5s"
      }
    }
  }
} as const;

export type SkillNodeId = keyof typeof SKILL_CATALOG.weaver.nodes;
export type SkillSpecies = keyof typeof SKILL_CATALOG;

const ICON_MOTIFS: readonly [RegExp, string][] = [
  [/thread|silk|cord|line|tether/, 'thread'],
  [/droplet|water|dew|hydro|aqua|moisture/, 'dew'],
  [/web|snare|trap|root|bind/, 'snare'],
  [/fang|jaw|mandible|chelicera|bite/, 'fang'],
  [/wind|air|gust|breeze|storm|squall/, 'rush'],
  [/flame|fire|ember|cinder|lava|molten|volcan/, 'burst'],
  [/stone|rock|granite|earth|quartz|obsidian|boulder/, 'plate'],
  [/thorn|briar|spine|needle|bristle/, 'spine'],
  [/leaf|vine|plant|jungle|canopy/, 'leaf'],
  [/eye|vision|focus/, 'eye'],
  [/shield|armor|carapace|shell/, 'shield'],
  [/leap|jump|vault/, 'leap'],
  [/spiral|vortex|whirlpool|cyclone/, 'reel'],
  [/cloud|fog|mist|smoke|spore/, 'veil'],
  [/target|mark/, 'target'],
  [/heart|heal|regen/, 'mend']
];

export function skillArtForBrief(brief: string, fallback: readonly [string, string]): readonly [string, string] {
  const lower = brief.toLowerCase();
  const motifs = ICON_MOTIFS.map(([pattern, mark]) => ({ at: lower.search(pattern), mark }))
    .filter(entry => entry.at >= 0).sort((a, b) => a.at - b.at);
  const unique = [...new Set(motifs.map(entry => entry.mark))];
  return [unique[0] || fallback[0], unique[1] || fallback[1]];
}

export const SKILL_NODE_IDS = Object.keys(SKILL_CATALOG.weaver.nodes) as SkillNodeId[];
export const STARTER_SKILLS = SKILL_NODE_IDS.slice(0, 4);
export const ABILITY_SLOTS = ['dash', 'web', 'surge', 'power', 'shield', 'mend', 'carapace', 'pounce', 'sweep', 'spit', 'anchor', 'riposte', 'tremor', 'haste', 'hook', 'leech'] as const;

export function nodeForAbility(id: string): SkillNodeId | undefined {
  const index = ABILITY_SLOTS.findIndex(slot => slot === id);
  return index < 0 ? undefined : SKILL_NODE_IDS[index];
}

export function abilityForNode(id: string): typeof ABILITY_SLOTS[number] | undefined {
  const index = SKILL_NODE_IDS.indexOf(id as SkillNodeId);
  return index < 0 ? undefined : ABILITY_SLOTS[index];
}

export function skillPointsForLevel(level: number): number {
  return Number.isFinite(level) ? Math.max(0, Math.min(21, Math.floor(level) - 1)) : 0;
}

export function validateSkillTree(species: SkillSpecies, value: unknown, level: number): SkillNodeId[] {
  const unlocked: SkillNodeId[] = [...STARTER_SKILLS];
  let spent = 0;
  if (!Array.isArray(value)) return unlocked;
  for (const id of value) {
    if (!SKILL_NODE_IDS.includes(id) || unlocked.includes(id)) continue;
    const node = SKILL_CATALOG[species].nodes[id as SkillNodeId];
    if (node.requires.every(required => unlocked.includes(required as SkillNodeId)) && spent + node.cost <= skillPointsForLevel(level)) {
      unlocked.push(id);
      spent += node.cost;
    }
  }
  return unlocked;
}
