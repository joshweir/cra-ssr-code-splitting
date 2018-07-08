import express from 'express';
import Loadable from 'react-loadable';
const webpack = require('webpack');
const path = require('path');
const requireFromString = require('require-from-string');
const MemoryFS = require('memory-fs');

import indexController from './controllers/index';

const serverConfig = require('./webpack.config.server.js');
const fs = new MemoryFS();
const outputErrors = (err, stats) => {
    if (err) {
         console.error(err.stack || err);
         if (err.details) {
              console.error(err.details);
         }
         return;
    }

    const info = stats.toJson();
    if (stats.hasErrors()) {
        console.error(info.errors);
    }
    if (stats.hasWarnings()) {
        console.warn(info.warnings);
    }
};

const PORT = 3000;

// initialize the application and create the routes
const app = express();

const serverCompiler = webpack(serverConfig);
serverCompiler.outputFileSystem = fs;
serverCompiler.run((err, stats) => {
    outputErrors(err, stats);

    // wants to do this:
    // these 2 lines are new...
    // const contents = fs.readFileSync(path.resolve(serverConfig.output.path, serverConfig.output.filename), 'utf8');
    // const reactApp = requireFromString(contents, serverConfig.output.filename);
    // app.get('*', reactApp.default);
    // do the above and comment out below,
    // just get it working, create a different file
    // and then incorporate into that new file, the additional
    // store, redux stuff from controllers/index.js and renderer.js

    // was using this..
    app.use(indexController);

    // start the app
    Loadable.preloadAll().then(() => {
        app.listen(PORT, (error) => {
            if (error) {
                return console.log('something bad happened', error);
            }

            console.log("listening on " + PORT + "...");
        });
    });
});
