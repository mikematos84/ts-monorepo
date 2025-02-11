import { ReactNode } from "react";

export type HeaderProps = {
  children?: ReactNode;
};

export default function Header({ children }: HeaderProps) {
  return (
    <header className="header">
      <h1>Header</h1>
      <div>{children}</div>
    </header>
  );
}
