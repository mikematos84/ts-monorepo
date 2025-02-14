import { render, screen } from "@testing-library/react";
import SampleComponent from ".";

test("renders SampleComponent", () => {
  render(<SampleComponent />);
  const element = screen.getByText(/Hello World!/i);
  expect(element).toBeInTheDocument();
});
