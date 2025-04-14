# Render RSC with React Flight in the Browser

This investigation explores how to render React Server Components (RSC) in Storybook without an actual server, while remaining 100% compliant with the RSC specification.

### Background

Currently, our setup renders async **server** components as async **client** components, and handles server actions as if they were client actions. This approach worked for a while (albeit with some caveats), but broke in React 19 when the `enableSiblingPrerendering` feature flag was turned on.

We could try to revert that feature flag in Storybook, but there have been longer-standing issues with RSC—particularly when libraries, including React itself, conditionally load different modules on the server vs. the client using the `react-server` condition:
[See storybookjs/storybook#27527](https://github.com/storybookjs/storybook/issues/27527)

### Goal of This Investigation

We aim to show that it’s possible to:

1. Respect the `react-server` conditions for server components.
2. Render RSC in the official manner, by generating React Flight chunks.
3. Keep everything running in the browser.

The last point is crucial. If we had to run the stories file on an actual server, users would lose the ability to set browser mocks in a `beforeEach` or run a `play` function in their CSF file.

## How to Get React Flight Data Chunks from RSC Components

Consider this RSC component:

```tsx
export function Story() {
  const itemsPromise = new Promise((resolve) =>
    setTimeout(() => resolve(["Suspense-enabled streaming"]), 1000)
  );

  return (
    <Suspense fallback="Loading ...">
      <List itemsPromise={itemsPromise} />
    </Suspense>
  );
}

export async function List({ itemsPromise }) {
  const items = await itemsPromise;
  return (
    <ul className="List">
      {items.map((item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
}

```

You can generate **React Flight chunks** from this component using the following API:

```tsx
// Works in the browser when the following resolve conditions are set:
// react-server, browser
import { renderToReadableStream } from "react-server-dom-webpack/server";

const stream = renderToReadableStream(<Story />);
for await (const chunk of stream) {
  console.log(new TextDecoder().decode(chunk));
}

```

> Note: ReadableStream is a web API. 
https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
> 

The React Flight chunks themselves are a streaming JSON-like structure. For example:

```tsx
1:"$Sreact.suspense"
0:["$","$1",null,{"fallback":"Loading ...","children":"$L2"}]

// some seconds later

2:["$","ul",null,{"className":"List","children":[["$","li",null,{"children":"Suspense-enabled streaming"}]]}]

```

To enable this behavior, your webpack configuration must set:

```
// webpack.config.js

resolve: {
  conditionNames: ["react-server", "browser"],
},

```

## How to Render React Flight Data Chunks to JSX

In theory, the process is straightforward:

```tsx
import { renderToReadableStream } from "react-server-dom-webpack/server.browser";
import { createRoot } from "react-dom/client";
import { use } from "react";
import { createFromReadableStream } from "react-server-dom-webpack/client";

// Helper function to unpack promise values
function Use({ value }: { value: Usable<JSX.Element> }) {
  return use(value);
}

const stream = renderToReadableStream(<Story />);

createRoot(document.getElementById("root")!).render(
  <Use value={createFromReadableStream(stream)} />
);

```

However, it doesn’t work directly because of conditional exports. For example, `renderToReadableStream` is only available when the `react-server` condition is set, while `createRoot` only works when it isn’t.

A potential workaround is to bundle each set of APIs separately. For instance:

```tsx
import { renderToReadableStream } from "react-server-dom-webpack/server.browser";
import { createRoot, use, createFromReadableStream } from "./browser-bundle";

```

…or by exposing the APIs as a global variables.


## Transforming Client Components to References

Client components should be treated as references when loading them in a server component. With the `react-server` condition enabled, interactive APIs like `useState` are not available on the `react` module:

```tsx
TypeError: (0 , react__WEBPACK_IMPORTED_MODULE_1__.useState) is not a function or its return value is not iterable
```

The transformation code that converts client components into references is not shipped as a webpack plugin, but is available as a Node loader in the React repository:

https://github.com/facebook/react/blob/main/packages/react-server-dom-webpack/src/ReactFlightWebpackNodeLoader.js

This loader will transform a client component like:

```tsx
"use client";

import { useState } from "react";

export function Like() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => setCount(count + 1)}>Like</button>
      <span>{count === 0 ? "" : " +" + count + " "}</span>
    </>
  );
}

```

…into:

```tsx
import { registerClientReference } from "react-server-dom-webpack/server";
export const Like = registerClientReference(
  function () {
    throw new Error(
      "Attempted to call Like() from the server but Like is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component."
    );
  },
  "file:///Users/kasperpeulen/code/rsc-webpack-browser5/src/components/like.tsx",
  "Like"
);

```

The above transformation creates references to the client modules, allowing React to pass props to them from the server.

You can adapt the Node loader into a webpack loader like so:

```tsx
const { transformSource } = require("react-server-dom-webpack/node-loader");

module.exports = async function rscTransformLoader(code, map) {
  const callback = this.async();
  try {
    const { source } = await transformSource(
      code,
      { format: "module", url: "file://" + this.resourcePath },
      async (source) => ({ source })
    );
    callback(null, source, map);
  } catch (err) {
    callback(err);
  }
};

```

And register it:

```tsx
{
  test: /\.tsx?$/,
  use: [{ loader: require.resolve("./rsc-transform-loader") }],
}

```


## Generating Client Components and the Client Manifest

Using the [`react-server-dom-webpack/plugin`](https://github.com/facebook/react/blob/main/packages/react-server-dom-webpack/src/ReactFlightWebpackPlugin.js) plugin, you can generate client chunks (based on `'use client'` directives) along with a `react-client-manifest.json` file. An example manifest might look like:

```json
{
  "file:///Users/kasperpeulen/code/rsc-webpack-browser5/src/components/like.tsx": {
    "id": "./src/components/like.tsx",
    "chunks": [
      "vendors-node_modules_pnpm_react_19_1_0_node_modules_react_jsx-runtime_js",
      "vendors-node_modules_pnpm_react_19_1_0_node_modules_react_jsx-runtime_js.js",
      "client0",
      "client0.js"
    ],
    "name": "*"
  }
}

```

You should generate this manifest using a different webpack configuration than the one for your RSC bundle:

- **Do not** set the `react-server` condition.
- **Do not** transform client components to references here.

For example:

```tsx
// webpack.config.js
resolve: {
  conditionNames: ["browser"],
},
plugins: [new ReactServerWebpackPlugin({ isServer: false })],

```

Once the manifest is generated, reference it in your `renderToReadableStream` call:

```tsx
import manifest from "../dist/client/react-client-manifest.json";

function Use({ value }: { value: Usable<JSX.Element> }) {
  return use(value);
}

const stream = renderToReadableStream(<Story />, manifest);

createRoot(document.getElementById("root")!).render(
  <Use value={createFromReadableStream(stream)} />
);

```


## Adding Server Functions (Actions)

To define a server action, add `"use server";` at the top of a function:

```tsx
"use server";

const db = new Map();

export async function saveToDb(id: string, count: number) {
  db.set(id, count);
  console.log(`Saving that ${id} has ${count} likes`);
}

```

You can then pass this function into a client component:

```tsx
<ul>
  {users.map((user) => (
    <ul key={user.id}>
      {user.name}
      <Like onLike={saveToDb.bind(null, user.id)} />
    </ul>
  ))}
</ul>

```

When using `createFromReadableStream`, supply a `callServer` option to handle these actions:

```tsx
createRoot(document.getElementById("root")!).render(
  <Use
    value={createFromReadableStream(stream, {
      callServer: async (id: string, args: unknown[]) => {
        console.log("Action called with", { id, args });

        // e.g., file:///Users/.../actions.ts#saveToDb
        const [filepath, name] = id.split("#");

        // TODO: A bit hacky, but you need to locate the matching module
        const module = Object.keys(__webpack_modules__).find((mod) =>
          filepath.endsWith(mod.slice(1))
        );
        if (module) {
          const action = __webpack_require__(module)[name];
          return action?.(...args);
        }
      },
    })}
  />
);

```

Inline actions should, in theory, also be supported, but may require further configuration:

```tsx
// Server Component
import Button from "./Button";

function EmptyNote() {
  async function createNoteAction() {
    "use server";
    await db.notes.create();
  }

  return <Button onClick={createNoteAction} />;
}

```

## **Summary**

With these steps, you can generate React Flight chunks for server components, transform client components into references, bundle everything appropriately, and still run it all in the browser. This unlocks Storybook features like browser mocks in `beforeEach` and `play` functions in CSF files, preserving the user experience while staying compliant with React Server Components.
