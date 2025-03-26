import React from "react";
import Button, { ButtonProps } from "./index.tsx";

export default {
  title: "Components/Button",
  component: Button,
};

const Template = (args) => <Button {...args} />;

export const Info = Template.bind({});
Info.args = {
  children: "Click Me!",
  status: "info",
} satisfies ButtonProps;

export const Success = Template.bind({});
Success.args = {
  children: "Click Me!",
  status: "success",
} satisfies ButtonProps;

export const Warning = Template.bind({});
Warning.args = {
  children: "Click Me!",
  status: "warning",
} satisfies ButtonProps;

export const Danger = Template.bind({});
Danger.args = {
  children: "Click Me!",
  status: "danger",
} satisfies ButtonProps;
