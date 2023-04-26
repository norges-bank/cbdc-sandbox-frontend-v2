import { Low, JSONFile } from "lowdb";

type Data = {
	accounts: Record<string, string[]>;
	logs: string[];
};

const adapter = new JSONFile<Data>(process.env.NODE_ENV === "production" ? "/data/db.json" : "db.json");
export const db = new Low(adapter);
