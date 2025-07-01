import {
  getSource,
  transformSource,
} from "react-server-dom-webpack/node-loader";
import { join } from "path";
import { readFile } from "fs/promises";

export default async function rscTransformLoader(code, map) {
  const callback = this.async();
  try {
    const resourceUrl = "file://" + this.resourcePath;

    const { source } = await getSource(
      resourceUrl,
      { format: "module" },
      async (url, context) => {
        if (resourceUrl === url) {
          return { source: code };
        }
        if (url.endsWith(".map")) {
          return { source: await readFile(join(this.context, url)) };
        }
        throw new Error(`Cannot load ${url}`);
      },
    );

    const transformed = await transformSource(
      source,
      { format: "module", url: resourceUrl },
      async (source) => ({ source }),
    );
    callback(null, transformed.source, map);
  } catch (err) {
    if (err instanceof Error) {
      callback(err);
    }
  }
}
