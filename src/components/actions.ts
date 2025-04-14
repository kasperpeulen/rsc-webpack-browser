"use server";

export const db = new Map();

export async function saveToDb(id: string, count: number) {
  db.set(id, count);
  console.log(`saving that ${id} has ${count} likes`);
}
