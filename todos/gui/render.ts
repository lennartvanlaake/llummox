import { createElement, jsxToString } from "jsx-async-runtime";
import { loadLanes } from "./board.ts";
import { Board, Layout } from "./components.ts";

const h = createElement;

export async function renderBoard(): Promise<string> {
  return await jsxToString(h(Board, { lanes: loadLanes() }));
}

export async function renderPage(): Promise<string> {
  return await jsxToString(
    h(Layout, null, h(Board, { lanes: loadLanes() })),
  );
}
