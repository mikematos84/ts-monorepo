import { ReactNode } from "react";
import classNames from "classnames";
import styles from "./Button.module.scss";

export type ButtonProps = {
  children?: ReactNode;
  status?: "info" | "success" | "danger" | "warning";
  className?: string;
};

const Button = ({ children, status = "info", className }: ButtonProps) => {
  return (
    <button
      type="button"
      className={classNames(
        // Load the default button styles
        "button",
        // Load the module override styles
        styles[`button--${status}`],
        // Load any style presets passed in
        className
      )}
    >
      {children && children}
    </button>
  );
};

export default Button;
