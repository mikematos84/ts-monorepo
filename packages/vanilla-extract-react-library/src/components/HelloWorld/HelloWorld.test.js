import { render, screen } from "@testing-library/react";
import HelloWorld from ".";

test("renders HelloWorld", () => {
  render(<HelloWorld />);
  const element = screen.getAllByText(/Hello World!/i);
  expect(element.length).toBe(3);
});
