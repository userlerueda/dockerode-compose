const path = require('path');
const webpack = require('webpack');
const TypescriptDeclarationPlugin = require('typescript-declaration-webpack-plugin');

const commonConfig = {
  entry: './src/compose.ts',
  devtool: 'source-map',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

const cjsConfig = {
  ...commonConfig,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: { configFile: 'tsconfig.cjs.json' },
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.cjs',
  },
  plugins: [new TypescriptDeclarationPlugin({ out: 'index.d.ts' })],
  target: 'node',
};

const mjsConfig = {
  ...commonConfig,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.mjs',
  },
  plugins: [new TypescriptDeclarationPlugin({ out: 'index.d.ts' })],
  target: 'node',
};

module.exports = [cjsConfig, mjsConfig];
