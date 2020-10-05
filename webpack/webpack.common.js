const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const ESLintPlugin = require('eslint-webpack-plugin');

const paths = {
  root: path.resolve(__dirname, '..'),
  docs: path.resolve(__dirname, '../src/demos'),
  srcIndex: path.resolve(__dirname, '../src/index.js'),
};

const common = () => ({
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  plugins: [
    new ESLintPlugin(),
  ],
});

module.exports = { paths, common };
