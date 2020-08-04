const express = require('express');
const app = express();
const hbs = require('express-hbs');
const fs = require('fs');
const path = require('path');

app.engine('hbs', hbs.express4({
    partialsDir: __dirname + '/views/partials'
}));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views/partials');

app.use(express.static('static'));

app.get('/find', (req, res) => {
    const p = req.query.query.trim();
    if (fs.existsSync(__dirname + '/data/' + p)) {
        const data = JSON.parse(fs.readFileSync(__dirname + '/data/' + p +'.json', 'utf-8'));    
        data.layout = 'main_layout.hbs';
        res.render(data.view || 'page.hbs', data);
    } else {
        const data = {};
        data.layout = 'find_layout.hbs';
        if (p) {
            data.notfound = true;
        }
        res.render('find', data);
    }
});

app.get('/:title', (req, res) => {
    const p = req.params.title;
    let data = {};
    if (fs.existsSync(__dirname + '/data/' + p)) {
        data = JSON.parse(fs.readFileSync(__dirname + '/data/' + p +'.json', 'utf-8'));    
        data.layout = 'main_layout.hbs';
    } else {
        data = JSON.parse(fs.readFileSync(__dirname + '/data/404.json', 'utf-8'));    
        data.layout = '404_layout.hbs';
    }
    res.render(data.view || 'page.hbs', data);
});

app.get('/', (req, res) => {
    const data = JSON.parse(fs.readFileSync(__dirname + '/data/startpage.json', 'utf-8'));    
    data.layout = 'main_layout.hbs';
    res.render(data.view || 'page.hbs', data);
});  

app.listen('8080', () => {
    console.log('app is running');
});