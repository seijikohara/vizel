import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testDiagramClickToEdit,
  testDiagramCtrlEnterToSave,
  testDiagramDefaultContent,
  testDiagramErrorHandling,
  testDiagramEscapeToCancel,
  testDiagramInsert,
  testDiagramSelection,
  testDiagramSequence,
  testDiagramTyping,
  testGraphVizDiagramDefaultContent,
  testGraphVizDiagramErrorHandling,
  testGraphVizDiagramInsert,
  testGraphVizDiagramLayout,
  testGraphVizDiagramTyping,
} from "../../scenarios/diagram-bc.scenario";
import { DiagramFixture } from "./DiagramFixture";

describe("Diagram (Vitest Browser) - React", () => {
  test("diagram can be inserted via slash command", async () => {
    await render(<DiagramFixture />);
    await testDiagramInsert(page.elementLocator(document.body));
  });

  test("diagram shows default flowchart when inserted", async () => {
    await render(<DiagramFixture />);
    await testDiagramDefaultContent(page.elementLocator(document.body));
  });

  test("diagram can be edited by clicking", async () => {
    await render(<DiagramFixture />);
    await testDiagramClickToEdit(page.elementLocator(document.body));
  });

  test("Mermaid code can be typed in diagram", async () => {
    await render(<DiagramFixture />);
    await testDiagramTyping(page.elementLocator(document.body));
  });

  test("diagram shows error for invalid syntax", async () => {
    await render(<DiagramFixture />);
    await testDiagramErrorHandling(page.elementLocator(document.body));
  });

  test("diagram can be selected", async () => {
    await render(<DiagramFixture />);
    await testDiagramSelection(page.elementLocator(document.body));
  });

  test("diagram can render sequence diagram", async () => {
    await render(<DiagramFixture />);
    await testDiagramSequence(page.elementLocator(document.body));
  });

  test("escape key cancels edit mode", async () => {
    await render(<DiagramFixture />);
    await testDiagramEscapeToCancel(page.elementLocator(document.body));
  });

  test("Ctrl/Cmd + Enter saves diagram", async () => {
    await render(<DiagramFixture />);
    await testDiagramCtrlEnterToSave(page.elementLocator(document.body));
  });
});

describe("GraphViz Diagram (Vitest Browser) - React", () => {
  test("GraphViz diagram can be inserted via slash command", async () => {
    await render(<DiagramFixture />);
    await testGraphVizDiagramInsert(page.elementLocator(document.body));
  });

  test("GraphViz diagram shows default content when inserted", async () => {
    await render(<DiagramFixture />);
    await testGraphVizDiagramDefaultContent(page.elementLocator(document.body));
  });

  test("GraphViz DOT code can be typed in diagram", async () => {
    await render(<DiagramFixture />);
    await testGraphVizDiagramTyping(page.elementLocator(document.body));
  });

  test("GraphViz diagram shows error for invalid syntax", async () => {
    await render(<DiagramFixture />);
    await testGraphVizDiagramErrorHandling(page.elementLocator(document.body));
  });

  test("GraphViz can render different graph layouts", async () => {
    await render(<DiagramFixture />);
    await testGraphVizDiagramLayout(page.elementLocator(document.body));
  });
});
