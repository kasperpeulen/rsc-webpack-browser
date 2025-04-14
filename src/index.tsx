// @ts-ignore
import { renderToReadableStream } from "react-server-dom-webpack/server";
import { Story } from "./components/users.stories";
import type { JSX, Usable } from "react";

const { use, createRoot, createFromReadableStream } = await import(
  // @ts-ignore
  /* webpackIgnore: true */ "/client/main.js"
);
const manifest = await fetch("/client/react-client-manifest.json").then((it) =>
  it.json(),
);

function Use({ value }: { value: Usable<JSX.Element> }) {
  return use(value);
}

const stream = renderToReadableStream(<Story />, manifest);

createRoot(document.getElementById("root")!).render(
  <Use value={createFromReadableStream(stream)} />,
);
