module.exports = {
  // ... 기존 설정들 ...
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          /node_modules\/undici/,
          /node_modules\/@firebase/,
          /node_modules\/firebase/
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-proposal-private-property-in-object'
            ]
          }
        }
      }
    ]
  }
};