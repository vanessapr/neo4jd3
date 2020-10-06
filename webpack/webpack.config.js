const path = require('path');
const { merge } = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { paths, common } = require('./webpack.common');

const prodConfig = merge([
  {
    mode: 'production',
    devtool: 'source-map',
    entry: {
      neo4jd3: paths.srcIndex,
    },
    output: {
      path: path.join(paths.root, 'dist/'),
      filename: '[name].min.js',
      library: 'Neo4jd3',
      libraryTarget: 'umd',
      libraryExport: 'default',
      globalObject: 'this',
    },
    externals: {
      d3: {
        commonjs: 'd3',
        commonjs2: 'd3',
        amd: 'd3',
        root: 'd3',
      },
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'neo4jd3.min.css',
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.join(paths.root, 'src/graph'), to: path.join(paths.root, 'dist'),
          },
        ],
      }),
    ],
  },
  common(),
]);

const devConfig = merge([
  {
    mode: 'development',
    devtool: 'cheap-eval-source-map',
    entry: path.join(paths.docs, 'demo-graph.js'),
    output: {
      path: path.resolve(__dirname, '../demos/build'),
      filename: '[name].js',
    },
    devServer: {
      contentBase: '../demos/build',
      port: 8001,
      inline: true,
      hot: true,
      open: true,
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Docs',
        template: path.join(paths.docs, 'index.html'),
      }),
    ],
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
          ],
        },
        {
          test: /\.scss$/,
          use: [
            'style-loader',
            'css-loader',
            'sass-loader',
          ],
        },
      ],
    },
  },
  common(),
]);

module.exports = (env) => (env === 'dev' ? devConfig : prodConfig);
