const Path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const Webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

/**
 * Utils
 */
const removeEmpty = arr => arr.filter((p) => !!p);

/**
 * Path and env configs
 */
const PATHS = {
    app: Path.join(__dirname, 'src'),
    dev: Path.resolve(__dirname, 'public'),
    build: Path.join(__dirname, 'dist'),
    test: Path.join(__dirname, 'test'),
    vendors: /node_modules|bower_components/
};

process.traceDeprecation = true;

module.exports = env => ({
    devtool: 'source-map',
    entry: Path.resolve(__dirname, PATHS.app + '/main.js'),
    output: {
        filename: '[name].bundle.js',
        path: Path.resolve(__dirname, PATHS.dev),
        sourceMapFilename: '[name].map'
    },
    devServer: {
        contentBase: PATHS.dev,
        compress: true,
        port: 9001,
        proxy: {
            "/socket.io": "http://localhost:6040",
            "/api": "http://localhost:6040"
        }
    },
    plugins: removeEmpty([
        new BundleAnalyzerPlugin({
            openAnalyzer: false,
            analyzerMode: 'static'
        }),
        new Webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            chunks: ['main'],
            minChunks: module => PATHS.vendors.test(module.resource)
        }),
        new Webpack.ProvidePlugin({
            app: `exports?exports.default!${Path.join(PATHS.app, 'app')}`,
        }),
        new Webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
    ]),
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: PATHS.vendors,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['react', 'es2015']
                    }
                }
            }, {
                test: /\.scss$/,
                loader: 'style!css!scss',
                include: PATHS.app,
            }, {
                test: /\.css$/,
                // exclude: PATHS.vendors,
                use: ["style-loader", 'css-loader']
            }, {
                test: /\.html$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'html-loader',
                    options: {
                        minimize: true,
                    },
                }],
            }, {
                test: /\.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
                loader: 'file-loader?name=fonts/[name].[ext]'
            }, {
                test: /\.(png|jpg|gif|svg)$/,
                // loader: 'file-loader?name=img/[name].[ext]',
                loaders: [
                    'file-loader?name=img/[name].[ext]',
                    'image-webpack-loader?bypassOnDebug&optimizationLevel=7&interlaced=false'
                ]
            }, {
                test: /\/sigma.*\.js?$/, // the test to only select sigma files
                exclude: ['src'], // you ony need to check node_modules, so remove your application files
                loader: 'script-loader' // loading as script
            }
        ]
    }

});