import { createVar, style } from "@vanilla-extract/css";

const scopedBackgroundColor = createVar();

export const wrapper = style({
  display: "flex",
  gap: "10px",
  justifyContent: "center",
  alignItems: "center",
});

export const button = style({
  vars: {
    [scopedBackgroundColor]: "blue",
  },
  backgroundColor: scopedBackgroundColor,
  borderRadius: "10px",
  padding: "10px",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
  color: "white",
  ":hover": {
    filter: "brightness(0.9)",
    transition: "background-color 0.3s ease",
  },
});

// I want to use button as a base class and extend it
export const buttonPrimary = style([
  button,
  { vars: { [scopedBackgroundColor]: "red" } },
]);
export const buttonSecondary = style([
  button,
  { vars: { [scopedBackgroundColor]: "green" } },
]);
