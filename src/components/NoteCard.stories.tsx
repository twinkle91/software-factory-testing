import type { Meta, StoryObj } from "@storybook/react-vite";
import { NoteCard } from "./NoteCard";

const meta = {
  title: "MemoFlow/NoteCard",
  component: NoteCard,
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    note: {
      id: "story-note",
      workspace_id: "team-alpha",
      title: "Q4 Architecture Review",
      body: "## A clear next step\n\nVerify **Mastra Sandbox isolation**.\n\n- Keep the context\n- Share the decision",
      createdAt: "2026-10-20T09:00:00.000Z",
    },
  },
} satisfies Meta<typeof NoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongContent: Story = {
  args: {
    note: {
      ...meta.args.note,
      title:
        "A longer decision that should wrap without hiding any important context",
      body: "# Technical decision\n\nLong notes stay readable and remain fully visible.\n\n> Record why a decision was made.\n\nUse `atomic writes` to preserve data.",
    },
  },
};
