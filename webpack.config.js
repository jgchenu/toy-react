const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    main: path.resolve(__dirname, "./src/main.js"),
  },
  module: {
    rules: [
      {
        test: /js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: [
              [
                "@babel/plugin-transform-react-jsx",
                {
                  pragma: "ToyReact.createElement",
                },
              ],
            ],
          },
        },
      },
    ],
  },
  mode: "development",
  plugins: [
    new HtmlWebpackPlugin({
      title: "ToyReact",
      filename: "index.html",
      favicon: path.resolve(__dirname, "./static/favicon.ico"),
      template: path.resolve(__dirname, "./static/index.html"),
    }),
  ],
  devtool: "source-map",
  devServer: {
    open: true,
    host: "0.0.0.0",
    contentBase: path.resolve(__dirname, "./static"),
  },
};
