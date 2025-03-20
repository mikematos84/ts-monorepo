import { ReactNode } from "react";
import classNames from "classnames";

import styles from "./Button.module.scss";

export type ButtonProps = {
  children?: ReactNode;
  className?: string;
};

const Button = ({ children, className }: ButtonProps) => {
  return (
    <button type="button" className={classNames(styles.button, className)}>
      {children && children}
    </button>
  );
};

export default Button;
