import "@vizel/svelte/styles.css";
import "@vizel/svelte/mathematics.css";
import { mount } from "svelte";

import App from "./App.svelte";

import "./styles.css";

const target = document.getElementById("app");
if (target) {
  mount(App, { target });
}
