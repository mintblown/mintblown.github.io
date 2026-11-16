# Lernprojekte

Lernprojekte is a collection of German-language, browser-based learning projects for mathematics, physics, and computer science. The materials range from short digital-skills guides to interactive models, exercises, and self-paced learning paths.

> **Language:** The website and most learning materials are in German. This English guide has a German counterpart: [README.de.md](README.de.md).

## Get started

There is no central build step, package manager, or dependency installation. To explore the site, open `index.html` in a browser. For local development, serving the repository over HTTP is more reliable, particularly for browser storage, modules, and Web Crypto:

```powershell
py -m http.server 8000
```

Then visit <http://localhost:8000/>. If `py` is not available, use `python -m http.server 8000`. Stop the server with Ctrl+C.

The site is static HTML, CSS, JavaScript, and local assets, and its deployment target is **GitHub Pages**. The recommended setup publishes the repository root from a selected branch; see [GitHub Pages deployment](doc/development.md#github-pages-deployment) for setup and verification. Keep paths relative to each page so the same files work locally and on GitHub Pages.

## Where things live

| Path | Contents |
| --- | --- |
| `index.html`, `styles.css`, `img/` | Main project directory and shared home-page assets/styles |
| `ma6/` | Mathematics, grade 6 |
| `if6/` | Digital skills and introductory computing |
| `ifef/` | Computer science, introductory upper-secondary level (EF) |
| `ph6/`, `ph9/` | Physics, grades 6 and 9 |
| `phef/` | Physics, introductory upper-secondary level (EF) |
| `phq1/` | Physics, Q1 |
| `malq1/` | Mathematics, advanced course, Q1 |
| `interactive/` | Larger interactive projects and learning environments |
| `codex/` | Project-specific prompts and authoring references |
| `doc/` | Developer and lesson-author documentation |

Most subject directories contain a landing page (`index.html`) and one directory per topic. A topic commonly keeps its entry page and scripts in `topic/html/`, images in `topic/img/`, and tests in `topic/tests/`. This is a convention, not a requirement: established projects have different layouts, so follow the closest existing example.

## Continue development

1. Pick the appropriate subject/grade directory and inspect its landing page and a similar topic.
2. Read any topic-level `README.md`; it may explain domain assumptions, data handling, or test procedures that are not repeated here.
3. Build the lesson using the existing project's structure and visual style. Add a link from that subject's landing page, and add an entry to the root `index.html` only when the project is meant to appear on the main page.
4. Keep calculations testable separately from DOM code where practical, and add focused tests for new behavior.
5. Preview from the repository root, verify all navigation and assets, and run the relevant topic tests.

New lessons can also be implemented with a coding AI such as Claude Code. Use the [learning-unit prompt template](doc/prompt-vorlage-lerneinheit.md) to provide the teaching requirements and direct the coding agent to inspect the repository, implement, test, and update relevant documentation. A teacher or subject-matter expert must still verify educational and factual correctness.

The detailed guides explain the architecture, how to create a learning unit, and how to preview and test changes:

- [Documentation index](doc/README.md)
- [Project architecture and conventions](doc/architecture.md)
- [Creating a learning unit](doc/creating-lessons.md)
- [Coding AI prompt template](doc/prompt-vorlage-lerneinheit.md)
- [Local preview, testing, and review checklist](doc/development.md)
- [Repository optimization strategy (German)](doc/optimierungsstrategie.md)

There is no single repository-wide test command. Test runners and setup vary by project; see [development and testing](doc/development.md) and the relevant topic README before running browser tests. Some browser tests use temporary profiles or touch local browser data.

## Educational and technical principles

- Make the learning goal and the next action clear. Prefer short, purposeful steps, meaningful feedback, and opportunities to explain or reflect.
- Treat scientific models and their limitations explicitly. Never silently replace a learner's measurement with an ideal or calculated value.
- Design for keyboard use, touch, small screens, readable contrast, and understandable labels. Interactive graphics should have an accessible description or an equivalent non-visual control.
- Keep personal learning data local unless a lesson clearly explains and obtains consent for another behavior. Do not introduce analytics or remote services without a clear need and appropriate disclosure.
- Use local assets and avoid adding build tools or dependencies unless the project genuinely needs them.

## Contributing

Keep changes focused, preserve neighboring projects' conventions, and document non-obvious lesson-specific behavior close to the lesson. Before sharing a change, check that links resolve, the lesson works at a narrow viewport and with a keyboard, and the relevant tests pass. Do not commit credentials, learner data, or generated browser profiles.
