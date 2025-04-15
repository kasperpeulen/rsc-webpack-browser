import path from "path";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
// @ts-ignore
import ReactServerWebpackPlugin from "react-server-dom-webpack/plugin";

import "webpack-dev-server";

export default {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: [
    "./src/react-client-entrypoint.ts",
    "./src/react-server-entrypoint.tsx",
  ],
  output: {
    path: path.resolve(import.meta.dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({ template: "index.html" }),
    new ReactServerWebpackPlugin({ isServer: false }),
  ],
  module: {
    rules: [
      { test: /\.tsx?$/, use: { loader: "swc-loader" } },
      {
        layer: "client",
        test: (request) => /react-client-entrypoint\.ts/.test(request),
      },
      {
        issuerLayer: "client",
        resolve: {
          conditionNames: ["browser"],
        },
      },
      {
        layer: "rsc",
        test: (request) => /react-server-entrypoint\.tsx/.test(request),
      },
      {
        issuerLayer: "rsc",
        loader: "./rsc-transform-loader.js",
        resolve: {
          conditionNames: ["react-server", "browser"],
        },
      },
    ],
  },
  resolve: {
    extensions: ["...", ".ts", ".tsx"],
  },
  experiments: { layers: true },
  devtool: "source-map",
  devServer: {
    port: 3000,
    open: true,
  },
} satisfies webpack.Configuration;
