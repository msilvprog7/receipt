var express = require('express'),
    nunjucks = require('nunjucks');

var app = express();
app.set('port', 8080);

nunjucks.configure(['site'], {
    autoescape: true,
    express: app
});

app.get('/', (req, res) => {
    res.render('index.html')
});

app.listen(app.get('port'), () => {
    console.log(`Server running on port ${app.get('port')}`);
});
