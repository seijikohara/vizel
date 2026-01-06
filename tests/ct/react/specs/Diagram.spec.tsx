import { test } from "@playwright/experimental-ct-react";
import {
  testDiagramClickToEdit,
  testDiagramCtrlEnterToSave,
  testDiagramDefaultContent,
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
} from "../../scenarios/diagram.scenario";
import { DiagramFixture } from "./DiagramFixture";

test.describe("Diagram - React", () => {
  test("diagram can be inserted via slash command", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testDiagramInsert(component, page);
  });

  test("diagram shows default flowchart when inserted", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testDiagramDefaultContent(component, page);
  });

  test("diagram can be edited by clicking", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testDiagramClickToEdit(component, page);
  });

  test("Mermaid code can be typed in diagram", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testDiagramTyping(component, page);
  });

  test("diagram can be selected", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testDiagramSelection(component, page);
  });

  test("diagram can render sequence diagram", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testDiagramSequence(component, page);
  });

  test("escape key cancels edit mode", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testDiagramEscapeToCancel(component, page);
  });

  test("Ctrl/Cmd + Enter saves diagram", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testDiagramCtrlEnterToSave(component, page);
  });
});

test.describe("GraphViz Diagram - React", () => {
  test("GraphViz diagram can be inserted via slash command", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testGraphVizDiagramInsert(component, page);
  });

  test("GraphViz diagram shows default content when inserted", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testGraphVizDiagramDefaultContent(component, page);
  });

  test("GraphViz DOT code can be typed in diagram", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testGraphVizDiagramTyping(component, page);
  });

  test("GraphViz diagram shows error for invalid syntax", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testGraphVizDiagramErrorHandling(component, page);
  });

  test("GraphViz can render different graph layouts", async ({ mount, page }) => {
    const component = await mount(<DiagramFixture />);
    await testGraphVizDiagramLayout(component, page);
  });
});
