const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const Webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
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
  app: path.join(__dirname, 'src'),
  dev: path.join(__dirname, 'public'),
  build: path.join(__dirname, 'dist'),
  test: path.join(__dirname, 'test'),
  assets: path.join(__dirname, 'src/assets'),
  vendors: /node_modules|bower_components/,
};

process.traceDeprecation = true;

module.exports = (env) => ({
  mode: 'development',
  devtool: 'source-map',
  watch: true,
  entry: path.resolve(__dirname, PATHS.app + '/main.js'),
  output: {
    filename: '[name].bundle.js',
    path: PATHS.dev,
    publicPath: PATHS.dev,
    sourceMapFilename: '[name].map',
  },
  devServer: {
    static: {
      directory: PATHS.dev,
    },
    compress: true,
    port: 9001,
    proxy: {
      '/socket.io': 'http://localhost:6040',
      '/api': 'http://localhost:6040',
    },
    historyApiFallback: {
      index: 'index.html',
    },
  },
  resolve: {
    alias: {
      sigma: path.resolve(__dirname, 'node_modules/sigma/build/sigma.require.js'),
    },
  },
  // optimization: {
  //   splitChunks: {
  //     chunks: 'all',
  //     minSize: 1,
  //     minChunks: 2,
  //   },
  // },
  plugins: removeEmpty([
    // new HtmlWebpackPlugin({
    //     template: Path.resolve(__dirname, PATHS.app, 'index.html'),
    //     publicPath: PATHS.dev,
    //     filename: 'index.html',
    // }),
    new CopyPlugin({
      patterns: [
        {from: `${PATHS.assets}/icons/adm-qr-invert.png`, to: PATHS.dev},
        {from: `${PATHS.assets}/img/favicon.ico`, to: PATHS.dev},
        {from: `${PATHS.assets}/img/leaflet/`, to: PATHS.dev},
        {from: `${PATHS.assets}/icons/img/`, to: PATHS.dev},
        {from: `${PATHS.app}/index.html`, to: PATHS.dev},
      ],
    }),
    new BundleAnalyzerPlugin({
      openAnalyzer: false,
      analyzerMode: 'static',
    }),
    new Webpack.ProvidePlugin({
      app: `exports?exports.default!${path.join(PATHS.app, 'app')}`,
      $: path.resolve(__dirname, 'node_modules/jquery/dist/jquery.min.js'),
    }),
    new Webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en/),
  ]),
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: PATHS.vendors,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
          // {
          //   loader: 'ng-annotate-loader',
          //   options: {
          //     add: true,
          //     map: false,
          //   },
          // },
        ],
      },
      {
        test: /\.scss$/,
        use: ['style', 'css', 'scss'],
        include: PATHS.app,
      },
      {
        test: /\.css$/,
        // exclude: PATHS.vendors,
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
        use: [
          {
            loader: 'file-loader',
            options: {
              esModule: false,
              name: 'fonts/[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(swf)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              esModule: false,
              name: '[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              esModule: false,
              name: 'img/[name].[ext]',
            },
          },
          {
            loader: 'image-webpack-loader',
            options: {
              esModule: false,
              mozjpeg: {
                progressive: true,
              },
              gifsicle: {
                interlaced: true,
              },
              optipng: {
                optimizationLevel: 7,
              },
            },
          },
        ],
      },
      {
        test: /\/sigma.*\.js?$/,
        use: [
          {
            loader: 'imports-loader?sigma',
          },
        ],
      },
      /*{
          test: /\/sigma.*\.js?$/, // the test to only select sigma files
          exclude: ['src'], // you ony need to check node_modules, so remove your application files
          loader: 'script-loader' // loading as script
      }, */
    ],
  },
});
