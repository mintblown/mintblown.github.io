# Architecture and conventions

## Application shape

This repository is a static website. Pages are authored as HTML and styled with CSS; interaction is implemented with browser JavaScript and SVG. There is no repository-wide application framework, package manifest, compiler, bundler, or shared test runner. A lesson can therefore be developed and previewed independently, but conventions and test commands are not identical everywhere.

The repository root is the main directory. Its `index.html` links to selected subject/grade areas. Each subject directory usually has its own `index.html`, shared styles, and topic folders. These landing pages are ordinary HTML and link to lessons with relative paths. Some larger learning environments live under `interactive/` and are more self-contained.

## Main areas

| Directory | Purpose |
| --- | --- |
| `ma6/` | Mathematics, grade 6 |
| `if6/` | Digital skills and introductory computing |
| `ifef/` | Computer science, upper-secondary introductory level |
| `ph6/`, `ph9/` | Physics, grades 6 and 9 |
| `phef/` | Physics, upper-secondary introductory level |
| `phq1/` | Physics, Q1 |
| `malq1/` | Mathematics advanced course, Q1 |
| `interactive/` | Larger multi-page or map-based learning environments |
| `img/` | Shared assets used by the root landing page |
| `codex/` | Project-specific authoring prompts and references |

The labels reflect the current site organization; they are not enforced by code.

## Typical lesson layout

A common, but not universal, topic layout is:

```text
subject/
  index.html                 # Subject landing page
  styles.css                 # Subject-level design
  topic-name/
    html/
      index.html             # Lesson entry page
      lesson.js              # Lesson behavior, if needed
      lesson.css             # Lesson-specific styles, if needed
    img/                      # Topic-specific images and diagrams
    tests/                    # Focused model or browser tests
    README.md                 # Important topic-specific notes, if needed
```

The actual source tree includes useful variations: a whole interactive application may live directly in its topic directory; a simple guide may consist mostly of HTML and images; scripts and styles may have domain-specific names; and copied versions of a lesson may need to stay synchronized. Follow a nearby, maintained example rather than reshaping an existing topic just to match this sketch.

## Navigation and assets

- Add a lesson link to its subject landing page. Add a root landing-page card only if the project belongs in the root selection.
- Resolve each `href`, script, stylesheet, and image URL relative to the HTML document that uses it. A page at `subject/topic/html/index.html` reaches a subject-level stylesheet with `../../styles.css`; a sibling asset may instead use a path such as `../img/example.svg`.
- Prefer local assets. Preserve required license/source notices for existing vendor files and document the source of newly added third-party assets.
- Keep deployed paths case-sensitive in practice. Match the exact spelling and capitalization of filenames and links.
- Do not assume a server-side route, API, or external service. Static hosting serves files; navigation should point to actual HTML files.

## JavaScript and data

Keep calculations and state transitions independent from the DOM where that makes the lesson easier to test. The repository already has examples of model files separated from presentation/interaction scripts. For small, explanatory lessons, a single script may be clearer; do not introduce abstractions without a concrete benefit.

Persistence is a lesson-level choice, not a shared repository service. Existing projects use a mix of no persistence, in-memory state, URL state, `localStorage`, and `sessionStorage`; some explain optional consent and reset behavior in detail. Before changing persistence, read the topic documentation and preserve its established key names, versioning, consent behavior, and error messages. Never rely on one lesson's data to be available to another.

## Shared design

Subject-level stylesheets provide the visual context for many lessons, but not every project uses them identically. Reuse the surrounding typography, spacing, colors, and controls when extending an existing subject. A standalone interaction can have its own stylesheet when that is already the pattern. Avoid broad CSS changes to shared stylesheets unless the requested behavior is genuinely shared.
