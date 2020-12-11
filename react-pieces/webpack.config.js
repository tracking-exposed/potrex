/* eslint-disable strict, no-console, object-shorthand */
/* eslint-disable import/no-extraneous-dependencies, import/newline-after-import */
'use strict';

const path = require('path');

const webpack = require('webpack');
const autoPrefixer = require('autoprefixer');
const combineLoaders = require('webpack-combine-loaders');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

require('dotenv').load({ silent: true });

const LAST_VERSION = 2;
const PRODUCTION = process.env['NODE_ENV'] === 'production';
const DEVELOPMENT = !PRODUCTION;

const PATHS = {
    APPS: {
        personal: path.resolve(__dirname, 'src/personal/index.js'),
    },
    TARGET: path.resolve(__dirname, '..', '..', 'pornhub.tracking.exposed', 'static', 'js', 'generated'),
    NODE_MODULES: path.resolve(__dirname, 'node_modules')
};

/** EXTERNAL DEFINITIONS INJECTED INTO APP **/
var DEV_SERVER = 'localhost';
var ENV_DEP_SERVER = DEVELOPMENT ? ('http://' + DEV_SERVER + ':10000') : 'https://pornhub.tracking.exposed';
var ENV_DEP_WEB = DEVELOPMENT ? ('http://' + DEV_SERVER + ':1313') : 'https://pornhub.tracking.exposed';

const DEFINITIONS = {
    'process.env': {
        NODE_ENV: DEVELOPMENT ? JSON.stringify("development") : JSON.stringify("production"),
        API_ROOT: JSON.stringify(ENV_DEP_SERVER + '/api/v' + LAST_VERSION),
        WEB_ROOT: JSON.stringify(ENV_DEP_WEB)
    }
};

console.log('Building in ', PATHS.TARGET, 'is NODE_ENV "production" | "anythingElse=dev" ?', DEFINITIONS['process.env']);
if(PRODUCTION)
    console.log("production\tThis condition produce a reduced .js to be committed online, and embed potrex server as URL\n");
else
    console.log("dev\tThis condition produce a LARGE .js and SHOULD NOT be committed online. It embed localhost as server\n");



/** PLUGINS **/
const PLUGINS = [
    new webpack.DefinePlugin(DEFINITIONS),
    new webpack.NoErrorsPlugin()
];

const PROD_PLUGINS = [
    new webpack.optimize.UglifyJsPlugin({
        compress: {
            screw_ie8: true,
            warnings: false
        },
        output: {
            comments: false
        },
        sourceMap: true
    }),
    new webpack.LoaderOptionsPlugin({
        debug: false,
        minimize: true
    })

    // Add additional production plugins
];

const EXTRACT_CSS_PLUGIN = new ExtractTextPlugin(
    'styles.css', {
        allChunks: true
    }
);

PLUGINS.push(EXTRACT_CSS_PLUGIN);

if (PRODUCTION) {
    PLUGINS.push(...PROD_PLUGINS);
}

/** LOADERS **/
const JS_LOADER = combineLoaders([
    {
        loader: 'babel',
        query: {
            cacheDirectory: true
        }
    }

    // Add additional JS loaders
]);

const CSS_LOADER = combineLoaders([
    {
        loader: 'css',
        query: {
            sourceMap: true
        }
    },

    { loader: 'postcss' },

    {
        loader: 'sass',
        query: {
            precision: '8', // If you use bootstrap, must be >= 8. See https://github.com/twbs/bootstrap-sass#sass-number-precision
            outputStyle: 'expanded',
            sourceMap: true
        }
    }

    // Add additional style / CSS loaders
]);

// Add additional loaders to handle other formats (ie. images, svg)

const LOADERS = [
    {
        test: /\.jsx?$/,
        exclude: [PATHS.NODE_MODULES],
        loader: JS_LOADER
    }, {
        test: /\.s[ac]ss$/,
        exclude: [PATHS.NODE_MODULES],
        loader: ExtractTextPlugin.extract('style', CSS_LOADER)
    }

    // Add additional loader specifications
];

/** EXPORTED WEBPACK CONFIG **/
const config = {
    entry: PATHS.APPS,

    output: {
        path: PATHS.TARGET,
        filename: '[name].js'
    },

    debug: !PRODUCTION,

    // devtool: PRODUCTION ? '#source-map' : '#inline-source-map',
    devtool: PRODUCTION ? null : '#inline-source-map',

    target: 'web',

    resolve: {
        extensions: ['', '.js', '.jsx'],
        modules: ['node_modules'] // Don't use absolute path here to allow recursive matching
    },

    plugins: PLUGINS,

    module: {
        loaders: LOADERS
    },

    postcss: [autoPrefixer()]
};

module.exports = config;
