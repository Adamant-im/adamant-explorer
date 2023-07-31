const { ProvidePlugin } = require('webpack');
const { ContextReplacementPlugin } = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require('path');

const PATHS = require('./paths');

/**
 * Utils
 */
const removeEmpty = arr => arr.filter((p) => !!p);

process.traceDeprecation = true;

module.exports = {
  entry: {
    main: PATHS.app + '/main.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: PATHS.public,
  },
  resolve: {
    alias: {
      sigma: path.resolve(__dirname, '../node_modules/sigma/build/sigma.require.js'),
    },
  },
  plugins: removeEmpty([
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {from: 'icons/adm-qr-invert.png', to: PATHS.public, context: `${PATHS.assets}`},
        {from: 'favicon.ico', to: PATHS.public, context: `${PATHS.assets}/img`},
        {from: 'leaflet/*.png', to: PATHS.public, context: `${PATHS.assets}/img/`},
        {from: '*', to: PATHS.public, context: `${PATHS.assets}/icons/img`},
        {from: 'index.html', to: PATHS.public, context: `${PATHS.app}`},
      ],
    }),
    new BundleAnalyzerPlugin({
      openAnalyzer: false,
      analyzerMode: 'static',
    }),
    new ProvidePlugin({
      app: `exports?exports.default!${PATHS.app + 'app'}`,
      $: path.resolve(__dirname, '../node_modules/jquery/dist/jquery.min.js'),
    }),
    new ContextReplacementPlugin(/moment[/\\]locale$/, /en/),
  ]),
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: true,
            },
          },
        ],
      },
      {
        test: /\.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        type: 'asset/resource',
      },
      {
        test: /\.(swf)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
      },
      {
        test: /\/sigma.*\.js?$/,
        use: [
          {
            loader: 'imports-loader?sigma',
          },
        ],
      },
    ],
  },
};
