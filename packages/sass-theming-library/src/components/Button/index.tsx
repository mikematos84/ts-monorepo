import { ReactNode } from "react";

export type ButtonProps = {
  children?: ReactNode;
};

export default function Button({}: ButtonProps) {
  return <button className="button">Button</button>;
}
