const path = require('path');

module.exports = {
  target: 'node', // La extensión se ejecuta en Node.js
  entry: './src/extension.js', // El punto de entrada de tu extensión
  output: {
    path: path.resolve(__dirname, 'dist'), // Carpeta de salida
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.js'],
    alias: {
      canvas: 'empty-module'
    }
  },
  externals: {
    vscode: 'commonjs vscode' // La API de VSCode está disponible en el entorno runtime
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
        exclude: [
          /node_modules\/parse5/
        ]
      }
    ]
  }
};
