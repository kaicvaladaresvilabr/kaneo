import { eq } from "drizzle-orm";
import db from "../../database";
import { userTable } from "../../database/schema";
import { insertProject } from "./insert-project";

async function creatorLocale(userId: string) {
  const [user] = await db
    .select({ locale: userTable.locale })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return user?.locale ?? null;
}

async function createProject(
  workspaceId: string,
  name: string,
  icon: string,
  slug: string,
  userId: string,
  locale?: string | null,
) {
  const columnLocale = locale?.trim() || (await creatorLocale(userId));
  return db.transaction((tx) =>
    insertProject(tx, {
      workspaceId,
      name,
      icon,
      slug,
      userId,
      locale: columnLocale,
    }),
  );
}

export default createProject;
