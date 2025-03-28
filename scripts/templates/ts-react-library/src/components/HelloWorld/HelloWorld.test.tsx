import React from "react";
import { render, screen } from "@testing-library/react";

import HelloWorld from "./index.tsx";

test("renders HelloWorld", () => {
  render(<HelloWorld />);
  const element = screen.getByText(/Hello World!/i);
  expect(element).toBeInTheDocument();
});
