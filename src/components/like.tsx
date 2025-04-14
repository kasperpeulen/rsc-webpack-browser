"use client";

import { useState } from "react";

export function Like({ onLike }: { onLike: (count: number) => Promise<void> }) {
  const [count, setCount] = useState(0);

  return (
    <>
      <button
        onClick={async () => {
          setCount(count + 1);
          await onLike(count + 1);
        }}
      >
        Like
      </button>
      <span>{count === 0 ? "" : " +" + count + " "}</span>
    </>
  );
}
