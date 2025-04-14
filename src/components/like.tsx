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
