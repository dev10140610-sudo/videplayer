const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');

const isAnalyze = false;

module.exports = {
  mode: 'development',
  entry: {
    main: './src/main.js',
    history: './src/history.js',
  },
  output: {
    filename: 'bundle.[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
    environment: {
      arrowFunction: false,
    },
  },
  stats: 'normal',
  resolve: {
    extensions: ['.js'],
    alias: {
      'video.js': path.resolve(__dirname, `scripts/video`),
    },
  },
  performance: {
    hints: false,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          path.join(__dirname, 'node_modules'),
          path.join(__dirname, 'scripts'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            configFile: './.babelrc.modern.js',
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: { sourceMap: true, api: 'modern' }
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: `./public/index.html`,
      filename: 'index.html',
      chunks: ['main'],
      inject: 'body',
      mode: 'development',
      publicPath: '',
    }),
    new HtmlWebpackPlugin({
      template: `./public/history.html`,
      filename: 'history.html',
      chunks: ['history'],
      inject: 'body',
      mode: 'development',
      publicPath: '',
    }),
    new CleanWebpackPlugin(),
    isAnalyze && new BundleAnalyzerPlugin(),
  ].filter(Boolean),
  optimization: {
    usedExports: true,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  devtool: false,
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    historyApiFallback: true,
    compress: true,
    port: 1111,
    hot: true,
    open: {
      target: ['http://localhost:1111'],
    },
  },
};
