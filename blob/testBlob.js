/**
 * Created by zsolt on 4/19/14.
 */

var fs = require('fs');

var requirejs = require('requirejs');
requirejs.config({
    baseUrl: __dirname + '/..',
    nodeRequire: require
});

var BlobBackend = requirejs('blob/BlobFSBackend');
//var BlobBackend = requirejs('blob/BlobS3Backend');
var blobBackend = new BlobBackend();

var filename = 'sample.js';
blobBackend.addFile(filename, fs.createReadStream(filename), function (err, hash) {
    if (err) {
        console.log(err);
        return;
    }

    console.log(hash);

    blobBackend.getFile(hash, process.stdout, function (err, filename, contentType) {
        if (err) {
            console.log(err);
            return;
        }


    });
});

var addFilesFromTestDir = function (testdir) {
    var path = require('path');
    var sourceFiles = fs.readdirSync(testdir);
    var remaining = sourceFiles.length;

    var startTime = new Date();

    for (var i = 0; i < Math.min(sourceFiles.length, 20000); i += 1) {
        var fname = path.join(testdir, sourceFiles[i]);
        (function (file) {

            blobBackend.addFile(file, fs.createReadStream(file), function (err, hash) {
                if (err) {
                    console.log(err);
                }

                console.log(file + ' : ' + hash);

                remaining -= 1;
                //numFiles += 1;
                //size += blobStorage.getInfo(hash).size;

                if (remaining === 0) {
                    // done
                    //done(numFiles, size);
                    var diff = (new Date()) - startTime;
                    console.log(diff / 1000 + 's');
                }
            });
        })(fname);
    }
};


// 4GB, 22 files -> 42sec - FS
// 2GB, 21 files -> 18sec - FS
// 2GB, 21 files -> 65sec - fakeS3 2GB file copyObject failed
//addFilesFromTestDir('test-files');

// 2GB, 1025 files -> 19.2sec - FS
// 2GB, 1025 files -> 51.4sec - fakeS3 (2GB file copyObject failed)
addFilesFromTestDir('test-many-files');
