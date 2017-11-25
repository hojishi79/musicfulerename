'use strict';

const co = require('co');
const mm = require('music-metadata');
const moji = require('moji');
const sanitize = require('sanitize-filename');
const du = require('date-utils');
const ProgressBar = require('progress');
const fs = require('fs');

const dirPath = 'C:/path/to/music/directory';

function butifyString(str) {
    let newStr = moji(str).convert('ZE', 'HE').convert('HK', 'ZK').convert('ZS', 'HS').toString();
    newStr = sanitize(newStr);

    if (newStr.length === 0) {
        const dt = new Date();
        newStr = dt.toFormat("YYYYMMDDHH24MISS");
        console.log(str, ' changed to ', newStr);
    }

    return newStr;
}

co(function* () {
    const dirFiles = fs.readdirSync(dirPath);
    const errorFiles = [];

    const progressBar = new ProgressBar('renaming [:bar] :percent', {
        total: dirFiles.length,
        width: 20,
        complete: '=',
        imcomplete: '-'
    });

    for (let fileName of dirFiles) {
        let metadata = yield mm.parseFile(dirPath + '/' + fileName, { native: true });

        let spl = fileName.split('.');
        let ext = spl[spl.length - 1];
        let trackNumber = ('0' + metadata.common.track.no).slice(-2);
        let album = butifyString(metadata.common.album);
        let title = butifyString(metadata.common.title);

        try {
            fs.mkdirSync(dirPath + '/' + album);
        } catch (e) {
            // nothing to do
        }

        try {
            fs.copyFileSync(dirPath + '/' + fileName, dirPath + '/' + album + '/' + trackNumber + '-' + title + '.' + ext);
            // console.log('copy ' + fileName + ' to ' + album + '/' + trackNumber + '-' + title + '.' + ext);
        } catch (e) {
            errorFiles.push(fileName);
        }
        progressBar.tick();        
    };

    if (errorFiles.length > 0) {
        console.error('error occured in follow file....');
        for (let ef of errorFiles) {
            console.error(ef);
        }
    }

}).catch(function (err) {
    console.error(err.message);
});

