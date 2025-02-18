import { Meta, StoryObj } from "@storybook/react";
import HelloWorld from "./index.tsx";

const meta = {
  component: HelloWorld,
  title: "Components/HelloWorld",
} satisfies Meta<typeof HelloWorld>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic = {} satisfies Story;
