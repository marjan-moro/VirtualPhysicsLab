# Authoring an experiment

Use the [experiment template](EXPERIMENT-TEMPLATE.md) to plan a milestone, its lesson, and its laboratory. Start from the catalog record and keep each fact in the appropriate data source. The build generates the timeline, cards, lesson pages, and navigation from these modules.

## 1. Add or update the catalog entry

Edit [the catalog](../src/catalog.mjs). Its rows map to the following registry fields.

| Field | Contract |
| --- | --- |
| `id`, `slug` | Unique lowercase, hyphen-delimited identifiers. Catalog rows derive the ID from the slug. Preserve published slugs for stable URLs. |
| `title`, `subtitle`, `description` | Display title, short subtitle, and a concise description that states the experimental or observational result. |
| `year`, `endYear`, `approximate`, `displayDate` | Negative years are BCE, positive years are CE, and zero is invalid. Use `endYear` for a range and `approximate` for a date known only approximately. Use an optional `displayDate` when a label needs to distinguish a measurement from its reporting date. Sorting uses `year`. |
| `scientists` | Individual or collaboration names. |
| `era`, `categories`, `difficulty`, `kind` | IDs from [the registry](../src/registry.mjs). An era is a historical classification. Categories describe the science and may contain several IDs. The kind is `experiment`, `observation`, or `theory`. |
| `keywords`, `related` | Search aliases and relevant milestone IDs. Related IDs must exist elsewhere in the registry. |
| `status`, `laboratory` | `planned` for a timeline entry or `published` for a complete lesson. A published lesson can have `null` laboratory availability or a key in `laboratories`. |
| `thumbnail` | Optional `{ src, alt, credit, license, source }` object. Store licensed local assets under `src/` and use their deployment-relative `assets/` paths in `src`. Use `source` for the image attribution link. Verify the built image URL in every context where its card appears. |
| `references` | One or more `{ label, url }` objects with working links to primary works, museum or university histories, collaboration records, or other credible sources. |

Use the date of the observation, experiment, or publication supported by the reference, and document the distinction when those dates differ. Qualify disputed anecdotes and explain gaps in the historical record. Check the initial rendering and the filtered rendering, including references, status badges, and published links.

## 2. Write the lesson

Add a DOM-independent content file in `src/` and export a named `content` array. Register its dynamic import in `contentLoaders` under the experiment ID. Use the [Archimedes chapter](../src/archimedes-content.mjs) as a model.

Each section has `id`, `title`, `level`, and `paragraphs`. Use unique section IDs beginning with a lowercase letter and consisting of lowercase letters, numbers, and hyphens. Use `explore` for conceptual explanations and historical context, `understand` for derivations and measurements, and `simulate` for the model, numerical method, or error analysis. The level selector exposes sections through the chosen level, and the build derives the table of contents from those sections.

Add optional `equations: [{ text, description }]` with readable notation and definitions, plus `references: [{ label, url }]` to support specific claims. Write plain text in the module. The page template escapes text and generates accessible HTML. Skip sections whose content would be empty or speculative.

## 3. Implement the physics module

Place the solver in its own ECMAScript module under `src/`. The model should import without a browser. Document the coordinate origin, sign convention, parameters in SI units, and returned state. Include input bounds and the scientific or usability reason for any bounds outside the governing model itself. Reject invalid parameters or disclose any explicit conversion or bounding operation.

The [Archimedes solver](../src/archimedes.mjs) illustrates a static model. It exports `defaultParameters`, `parameterDefinitions`, `validateParameters`, `solveArchimedes`, and `getPlots`. Each parameter definition gives `label`, `unit`, `min`, `max`, and `step` for controls. The solver accepts numerical SI inputs and returns the complete derived state. The model computes signed depth downward from the free surface and signed force upward. Submerged height is bounded by the geometric intersection of the block and liquid.

Use an exact expression if practical. The [Eratosthenes solver](../src/eratosthenes.mjs) illustrates a measurement-based experiment with separate prediction and inference functions. For a dynamic lab, define timestep and initial and boundary conditions in the physics module. Keep rendering pace separate from numerical stepping. For a stochastic lab, document how samples are generated and use a controlled random seed in validation tests where applicable.

## 4. Mount the laboratory

Add a browser module whose named export `mountLab(root)` mounts the lab in the shared experiment page’s container. Register a `{ load: () => import("./my-lab.mjs") }` entry in `laboratories` under the exact key assigned to the catalog entry’s `laboratory` field. The shared page supplies the lesson shell, lab mount, and shared `lab.css`. To add styles just for that lab, include the filename as `stylesheet` in the same registry entry. The [Archimedes lab](../src/lab.mjs) and [Eratosthenes lab](../src/eratosthenes-lab.mjs) show how to reuse layout, labeled inputs, measurement tables, and feedback with different visualizations.

- **Controls and state.** Keep the valid parameter object authoritative. Translate changes into solver inputs, call the solver, and render the returned state. Surface validation errors in the form and provide a reset. Offer controls for behaviors supported by the model. For dynamic experiments, reuse applicable play, pause, and stepping patterns as they are introduced.
- **Plots.** Return plot descriptors such as `{ id, title, xLabel, yLabel, note, points, current }`. Each point is `{ x, y }` in the labeled units. A marker for the current state can be `null` when its value is undefined, such as an equilibrium submerged fraction for a sinking body. Check the data against the solver before rendering it.
- **Measurements.** Snapshot input parameters and derived outputs when the student records a trial. Label the table and CSV columns with units. Preserve full numerical values for export even when the display rounds for readability. The shared `serializeCsv(headings, rows)` function in [lab tools](../src/lab-tools.mjs) handles commas, newlines, and quotes. The same module provides `drawPlot`, `sampleCurve`, and `downloadCsv`.
- **Visualization and challenges.** Describe diagrams in text, label controls, and make chart inspection reachable by keyboard. Tie challenge feedback to measurable state, with the tolerance specified if a correct result has a range.

## 5. Validate and publish

1. Add a `tests/<experiment>.test.mjs` suite with analytical cases, parameter boundaries, invalid inputs, and derived result or graph consistency. Include relevant conservation checks and convergence tests if the method requires approximation.
2. Check references against the date and claims in the catalog and lesson. Verify the license and credit of any illustration and distinguish a historical source image from an illustrative reconstruction.
3. Add `status: "published"` to the entry’s date and publication metadata object when its content module is complete. Entries default to `planned` with `laboratory: null`. Assign a lab key in the same object after its model and applicable interactions pass validation. Keep status and loader registrations in the same change.
4. Run `npm test` and `npm run build`. Open the generated page and check the title, deep links, previous and next navigation, keyboard access, controls and reset, responsive layout, live values, and CSV download where applicable.
5. Record model limitations, relevant numerical tolerances, and deferred features in the lesson and any release summary.

For a copyable, testable physics example outside the registry, see [the ideal spring model](examples/spring.mjs) and [its tests](examples/spring.test.mjs). Run `node --test docs/examples/spring.test.mjs`.
