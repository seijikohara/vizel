import { expect, test } from "vitest";
import { render } from "vitest-browser-react";

function Hello() {
  return <button type="button">Vitest Browser</button>;
}

test("renders a button across browsers", async () => {
  // render() is async in vitest-browser-react 2.x; the brief omitted await.
  const screen = await render(<Hello />);
  await expect.element(screen.getByRole("button", { name: "Vitest Browser" })).toBeVisible();
  // element() returns HTMLElement | SVGElement; both extend Element.
  const el = screen.getByRole("button").element();
  expect(el).toBeInstanceOf(Element);
});
