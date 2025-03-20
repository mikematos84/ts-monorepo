import React from "react";
import Button from "./index.tsx";

export default {
  title: "Components/Button",
  component: Button,
};

const Template = (args) => <Button {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: "Click Me!",
};
