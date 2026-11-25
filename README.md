# Physics Through Time

Physics Through Time is a historical physics timeline and browser-based virtual laboratory. Browse milestones by era, scientific category, difficulty, and lab availability. The Archimedes lab explores static buoyancy. The Eratosthenes lab uses local-noon shadows at two sites to predict observations and estimate Earth’s circumference.

## Develop

Use Node.js 22 or newer and npm. The local preview also uses Python 3. The site has zero npm dependencies.

```sh
npm test
npm run build
npm run dev
```

Open `http://localhost:3000/` for the timeline, `http://localhost:3000/experiments/archimedes/#virtual-lab` for the buoyancy lab, or `http://localhost:3000/experiments/eratosthenes/#virtual-lab` for the shadow measurements. Run `npm run build` after edits while the preview server is running, then reload the page.

## Host or link from a website

Run `npm run build` and publish the contents of `dist/` to a static host. Use a host that serves `index.html` for directory URLs and JavaScript modules with a JavaScript MIME type. Relative links allow the same output to work at the root of a domain or under a subdirectory. The repository tracks the source and regenerates `dist/` on demand.

A physics or engineering website can link to the hosted timeline, chapter, or lab. For example, if the output is hosted under `/physics-through-time/`, a link can open the lab directly.

```html
<a href="/physics-through-time/experiments/archimedes/#virtual-lab">
  Open the Archimedes virtual laboratory
</a>
```

If the host permits framing, use the same URL with a descriptive iframe title and enough height for the laboratory controls.

```html
<iframe
  src="/physics-through-time/experiments/archimedes/#virtual-lab"
  title="Archimedes’ principle virtual laboratory"
  width="100%"
  height="1000"
  loading="lazy"
></iframe>
```

## Repository map

| Path | Purpose |
| --- | --- |
| `src/catalog.mjs` | Historical milestone metadata and references |
| `src/registry.mjs` | Era and category definitions, validation, search, navigation, and lazy module loaders |
| `scripts/build.mjs` | Static timeline and shared experiment page templates |
| `src/timeline.mjs`, `src/experiment.mjs` | Timeline filtering and lesson-level interactions |
| `src/archimedes-content.mjs` | Sourced lesson sections, equations, and model assumptions |
| `src/archimedes.mjs` | DOM-independent parameters, solver, and plot data |
| `src/lab.mjs` | Archimedes controls, tank visualization, and measurement collection |
| `src/eratosthenes-content.mjs` | Sourced chapter on historical accounts, geometry, and assumptions |
| `src/eratosthenes.mjs` | Forward shadow prediction and inverse geometry in SI units |
| `src/eratosthenes-lab.mjs`, `src/eratosthenes-lab.css` | Shadow measurement controls and diagrams |
| `src/lab-tools.mjs` | Shared plot rendering, cursor sampling, and CSV export |
| `tests/` | Registry, physics, and integration checks |

The site builds published lessons into shareable directories. Planned experiments are discoverable as timeline entries. The laboratory module loads on its experiment page. Learn how to add and publish a milestone in the [authoring guide](docs/AUTHORING.md).

## Current scope

- Archimedes and Eratosthenes have published lessons and laboratories. The other 72 catalog entries are planned milestones.
- The Archimedes model solves static vertical force balance for a rigid upright cuboid in a stationary, uniform-density liquid with constant gravity and a fixed free surface. The lesson documents the geometry, sign conventions, and a worked analytical check.
- Dynamic buoyancy, drag, rotation, additional geometries, and finite-tank effects remain future stages.
- The Eratosthenes lab models a spherical Earth, two sites on a shared meridian, and parallel sunlight at local solar noon. The lesson discusses how this idealization differs from the ancient accounts. Both labs keep measurements in the current page session and support CSV export.
- Galileo’s inclined plane and Hooke’s elasticity are the next laboratory priorities.
