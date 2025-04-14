// @ts-ignore
import { renderToReadableStream } from "react-server-dom-webpack/server";
import { Story } from "./components/users.stories";

async function main() {
  const manifest = await fetch("/client/react-client-manifest.json").then(
    (it) => it.json(),
  );
  const stream: ReadableStream = renderToReadableStream(<Story />, manifest);
  const { renderFlightStream } = await import(
    // @ts-ignore
    /* webpackIgnore: true */ "/client/main.js"
  );
  await renderFlightStream(stream);
}

main();
