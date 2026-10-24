import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExportCsvButton } from "./ExportCsvButton";

const meta = {
  title: "MemoFlow/ExportCsvButton",
  component: ExportCsvButton,
  args: { count: 2, onExport: () => undefined },
} satisfies Meta<typeof ExportCsvButton>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Selected: Story = {};
export const Empty: Story = { args: { count: 0 } };
export const Exporting: Story = { args: { busy: true } };
