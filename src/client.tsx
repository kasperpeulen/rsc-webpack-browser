import { createRoot } from "react-dom/client";
// @ts-ignore
import { createFromReadableStream } from "react-server-dom-webpack/client";
import { type JSX, use } from "react";

function Root({ response }: { response: Promise<JSX.Element> }) {
  return use(response);
}

export async function renderFlightStream(stream: ReadableStream) {
  createRoot(document.getElementById("root")!).render(
    <Root response={createFromReadableStream(stream)} />,
  );
}
