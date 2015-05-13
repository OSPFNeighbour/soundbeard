var mplayer = require('node-mplayer')
    restify = require('restify')
    fs = require('fs')
    _ = require('underscore')
    config = require('config');

var player = new mplayer();

function play(req, res, next) {
    var path = config.get('sounds') + req.params.snippet;
    fs.exists(path, function(exists) {
        if (exists) {
            player.stop();
            player.setFile(path);
            player.play();
            res.send({
                playing: req.params.snippet
            })
        } else {
            res.status(404);
            res.send({
                error: 'could not find soundfile: ' + req.params.snippet
            })
        }
    })
}

function stop(req, res) {
    player.stop();
    res.send();
}

function snippets(req, res) {
    var files = fs.readdirSync(config.get('sounds'));
    var filteredFiles = [];
    var list = {};

    _.each(files, function(file) {
        if (file != '.' && file != '..' && isSoundFile(file)) {
            filteredFiles.push(file);
        }
    });

    filteredFiles.sort();
    _.each(filteredFiles, function(file) {
        list[file] = buildSoundHref(file);
    });

    res.send(list);
}

function buildSoundHref(file) {
    return 'http://'+config.get('ip')+':'+config.get('port')+'/play/'+file;
}

function isSoundFile(file) {
    var extension = file.split('.').pop();
    return (-1 !== _.indexOf(config.get('allowedFormats'), extension));
}

var server = restify.createServer({
    name: 'soundbeard v1'
});

server.get('/play/:snippet', play);
server.get('/stop', stop);
server.get('/list', snippets);
server.get(/\/?.*/, restify.serveStatic({
    directory: './sites/',
    default: 'index.html'
}));

server.listen(config.get('port'), config.get('ip'), function() {
    console.log('%s listening at %s', server.name, server.url);
});