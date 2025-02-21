import {
  button,
  buttonPrimary,
  buttonSecondary,
  wrapper,
} from "./HelloWorld.css";

const HelloWorld = () => {
  return (
    <div className={wrapper}>
      <button type="button" className={button}>
        Hello World!
      </button>
      <button type="button" className={buttonPrimary}>
        Hello World!
      </button>
      <button type="button" className={buttonSecondary}>
        Hello World!
      </button>
    </div>
  );
};

export default HelloWorld;
