const { transformSource } = require("react-server-dom-webpack/node-loader");

module.exports = async function rscTransformLoader(code, map) {
  const callback = this.async();
  try {
    const { source } = await transformSource(
      code,
      { format: "module", url: "file://" + this.resourcePath },
      async (source) => ({
        source,
      }),
    );
    callback(null, source, map);
  } catch (err) {
    callback(err);
  }
};
