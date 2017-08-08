const Path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const Webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const NgAnnotatePlugin = require('ng-annotate-webpack-plugin');

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
    devtool: 'hidden',
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
    resolve: {
        alias: {
            sigma: Path.resolve(__dirname, "node_modules/sigma/build/sigma.require.js")
        }
    },
    plugins: removeEmpty([
        new BundleAnalyzerPlugin({
            openAnalyzer: false,
            analyzerMode: 'static'
        }),
        new Webpack.optimize.UglifyJsPlugin({
            sourceMap: false,
            mangle: false
        }),
        new Webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            chunks: ['main'],
            minChunks: module => PATHS.vendors.test(module.resource)
        }),
        new Webpack.ProvidePlugin({
            app: `exports?exports.default!${Path.join(PATHS.app, 'app')}`,
            $: Path.resolve(__dirname, "node_modules/jquery/dist/jquery.min.js"),
        }),
        new Webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),

        new NgAnnotatePlugin({
            add: true,
            // other ng-annotate options here
        }),
    ]),
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: PATHS.vendors,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: ['react', 'es2015']
                    }
                }/* , {
                    loader: 'ng-annotate-loader',
                    options: {
                        add: true,
                        map: false,
                    }
                } */]
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
                test: /\.(swf)$/,
                loader: 'file-loader?name=[name].[ext]'
            }, {
                test: /\.(png|jpg|gif|svg)$/,
                use: [{
                        loader: 'file-loader',
                        options: {
                            query: {
                            name:'img/[name].[ext]'
                            }
                        }
                    },
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            query: {
                                mozjpeg: {
                                    progressive: true,
                                },
                                gifsicle: {
                                    interlaced: true,
                                },
                                optipng: {
                                    optimizationLevel: 7,
                                }
                            }
                        }
                }]
            }, {
                test: /\/sigma.*\.js?$/,
                use: [{
                    loader: 'imports-loader?sigma'
                }]
            },
            /*{
                test: /\/sigma.*\.js?$/, // the test to only select sigma files
                exclude: ['src'], // you ony need to check node_modules, so remove your application files
                loader: 'script-loader' // loading as script
            }, */
        ]
    }

});
