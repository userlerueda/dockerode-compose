const path = require('path');
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
    library: { type: 'commonjs' },
    path: path.resolve(__dirname, 'dist'),
    filename: 'dockerode-compose.cjs',
  },
  plugins: [new TypescriptDeclarationPlugin({ out: 'dockerode-compose.d.ts' })],
  target: 'node',
};

const mjsConfig = {
  ...commonConfig,
  experiments: {
    outputModule: true,
  },
  output: {
    chunkFormat: 'module',
    library: { type: 'module' },
    path: path.resolve(__dirname, 'dist'),
    filename: 'dockerode-compose.mjs',
  },
  plugins: [new TypescriptDeclarationPlugin({ out: 'dockerode-compose.d.ts' })],
  target: 'node',
};

module.exports = [cjsConfig, mjsConfig];
