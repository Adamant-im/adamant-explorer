const path = require('path');
const { ContextReplacementPlugin } = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

const PATHS = require('./paths');

module.exports = {
  entry: {
    main: PATHS.app + '/main.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: PATHS.public,
    clean: true,
  },
  resolve: {
    alias: {
      // The sigma package ships a prebuilt bundle only
      sigma: path.resolve(__dirname, '../node_modules/sigma/build/sigma.require.js'),
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'icons/adm-qr-invert.png', to: PATHS.public, context: `${PATHS.assets}` },
        { from: 'favicon.ico', to: PATHS.public, context: `${PATHS.assets}/img` },
        { from: 'leaflet/*.png', to: PATHS.public, context: `${PATHS.assets}/img/` },
        { from: '*', to: PATHS.public, context: `${PATHS.assets}/icons/img` },
        { from: 'index.html', to: PATHS.public, context: `${PATHS.app}` },
      ],
    }),
    // Bundle only the English moment locale
    new ContextReplacementPlugin(/moment[/\\]locale$/, /en/),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
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
        test: /\.(png|jpg|gif)$/,
        type: 'asset/resource',
      },
      {
        // Sigma plugins expect the `sigma` variable in their scope.
        // CommonJS injection keeps the prebuilt plugin files intact
        test: /sigma[\\/]build[\\/]plugins[\\/].*\.js$/,
        use: [
          {
            loader: 'imports-loader',
            options: {
              type: 'commonjs',
              imports: ['single sigma sigma'],
            },
          },
        ],
      },
    ],
  },
};
