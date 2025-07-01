import { saveToDb } from "./actions";
import { Like } from "./like";
import * as Avatar from "@radix-ui/react-avatar";

export async function Users() {
  const users: { id: string; name: string }[] = await fetch(
    "https://jsonplaceholder.typicode.com/users",
  ).then((response) => response.json());
  return (
    <div>
      <Avatar.Avatar>
        <Avatar.Image
          src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?&w=128&h=128&dpr=2&q=80"
          alt="Colm Tuite"
        ></Avatar.Image>
      </Avatar.Avatar>
      <ul>
        {users.map((user) => (
          <ul key={user.id}>
            {user.name}
            <Like onLike={saveToDb.bind(null, user.id)} />
          </ul>
        ))}
      </ul>
    </div>
  );
}
