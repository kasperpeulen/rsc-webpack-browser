const path = require("path");
const ReactServerWebpackPlugin = require("react-server-dom-webpack/plugin");

module.exports = [
  {
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    entry: "./src/client.tsx",
    module: {
      rules: [{ test: /\.tsx?$/, use: { loader: "swc-loader" } }],
    },
    resolve: {
      extensions: ["...", ".ts", ".tsx"],
    },
    plugins: [new ReactServerWebpackPlugin({ isServer: false })],
    output: {
      path: path.resolve(__dirname, "dist", "client"),
      filename: "[name].js",
      // allows this module to be dynamically imported from the rsc bundle
      library: { type: "module" },
    },
    experiments: { outputModule: true },
  },
];
