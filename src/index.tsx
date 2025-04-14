// @ts-ignore
import { renderToReadableStream } from "react-server-dom-webpack/server";
import { Story } from "./components/users.stories";
import { type JSX, type Usable } from "react";
import manifest from "../dist/client/react-client-manifest.json";

const { use, createRoot, createFromReadableStream } = await import(
  // @ts-ignore
  /* webpackIgnore: true */ "/client/main.js"
);

function Use({ value }: { value: Usable<JSX.Element> }) {
  return use(value);
}

const root = createRoot(document.getElementById("root")!);

renderStory();

function renderStory() {
  const stream = renderToReadableStream(<Story />, manifest);
  root.render(
    <Use
      value={createFromReadableStream(stream, {
        callServer: async (id: string, args: unknown[]) => {
          console.log(`action called with`, { id, args });

          // for example: file:///Users/kasperpeulen/code/rsc-webpack-browser5/src/components/actions.ts#saveToDb
          const [filepath, name] = id!.split("#");

          // TODO probably too hacky, but not sure how else
          const module = Object.keys(__webpack_modules__).find((id) =>
            filepath?.endsWith(id.slice(1)),
          );
          if (module) {
            const action = __webpack_require__(module)[name!];
            setTimeout(renderStory, 0);
            return action?.(...args);
          }
        },
      })}
    />,
  );
}

declare global {
  var __webpack_modules__: Record<string, unknown>;
  var __webpack_require__: (
    id: string,
  ) => Record<string, (...args: any[]) => any>;
}
