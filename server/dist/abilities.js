"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_ABILITY_IDS = exports.SKILLS_LIST = exports.ABILITIES = void 0;
exports.getAbility = getAbility;
exports.shuffle = shuffle;
exports.getRandomAbilities = getRandomAbilities;
exports.ABILITIES = {
    dash: {
        id: 'dash',
        name: 'Dash',
        cd: 3,
        use: 'stand',
        icon: 'ic-dash',
        unlock: { level: 1 },
        desc: 'A quick hop with a moment of invulnerability.'
    },
    web: {
        id: 'web',
        name: 'Web',
        cd: 5,
        use: 'stand',
        icon: 'ic-web',
        unlock: { level: 1 },
        desc: 'Tangles and slows your rival for 1.6 seconds. A perfect block reflects it.'
    },
    surge: {
        id: 'surge',
        name: 'Surge',
        cd: 5,
        use: 'hang',
        icon: 'ic-surge',
        unlock: { level: 1 },
        desc: 'Only while dangling: one big pull worth about six taps.'
    },
    power: {
        id: 'power',
        name: 'Power Strike',
        cd: 8,
        use: 'stand',
        icon: 'ic-power',
        unlock: { level: 1 },
        desc: 'Your next strike within 5 seconds hits for 36 grip and shoves much harder.'
    },
    shield: {
        id: 'shield',
        name: 'Iron Silk',
        cd: 11,
        use: 'stand',
        icon: 'ic-shield',
        unlock: { level: 1 },
        desc: 'A silk bubble that absorbs the next hit or shot within 4 seconds.'
    },
    mend: {
        id: 'mend',
        name: 'Mend',
        cd: 12,
        use: 'stand',
        icon: 'ic-mend',
        unlock: { level: 2 },
        desc: 'Patch yourself up and restore 35 grip.'
    },
    carapace: {
        id: 'carapace',
        name: 'Carapace',
        cd: 12,
        use: 'stand',
        icon: 'ic-carapace',
        unlock: { level: 3 },
        desc: 'Harden your shell: your guard bar refills instantly and a guard break is cleared.'
    },
    pounce: {
        id: 'pounce',
        name: 'Pounce',
        cd: 6,
        use: 'stand',
        icon: 'ic-pounce',
        unlock: { level: 4 },
        desc: 'Lunge across the twig and strike in one move.'
    },
    sweep: {
        id: 'sweep',
        name: 'Sweep',
        cd: 8,
        use: 'stand',
        icon: 'ic-sweep',
        unlock: { level: 5 },
        desc: 'A low leg sweep: 10 grip and a big shove. Can knock a rival off the end. You are open if it whiffs.'
    },
    spit: {
        id: 'spit',
        name: 'Venom Spit',
        cd: 7,
        use: 'stand',
        icon: 'ic-spit',
        unlock: { level: 6 },
        desc: 'A fast shot that stuns your rival for almost a second.'
    },
    anchor: {
        id: 'anchor',
        name: 'Anchor Line',
        cd: 11,
        use: 'hang',
        icon: 'ic-anchor',
        unlock: { level: 7 },
        desc: 'Only while dangling: your thread stops sinking for 2.5 seconds, so you can climb in peace.'
    },
    riposte: {
        id: 'riposte',
        name: 'Riposte',
        cd: 11,
        use: 'stand',
        icon: 'ic-riposte',
        unlock: { level: 8 },
        desc: 'For 1 second, the next hit on you is cancelled and your attacker is stunned.'
    },
    tremor: {
        id: 'tremor',
        name: 'Tremor',
        cd: 9,
        use: 'stand',
        icon: 'ic-tremor',
        unlock: { level: 9 },
        desc: 'Shake the twig. A nearby rival who is not blocking is stunned.'
    },
    haste: {
        id: 'haste',
        name: 'Haste',
        cd: 10,
        use: 'stand',
        icon: 'ic-haste',
        unlock: { level: 10 },
        desc: 'Move 50% faster for 3.5 seconds.'
    },
    hook: {
        id: 'hook',
        name: 'Silk Hook',
        cd: 7,
        use: 'stand',
        icon: 'ic-hook',
        unlock: { level: 11 },
        desc: 'Fire a hook that yanks your rival right up to you and stuns them briefly.'
    },
    leech: {
        id: 'leech',
        name: 'Leech Fang',
        cd: 7,
        use: 'stand',
        icon: 'ic-leech',
        unlock: { level: 12 },
        desc: 'Your next hit within 5 seconds also heals you for 20 grip.'
    }
};
exports.SKILLS_LIST = [
    exports.ABILITIES.dash,
    exports.ABILITIES.web,
    exports.ABILITIES.surge,
    exports.ABILITIES.power,
    exports.ABILITIES.shield,
    exports.ABILITIES.mend,
    exports.ABILITIES.carapace,
    exports.ABILITIES.pounce,
    exports.ABILITIES.sweep,
    exports.ABILITIES.spit,
    exports.ABILITIES.anchor,
    exports.ABILITIES.riposte,
    exports.ABILITIES.tremor,
    exports.ABILITIES.haste,
    exports.ABILITIES.hook,
    exports.ABILITIES.leech
];
exports.ALL_ABILITY_IDS = exports.SKILLS_LIST.map(s => s.id);
function getAbility(id) {
    return exports.ABILITIES[id] || exports.ABILITIES.dash;
}
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = a[i];
        a[i] = a[j];
        a[j] = t;
    }
    return a;
}
function getRandomAbilities(count = 3, exclude = [], maxLevel = 12) {
    const pool = exports.SKILLS_LIST
        .filter(s => s.unlock.level <= maxLevel && !exclude.includes(s.id))
        .map(s => s.id);
    const finalPool = pool.length >= count ? pool : exports.ALL_ABILITY_IDS;
    return shuffle(finalPool).slice(0, count);
}
