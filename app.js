const express = require('express');
const app = express();
const hbs = require('express-hbs');
const fs = require('fs');
const path = require('path');
const md = require('markdown-it')()
    .use(require('markdown-it-container'), 'aside', {
        validate: function (params) {
            return params.trim().match(/^aside\s+(.*)$/);
        },

        render: function (tokens, idx) {
            var m = tokens[idx].info.trim().match(/^aside\s+(.*)$/);

            if (tokens[idx].nesting === 1) {
                // opening tag
                return '<aside><table><thead><tr><th>' + md.utils.escapeHtml(m[1]) + '</th></tr></thead><tbody><tr><td>\n';

            } else {
                // closing tag
                return '</td></tr></tbody></table></aside>\n';
            }
        }
    });
const bodyParser = require('body-parser');
const session = require('express-session');
const { request } = require('http');

app.engine('hbs', hbs.express4({
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    defaultLayout: path.join(__dirname, '/views/layouts/main_layout'),
    extname: '.hbs'
}));

app.use(session({
    secret: 'MasterSecret',
    resave: true,
    saveUnitialized: true,
}));

hbs.registerHelper('mirror', function (aFile, options) {
    if (fs.existsSync(__dirname + '/data/' + aFile + '.json')) {
        const data = JSON.parse(fs.readFileSync(__dirname + '/data/' + aFile + '.json', 'utf-8'));
        return options.fn(data);
    } else {
        return '';
    }
});

hbs.registerHelper('ifeq', function (a, b, options) {
    if (a == b) { return options.fn(this); }
    return options.inverse(this);
});

hbs.registerHelper('md', function (aMarkdown, options) {
    return md.render(aMarkdown);
});


hbs.registerHelper('dateOnly', function (aDate) {
    try {
        return new Date(aDate).toISOString().split('T')[0]
    } catch (e) {
        return aDate;
    }
});


app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views/partials');

app.use(express.static('static'));

app.get('/find', (req, res) => {
    const p = req.params.query.trim();
    if (fs.existsSync(__dirname + '/data/' + p)) {
        const data = JSON.parse(fs.readFileSync(__dirname + '/data/' + p + '.json', 'utf-8'));
        data.layout = 'main_layout.hbs';
        res.render('find', data);
    } else {
        const data = {};
        if (p) {
            data.notfound = true;
        }
        res.render('find', data);
    }
});

app.get('/calculate', (req, res) => {
    const data = {
        _view: 'calc',
        layout: 'calc_layout',
        actions: {
            'call_a_shot': {
                label: 'Call a Shot',
                type: 'ranged',
                actionType: 'free',
                typeOfTest: 'none'
            },
            'change_linked_device_mode': {
                label: 'Change linked Device Mode',
                type: 'none',
                actionType: 'free',
                typeOfTest: 'none'
            },
            'drop_object': {
                label: 'Drop Object',
                type: 'none',
                actionType: 'free',
                typeOfTest: 'none'
            },
            'drop_prone': {
                label: 'Drop Prone',
                type: 'none',
                actionType: 'free',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A character may not drop prone when surprised'
                }
            },
            'eject_smartgun_clip': {
                label: 'Eject Smartgun Clip',
                type: 'none',
                actionType: 'free',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A separate simple action to insert a new, fresh clip is still required'
                }
            },
            'gesture': {
                label: 'Gesture',
                type: 'none',
                actionType: 'free',
                typeOfTest: 'none',
                testParameter: {
                    note: 'Characters unfamiliar with the gestures may make an Intuition (2) Test to determine what the gesture means.'
                }
            },
            'multiple_attacks': {
                label: 'Multiple Attacks',
                type: 'none',
                actionType: 'free',
                typeOfTest: 'none',
                testParameter: {
                    note: 'This Action needs to be combined with a Fire Weapon Action, Throw Weapon Action, Melee Attack Action, Reckless Spellcasting, or Cast Spell Action.'
                }
            },
            'run': {
                label: 'Run',
                type: 'none',
                actionType: 'free',
                typeOfTest: 'none',
                testParameter: {
                    note: 'Allows the character to move beyond the Walking Movement Rate in a single Combat Turn.'
                }
            },
            'speak_text_transmit_phrase': {
                label: 'Speak/Text/Transmit Phrase',
                type: 'none',
                actionType: 'free',
                typeOfTest: 'none',
                testParameter: {
                    note: 'One short phrase of verbal communication is a Free Action.'
                }
            },
            'activate_focus': {
                label: 'Activate Focus',
                type: 'spellcasting',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A character may activate a focus they are carrying with a Simple Action.'
                }
            },
            'call_spirit': {
                label: 'Call Spirit',
                type: 'spellcasting',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'This action is used to call a spirit that has already been summoned and placed on standby.'
                }
            },
            'change_device_mode': {
                label: 'Change Device Mode',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A Character may use a Simple Action to activate, deactivate, or change the mode on any device.'
                }
            },
            'change_gun_mode': {
                label: 'Change Gun Mode',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A character holding a ready firearm can change its fireing mode via a Simple Action.'
                }
            },
            'command_spirit': {
                label: 'Command Spirit',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'Issuing a command to a single spirit or group of spirits under a summoner\'s control is a Simple Action.'
                }
            },
            'dismiss_spirit': {
                label: 'Dismiss Spirit',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'This is the action of freeing a spirit from the summoner\'s control.'
                }
            },
            'fire_bow': {
                label: 'Fire Bow',
                type: 'ranged',
                actionType: 'simple',
                typeOfTest: 'opposed',
                testParameter: {
                    attackerSkill: 'Weapon Skill',
                    attackerAbility: 'Agility',
                    attackerLimit: 'Accuracy',
                    hasAttackerLimit: 'true',
                    opposedSkill: 'Reaction',
                    opposedAbility: 'Intuition',
                    opposedLimit: '',
                    hasOpposedLimit: 'false',
                    note: 'To nock a single arrow, the character must use the Reload Weapon Simple Action.'
                }
            },
            'fire_simple_action': {
                label: 'Fire Semi-Auto, Single-shot, Burst Fire or Full-Auto',
                type: 'ranged',
                actionType: 'simple',
                typeOfTest: 'opposed',
                testParameter: {
                    attackerSkill: 'Weapon Skill',
                    attackerAbility: 'Agility',
                    attackerLimit: 'Accuracy',
                    hasAttackerLimit: 'true',
                    opposedSkill: 'Reaction',
                    opposedAbility: 'Intuition',
                    opposedLimit: '',
                    hasOpposedLimit: 'false',
                }
            },
            'insert_clip': {
                label: 'Insert Clip',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A character may insert a fresh clip into a ready firearm by taking a Simple Action.'
                }
            },
            'observe_in_detail': {
                label: 'Observe in Detail',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'test',
                testParameter: {
                    attackerSkill: 'Perception',
                    attackerAbility: 'Intuition',
                    attackerLimit: 'Mental',
                    hasAttackerLimit: 'true',
                }
            },
            'pickup_putdown_object': {
                label: 'Pick up/Put down Object',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A character may pick up an object within reach or put down one that he was holding as a Simple Action.'
                }
            },
            'quick_draw': {
                label: 'Quick Draw',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'test',
                testParameter: {
                    attackerSkill: 'Weapon Skill',
                    attackerAbility: 'reaction',
                    attackerLimit: 'Physical',
                    hasAttackerLimit: 'true',
                    threshold: '2',
                    note: 'On a success, the character draws the weapon and fires as a single Simple Action. On a failure, the character clears the weapon but cannot fire with the same action.'
                }
            },
            'ready_weapon': {
                label: 'Ready Weapon',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A character may ready a weapon by spending a Simple Action.'
                }
            },
            'remove_clip': {
                label: 'Remove Clip',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A character may remove a clip from a ready firearm by taking a Simple Action.'
                }
            },
            'shift_perception': {
                label: 'Shift Perception',
                type: 'spellcasting',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A character capable of Astral Perception may shift perception to or from Astral Space as a Simple Action.'
                }
            },
            'stand_up': {
                label: 'Stand up',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'test',
                testParameter: {
                    attackerSkill: 'Body',
                    attackerAbility: 'Willpower',
                    hasAttackerLimit: 'false',
                    threshold: '2',
                    note: 'A character may stand up as a simple action, but needs to make a test when he is wounded.'
                }
            },
            'reckless_spellcasting': {
                label: 'Reckless Spellcasting',
                type: 'spellcasting',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A spellcaster may use a Simple Action to cast a spell more quickly, but at the cost of higher Drain.'
                }
            },
            'take_aim': {
                label: 'Take Aim',
                type: 'ranged',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'Each Take Aim adds +1 dice pool and +1 Accuracy to the next Attack Test. When using Image Magnification or a targeting Scope the first Take Aim does not increase this.'
                }
            },
            'take_cover': {
                label: 'Take Cover',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A character may take cover when not surprised.'
                }
            },
            'throw_weapon': {
                label: 'Throw Weapon',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'opposed',
                testParameter: {
                    attackerSkill: 'Weapon Skill',
                    attackerAbility: 'Agility',
                    attackerLimit: 'Accuracy',
                    hasAttackerLimit: 'true',
                    opposedSkill: 'Reaction',
                    opposedAbility: 'Intuition',
                    opposedLimit: '',
                    hasOpposedLimit: 'false',
                }
            },
            'use_simple_device': {
                label: 'Use Simple Device',
                type: 'none',
                actionType: 'simple',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A character can use any simple device with a Simple Action.'
                }
            },
            'use_sensors': {
                label: 'Use Sensors',
                type: 'vehicle',
                actionType: 'simple',
                typeOfTest: 'test',
                testParameter: {
                    attackerSkill: 'Perception',
                    attackerAbility: 'Intuition',
                    attackerLimit: ['Mental', 'Sensor Rating'],
                    hasAttackerLimit: 'true',
                    opposedSkill: 'Sneaking',
                    opposedAbility: 'Intuition',
                    opposedLimit: '',
                    hasOpposedLimit: 'false'
                }
            },
            'use_simple_device': {
                label: 'Use simple device',
                type: 'vehicle',
                actionType: 'simple',
                typeOfTest: 'none',
            },
            'astral_projection': {
                label: 'Astral Projection',
                type: 'spellcasting',
                actionType: 'complex',
                typeOfTest: 'none',
                testParameter: {
                    note: 'see p.313'
                }
            },
            'banish_spirit': {
                label: 'Banish Spirit',
                type: 'spellcasting',
                actionType: 'complex',
                typeOfTest: 'none',
                testParameter: {
                    note: 'see p.301'
                }
            },
            'cast_spell': {
                label: 'Cast Spell',
                type: 'spellcasting',
                actionType: 'complex',
                typeOfTest: 'none',
                testParameter: {
                    note: ''
                }
            },
            'fire_complex_action': {
                label: 'Fire Full-Auto Weapon, Long Burst or Semi-Auto',
                type: 'ranged',
                actionType: 'complex',
                typeOfTest: 'opposed',
                testParameter: {
                    attackerSkill: 'Weapon Skill',
                    attackerAbility: 'Agility',
                    attackerLimit: 'Accuracy',
                    hasAttackerLimit: 'true',
                    opposedSkill: 'Reaction',
                    opposedAbility: 'Intuition',
                    opposedLimit: '',
                    hasOpposedLimit: 'false',
                }
            },
            'load_and_fire_bow': {
                label: 'Load and Fire Bow',
                type: 'ranged',
                actionType: 'complex',
                typeOfTest: 'opposed',
                testParameter: {
                    attackerSkill: 'Weapon Skill',
                    attackerAbility: 'Agility',
                    attackerLimit: 'Accuracy',
                    hasAttackerLimit: 'true',
                    opposedSkill: 'Reaction',
                    opposedAbility: 'Intuition',
                    opposedLimit: '',
                    hasOpposedLimit: 'false',
                }
            },
            'matrix_actions': {
                label: 'Matrix Actions',
                type: 'matrix',
                actionType: 'complex',
                typeOfTest: 'none',
                testParameter: {
                    note: 'see separate matrix actions'
                }
            },
            'melee_attack': {
                label: 'Melee Attack',
                type: 'melee',
                actionType: 'complex',
                typeOfTest: 'opposed',
                testParameter: {
                    attackerSkill: 'Weapon Skill',
                    attackerAbility: 'Agility',
                    attackerLimit: 'Accuracy',
                    hasAttackerLimit: 'true',
                    opposedSkill: 'Reaction',
                    opposedAbility: 'Intuition',
                    opposedLimit: '',
                    hasOpposedLimit: 'false',
                    note: 'See p. 184'
                }
            },
            'reload_firearm': {
                label: 'Reload Firearm',
                type: 'reload',
                actionType: 'complex',
                typeOfTest: 'none',
                testParameter: {
                    note: 'See p. 163'
                }
            },
            'rigger_jump_in': {
                label: 'Rigger Jump In',
                type: 'rigger',
                actionType: 'complex',
                typeOfTest: 'none',
                testParameter: {
                    note: 'Rigger jumps into a vehicle with a Complex Action.'
                }
            },
            'sprint': {
                label: 'Sprint',
                type: 'none',
                actionType: 'complex',
                typeOfTest: 'test',
                testParameter: {
                    attackerSkill: 'Running',
                    attackerAbility: 'Strength',
                    attackerLimit: 'Phyiscal',
                    hasAttackerLimit: 'true',
                    note: 'Sprinting allows a character to increase his Running rate by using a Complex Action.'
                }
            },
            'summoning': {
                label: 'Summoning',
                type: 'spellcasting',
                actionType: 'complex',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A character may summon a spirit to assist them with a Complex Action.'
                }
            },
            'use_skill': {
                label: 'Use Skill',
                type: 'none',
                actionType: 'complex',
                typeOfTest: 'none',
                testParameter: {
                    note: 'A Character may use an appropriate skill by taking a Complex Action.'
                }
            },
            'control_vehicle': {
                label: 'Control Vehicle',
                type: 'vehicle',
                actionType: 'complex',
                typeOfTest: 'test',
                testParameter: {
                    attackerSkill: 'vehicle skill',
                    attackerAbility: 'Reaction',
                    attackerLimit: 'Handling',
                    hasAttackerLimit: 'true',
                }
            },
            'catchup_breakaway': {
                'label': 'Catch-up / Break Away',
                type: 'vehicle',
                actionType: 'complex',
                typeOfTest: 'test',
                testParameter: {
                    attackerSkill: 'vehicle skill',
                    attackerAbility: 'reaction',
                    attackerLimit: ['Handling', 'Speed'],
                    hasAttackerLimit: 'true'
                }
            },
            'cut_off': {
                'label': 'Cut-off',
                type: 'vehicle',
                actionType: 'complex',
                typeOfTest: 'opposed',
                testParameter: {
                    attackerSkill: 'vehicle skill',
                    attackerAbility: 'reaction',
                    attackerLimit: ['Handling'],
                    hasAttackerLimit: 'true',
                    opposedSkill: 'Reaction',
                    opposedAbility: 'Intuition',
                    opposedLimit: 'Handling',
                    hasOpposedLimit: 'true',
                    note: 'Use Pilot + Autosoft instead when piloted by a drone.'
                }
            },
            'ram': {
                'label': 'Ram',
                type: 'vehicle',
                actionType: 'complex',
                typeOfTest: 'opposed',
                testParameter: {
                    attackerSkill: 'vehicle skill',
                    attackerAbility: 'Reaction',
                    attackerLimit: ['Handling', 'Speed'],
                    hasAttackerLimit: 'true',
                    opposedSkill: 'Reaction',
                    opposedAbility: 'Intuition',
                    opposedLimit: 'Handling',
                    hasOpposedLimit: 'true',
                    note: 'Use Pilot + Autosoft instead when piloted by a drone.'
                }
            },
            'stunt': {
                'label': 'Stunt',
                type: 'vehicle',
                actionType: 'complex',
                typeOfTest: 'test',
                testParameter: {
                    attackerSkill: 'vehicle skill',
                    attackerAbility: 'Reaction',
                    attackerLimit: ['Handling', 'Speed'],
                    hasAttackerLimit: 'true',
                }
            },
            'attack_against_vehicle': {
                'label': 'Attack against Vehicles',
                type: 'ranged',
                actionType: 'complex',
                typeOfTest: 'opposed',
                testParameter: {
                    attackerSkill: 'Gunnery',
                    attackerAbility: 'Agility',
                    attackerLimit: 'Accuracy',
                    hasAttackerLimit: 'true',
                    opposedSkill: 'Reaction',
                    opposedAbility: 'Intuition',
                    opposedLimit: 'Handling',
                    hasOpposedLimit: 'false',
                    note: 'Use Pilot + Autosoft instead when piloted by a drone.'
                }
            },
            'evasive_driving': {
                'label': 'Evasive Driving (Defense)',
                type: 'vehicle',
                actionType: 'complex',
                typeOfTest: 'none',
                testParameter: {
                    note: 'Reduce Initiative by 10, add Intuition to the defense dice pool.'
                }
            },
            'called_shot_on_vehicles': {
                'label': 'Called Shot on Vehicles',
                type: 'vehicle',
                actionType: 'complex',
                typeOfTest: 'none',
                testParameter: {
                    note: 'Allows Called Shot for Vehicle Weapons.'
                }
            },
            'recover_stun': {
                'label': 'Natural Recovery: Stun',
                type: 'none',
                actionType: 'complex',
                typeOfTest: 'none',
                testParameter: {
                    attackerSkill: 'Body',
                    attackerAbility: 'Willpower',
                    attackerLimit: 'Mental',
                    hasAttackerLimit: 'false',
                    note: 'Interval is 1 hour. Each hit heals 1 box of Stun Damage.'
                }
            },
            'recover_physical': {
                'label': 'Natural Recovery: Physical',
                type: 'none',
                actionType: 'complex',
                typeOfTest: 'none',
                testParameter: {
                    attackerSkill: 'Body',
                    attackerAbility: 'Body',
                    attackerLimit: 'Mental',
                    hasAttackerLimit: 'false',
                    note: 'Interval is 1 day. Each hit heals 1 box of Physical Damage. Stun Damage needs to be recovered from first.'
                }
            },
            'first_aid': {
                'label': 'First Aid',
                type: 'healing',
                actionType: 'complex',
                typeOfTest: 'test',
                testParameter: {
                    attackerSkill: 'First Aid',
                    attackerAbility: 'Logic',
                    attackerLimit: 'Mental',
                    hasAttackerLimit: 'true',
                    threshold: '2',
                    note: 'Only usable to recover from damage that was infliced within the last hour'
                }
            },
            'using_medicine': {
                'label': 'Using Medicine',
                type: 'healing',
                actionType: 'test',
                typeOfTest: 'test',
                testParameter: {
                    attackerSkill: 'Medicine',
                    attackerAbility: 'Logic',
                    attackerLimit: 'Mental',
                    hasAttackerLimit: 'true',
                    note: 'Each hit adds one die to healing tests'
                }
            },
            'stabilize': {
                'label': 'Stabilization',
                type: 'healing',
                actionType: 'complex',
                typeOfTest: 'test',
                testParameter: {
                    attackerSkill: 'First Aid or Medicine',
                    attackerAbility: 'Logic',
                    attackerLimit: 'Mental',
                    threshold: '3',
                    hasAttackerLimit: 'true',
                    note: ''
                }
            },
        },
        tests: {
            healing: 'Healing Test',
            melee: 'Melee Attack Test',
            matrix: 'Matrix Test',
            ranged: 'Ranged Attack Test',
            vehicle: 'Vehicle Test',
            reload: 'Reload',
            none: 'None',
        },
        healingConditions: {
            '0': 'Good conditions (sterilized med facility)',
            '-1': 'Average conditions (indoors)',
            '-2': 'Poor conditions (street or wilderness)',
            '-3': 'Bad conditions (combat, bad weather, swamp)',
            '-4': 'Terrible conditions (fire, severe storm)',
        },
        visibility: {
            '0': 'Clear',
            '-1': 'Light Rain / Fog / Smoke',
            '-3': 'Moderate Rain / Fog / Smoke',
            '-6': 'Heavy Rain / Fog / Smoke',
        },
        light: {
            '0': 'Full Light / No Glare',
            '-1': 'Partial Light / Weak Glare',
            '-3': 'Dim Light / Moderate Glare',
            '-6': 'Total Darkness / Blinding Glare',
        },
        wind: {
            '0': 'None or Light Breeze',
            '-1': 'Light Winds',
            '-3': 'Moderate Winds',
            '-6': 'Strong Winds',
        },
        range: {
            '0': 'Short',
            '-1': 'Medium',
            '-3': 'Long',
            '-6': 'Extreme',
        },
        firemode: {
            'SS': 'Single Shot',
            'SA': 'Semi Auto',
            'SB': 'Semi Burst',
            'BF': 'Burst Fire',
            'LB': 'Long Burst',
            'FA': 'Full Auto',
            'SF': 'Supressive Fire',
        },
        vehicleSituation: {
            'easy': 'Easy',
            'average': 'Average',
            'hard': 'Hard',
            'extreme': 'Extreme',
        },
        vehicleTerrain: {
            'open': 'Open',
            'light': 'Light',
            'restricted': 'Restricted',
            'tight': 'Tight',
        },
        smartgunPlatform: {
            '+1': 'As Gear',
            '+2': 'As Implant',
        }
    }
    res.render(data._view, data);
})

app.get('/edit', (req, res) => {
    if (!req.session.loggedIn) {
        res.sendStatus(403).end();
        return;
    }
    let title = req.query.file;
    if (title) {
        title = title.trim();
        let data;
        if (fs.existsSync(__dirname + '/data/' + title + '.json')) {
            data = JSON.parse(fs.readFileSync(__dirname + '/data/' + title + '.json', 'utf-8'));
        } else {
            data = {};
        }
        data.files = fs.readdirSync(__dirname + '/data/').filter(fileName => fileName.indexOf('.json') != -1).map(fileName => fileName.replace('.json', ''));
        data.views = fs.readdirSync(__dirname + '/views/partials/').map(fileName => fileName.replace('.hbs', ''));
        data.internalView = data._view;
        data._view = 'edit';
        data.layout = 'edit_layout';
        data.selectedFile = true;
        data.loggedIn = req.session.loggedIn;
        res.render(data._view, data);
    } else {
        const data = {};
        data.files = fs.readdirSync(__dirname + '/data/').filter(fileName => fileName.indexOf('.json') != -1).map(fileName => fileName.replace('.json', ''));
        data.views = fs.readdirSync(__dirname + '/views/partials/').map(fileName => fileName.replace('.hbs', ''));
        data.internalView = data._view;
        data._view = 'edit';
        data.layout = 'edit_layout';
        data.selectedFile = false;
        data.loggedIn = req.session.loggedIn;
        data._author = req.session.username;
        res.render(data._view, data);
    }
});

app.get('/login', (req, res) => {

    res.render('page', {
        layout: 'login_layout'
    })
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (username && password) {
        if (username === 'louis' && password === 'sybil') {
            req.session.loggedIn = true;
            req.session.username = username;
            res.redirect('/');
        } else {
            res.send('Incorrect Username and or password!').end();
        }
    } else {
        res.send('Please enter Username and Password!').end();
    }
});

app.post('/edit', (req, res) => {
    if (req.body.file) {
        res.redirect('/edit?file=' + req.body.file.trim());
        return;
    }
    if (req.body.newFile && req.body.newFile.trim() != '') {
        res.redirect('/edit?file=' + req.body.newFile.trim());
        return;
    }
    const p = req.body.title.trim();
    let data = {};
    if (fs.existsSync(__dirname + '/data/' + p)) {
        data = JSON.parse(fs.readFileSync(__dirname + '/data/' + p + '.json', 'utf-8'));
    }
    if (req.body._author.trim() !== '' && req.body._author !== req.session.username) {
        res.sendStatus(403).end();
        return;
    }
    data._created = new Date(req.body._created);
    data.title = req.body.title.trim();
    data.content = req.body.content.trim();
    data.summary = req.body.summary.trim();
    data._author = req.body._author.trim();
    data._view = req.body.view;
    if (!data._links) {
        data._links = [];
    }
    if (req.body.titles) {
        for (let i = 0; i < req.body.titles.length; ++i) {
            data._links.push({
                title: req.body.titles[i],
                href: req.body.hrefs[i],
            });
        }
    }

    if (!data._contents) {
        data._contents = [];
    }
    if (req.body.contents) {
        for (let i = 0; i < req.body.contents.length; ++i) {
            data._contents.push(req.body.contents[i]);
        }
    }
    data._modified = new Date();
    data._modified.setFullYear(data._modified.getFullYear() + 55);
    fs.writeFileSync(__dirname + '/data/' + p + '.json', JSON.stringify(data));
    res.redirect("/" + p);
});

app.get('/:title', (req, res) => {
    try {
        const p = req.params.title;
        let data = {};
        if (fs.existsSync(__dirname + '/data/' + p + '.json')) {
            data = JSON.parse(fs.readFileSync(__dirname + '/data/' + p + '.json', 'utf-8'));
        } else {
            data = JSON.parse(fs.readFileSync(__dirname + '/data/404.json', 'utf-8'));
            data._view = '404';
        }
        data.content = md.render(data.content);
        data.loggedIn = req.session.loggedIn;
        res.render(data._view, data);
    } catch (e) {
        res.send(e);
    }
});

app.get('/', (req, res) => {
    const data = JSON.parse(fs.readFileSync(__dirname + '/data/startpage.json', 'utf-8'));
    data.content = md.render(data.content);
    data.loggedIn = req.session.loggedIn;
    res.render(data._view, data);
});

app.listen('8080', () => {
    console.log('app is running');
});