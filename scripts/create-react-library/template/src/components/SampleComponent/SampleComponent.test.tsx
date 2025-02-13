import React from "react";
import { render, screen } from "@testing-library/react";
import SampleComponent from ".";

test("renders SampleComponent", () => {
  render(<SampleComponent />);
  const element = screen.getByText(/SampleComponent/i);
  expect(element).toBeInTheDocument();
});
