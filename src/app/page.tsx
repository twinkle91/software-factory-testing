import { MemoFlow } from "@/components/MemoFlow";
import { readDatabase } from "@/lib/store";
import { WORKSPACE_ID } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const database = await readDatabase();
  return (
    <MemoFlow
      initialNotes={database.notes.filter(
        (note) => note.workspace_id === WORKSPACE_ID,
      )}
      initialItems={database.actionItems.filter(
        (item) => item.workspace_id === WORKSPACE_ID,
      )}
    />
  );
}
