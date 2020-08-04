const express = require('express');
const app = express();
const hbs = require('express-hbs');
const fs = require('fs');
const path = require('path');
const md = require('markdown-it')();
const bodyParser = require('body-parser');

app.engine('hbs', hbs.express4({
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    defaultLayout: path.join (__dirname, '/views/layouts/main_layout'),
    extname: '.hbs'
}));

hbs.registerHelper('dynamicPartial', function(context, options) { return context._view || 'page' });

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views/partials');

app.use(express.static('static'));

app.get('/find', (req, res) => {
    const p = req.params.query.trim();
    if (fs.existsSync(__dirname + '/data/' + p)) {
        const data = JSON.parse(fs.readFileSync(__dirname + '/data/' + p +'.json', 'utf-8'));    
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

app.get('/edit', (req, res) => {
    let title = req.query.file;
    if (title) {
        title = title.trim();
        let data;
        if ( fs.existsSync(__dirname + '/data/' + title +'.json')) {
            data = JSON.parse(fs.readFileSync(__dirname + '/data/' + title +'.json', 'utf-8'));  
        } else {
            data = {};
        }
        data.files = fs.readdirSync(__dirname + '/data/').map( fileName => fileName.replace('.json', ''));
        data.views = fs.readdirSync(__dirname + '/views/partials/').map( fileName => fileName.replace('.hbs', ''));  
        data.internalView = data._view;
        data._view = 'edit';
        data.layout = 'edit_layout';
        data.selectedFile = true;
        res.render(data._view, data);
    } else {
        const data = {};
        data.files = fs.readdirSync(__dirname + '/data/').map( fileName => fileName.replace('.json', ''));
        data.views = fs.readdirSync(__dirname + '/views/partials/').map( fileName => fileName.replace('.hbs', ''));
        data.internalView = data._view;
        data._view = 'edit';
        data.layout = 'edit_layout';
        data.selectedFile = false;        
        res.render(data._view, data);
    }
});

app.post('/edit', (req, res) => {
    console.log(req.body);
    if(req.body.file) {
        res.redirect('/edit?file=' + req.body.file.trim());
        return;
    }
    if(req.body.newFile && req.body.newFile.trim() != '') {
        res.redirect('/edit?file=' + req.body.newFile.trim());
        return;
    }
    const p = req.body.title.trim();
    let data = {};
    if (fs.existsSync(__dirname + '/data/' + p)) {
        data = JSON.parse(fs.readFileSync(__dirname + '/data/' + p +'.json', 'utf-8'));
        data._created = new Date(req.body._created);
    } else {
        data._created = new Date();
        data._created.setFullYear(data._created.getFullYear() + 50);    
    }
    data.title = req.body.title.trim();
    data.content = req.body.content.trim();
    data._view = req.body.view;
    if (!data._links) {
        data._links = [];
    }
    if(req.body.titles) {
        for (let i = 0; i < req.body.titles.length; ++i) {
            data._links.push({
                title: req.body.titles[i],
                href: req.body.hrefs[i],
            });
        }
    }
    data._modified = new Date();
    data._modified.setFullYear(data._modified.getFullYear() + 50);
    fs.writeFileSync(__dirname + '/data/' + p + '.json', JSON.stringify(data));
    res.redirect("/edit");
});

app.get('/:title', (req, res) => {
    const p = req.params.title;
    let data = {};
    if (fs.existsSync(__dirname + '/data/' + p + '.json')) {
        data = JSON.parse(fs.readFileSync(__dirname + '/data/' + p +'.json', 'utf-8'));    
    } else {
        data = JSON.parse(fs.readFileSync(__dirname + '/data/404.json', 'utf-8'));    
        data._view = '404';
    }
    data.content = md.render(data.content);
    res.render(data._view, data);
});

app.get('/', (req, res) => {
    const data = JSON.parse(fs.readFileSync(__dirname + '/data/startpage.json', 'utf-8'));    
    data.content = md.render(data.content);
    res.render(data._view, data);
});  

app.listen('8080', () => {
    console.log('app is running');
});