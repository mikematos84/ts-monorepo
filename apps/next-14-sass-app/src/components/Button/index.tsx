import { Button as SassButton } from "@mikematos84/sass-react-library";
import classNames from "classnames";
import styles from "./Button.module.scss";

type ButtonProps = React.ComponentProps<typeof SassButton>;

const Button = (props: ButtonProps) => {
  return (
    <SassButton className={classNames(styles["button--warn"])} {...props} />
  );
};

export default Button;
