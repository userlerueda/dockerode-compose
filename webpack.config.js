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

// const nodeMinConfig = {
//   ...commonConfig,
//   optimization: {
//     minimize: true,
//   },
//   output: {
//     path: path.resolve(__dirname, 'dist'),
//     filename: 'dockerode-compose.bundle.min.js',
//     libraryTarget: 'umd',
//     library: 'DockerodeCompose',
//     umdNamedDefine: true,
//   },
//   target: 'node',
// };

const nodeConfig = {
  ...commonConfig,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'dockerode-compose.bundle.js',
    libraryTarget: 'umd',
    library: 'DockerodeCompose',
    umdNamedDefine: true,
  },
  plugins: [new TypescriptDeclarationPlugin({ out: 'dockerode-compose.bundle.d.ts' })],
  target: 'node',
};

module.exports = [nodeConfig];
