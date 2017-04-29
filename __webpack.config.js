const Path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const Webpack = require("webpack");
const WebpackMerge = require("webpack-merge");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

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

/**
 * Rules
 */
const common = outputDir => ({
    devtool: 'source-map',
    entry: Path.resolve(__dirname, PATHS.app + '/main.js'),
    output: {
        filename: '[name].bundle.js',
        path: Path.resolve(__dirname, outputDir),
        sourceMapFilename: '[name].map'
    }
});

// build, test
const clean = pathToClean => ({
  plugins: [
    new CleanWebpackPlugin([pathToClean], {
      root: process.cwd(),
    }),
  ],
});

const devServer = () => ({
    devServer: {
        contentBase: PATHS.dev,
        compress: true,
        port: 9000
    }
});

const bundleAnalyzer = () => ({
    plugins: [
        new BundleAnalyzerPlugin({
            openAnalyzer: false,
            analyzerMode: 'static'
        })
    ]
});

const loaderOptions = () => ({
    plugins: [
        new Webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false
        })
    ]
});

// build, dev
const commonChunks = () => ({
    plugins: [
        new Webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            chunks: ['main'],
            minChunks: module => PATHS.vendors.test(module.resource)
        })
    ]
});

const esList = () => ({
    enforce: "pre",
    test: /\.js$/,
    exclude: /node_modules/,
    loader: 'eslint-loader'
});

const babel = () => ({
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
            }
        ]
    }
});

const sass = () => ({
  module: {
    loaders: [
      {
        test: /\.scss$/,
        loader: 'style!css!scss',
        include: PATHS.app,
      },
    ],
  },
});

const css = () => ({
    module: {
        rules: [
            {
                test: /\.css$/,
                exclude: PATHS.vendors,
                use: {
                    loader: 'style!css'
                }
            }
        ]
    }
});


/**
 * Sequence of calls doesn't matter
 */
let config;
if (process.env.NODE_ENV === 'production') {
    config = WebpackMerge(common(PATHS.build), commonChunks(), loaderOptions(), clean(Path.join(PATHS.build, '*')), babel(), sass(), css(), bundleAnalyzer());
} else if (process.env.NODE_ENV === 'test') {
    config = WebpackMerge(common(PATHS.test), clean(Path.join(PATHS.test, '*')), babel(), sass(), css());
} else {
    config = WebpackMerge(common(PATHS.dev), commonChunks(), devServer(), { devtool: 'eval-source-map' }, babel(), sass(), css(), bundleAnalyzer());
}

module.exports = config;