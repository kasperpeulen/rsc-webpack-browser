import { type ReactNode, Suspense } from "react";
import { Users } from "./users";

export function Story() {
  return (
    <div>
      <Text>All users</Text>
      <Suspense fallback={"Rendering async server components on the client..."}>
        <Users />
      </Suspense>
    </div>
  );
}

function Text({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
