import { type ReactNode, Suspense } from "react";
import { Users } from "./users";

import AppRouter from "next/dist/client/components/app-router";

export async function Story() {
  return (
    <AppRouter {...({} as any)}>
      <Text>All users</Text>
      <Suspense fallback={"Rendering async server components on the client..."}>
        <Users />
      </Suspense>
    </AppRouter>
  );
}

function Text({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
