import { mount } from "./main.js";
const app = mount(document.getElementById("app"), { standalone: true });
if (import.meta.env.DEV) window.__weightOfLight = app;
