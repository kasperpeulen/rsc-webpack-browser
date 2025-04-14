import { Like } from "./like";

export async function Users() {
  await new Promise((resolve) => setTimeout(resolve, 750));
  const users: { id: string; name: string }[] = await fetch(
    "https://jsonplaceholder.typicode.com/users",
  ).then((response) => response.json());
  return (
    <div>
      <ul>
        {users.map((user) => (
          <ul key={user.id}>
            {user.name}
            <Like />
          </ul>
        ))}
      </ul>
    </div>
  );
}
