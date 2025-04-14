const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = [
  {
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    entry: "./src/index.tsx",
    output: { path: path.resolve(__dirname, "dist") },
    plugins: [new HtmlWebpackPlugin({ template: "index.html" })],
    module: {
      rules: [
        { test: /\.tsx?$/, use: { loader: "swc-loader" } },
        {
          test: /\.tsx?$/,
          use: [{ loader: require.resolve("./rsc-transform-loader") }],
        },
      ],
    },
    resolve: {
      extensions: ["...", ".ts", ".tsx"],
      conditionNames: ["react-server", "browser"],
    },
    devtool:
      process.env.NODE_ENV === "production" ? "source-map" : "eval-source-map", // Add good source maps
  },
];
