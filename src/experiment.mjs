import { laboratories } from "./registry.mjs";

const levelControls = document.querySelector("#education-level");
const sections = document.querySelectorAll("[data-level]");

function showLevel(level) {
  const order = ["explore", "understand", "simulate"];
  const index = order.indexOf(level);
  for (const section of sections) {
    section.hidden = order.indexOf(section.dataset.level) > index;
  }
  levelControls.value = level;
}

function revealHash() {
  const section = [...sections].find((item) => `#${item.id}` === window.location.hash && item.id);
  if (section?.hidden) showLevel(section.dataset.level);
}

levelControls.addEventListener("change", () => showLevel(levelControls.value));
window.addEventListener("hashchange", revealHash);
showLevel("explore");
revealHash();

const lab = document.querySelector("[data-laboratory]");
if (lab) {
  try {
    const { mountLab } = await laboratories[lab.dataset.laboratory].load();
    mountLab(lab);
  } catch (error) {
    console.error(error);
    lab.textContent = "The virtual laboratory could not load. Reload the page to try again.";
  }
}
