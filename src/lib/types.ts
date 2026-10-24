export const WORKSPACE_ID = "team-alpha";
export const STATUSES = ["To do", "In progress", "Done"] as const;
export type Status = (typeof STATUSES)[number];
export type Note = {
  id: string;
  workspace_id: string;
  title: string;
  body: string;
  createdAt: string;
};
export type ActionItem = {
  id: string;
  workspace_id: string;
  title: string;
  owner: string;
  status: Status;
};
export type Feedback = {
  id: string;
  message: string;
  workspace_id: string;
  createdAt: string;
  delivery: {
    status: "pending" | "delivered";
    attempts: number;
    nextAttemptAt: string;
    lastError?: string;
    deliveredAt?: string;
  };
};
export type Database = {
  notes: Note[];
  actionItems: ActionItem[];
  feedback: Feedback[];
};
