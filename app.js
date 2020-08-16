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
        tests: {
            healing: 'Healing Test',
            melee: 'Melee Attack Test',
            matrix: 'Matrix Test',
            ranged: 'Ranged Attack Test',
            vehicle: 'Vehicle Test',
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