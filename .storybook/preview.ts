import type { Preview } from "@storybook/react-vite";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
    backgrounds: {
      default: "paper",
      values: [{ name: "paper", value: "#fcfcf8" }],
    },
  },
};

export default preview;
