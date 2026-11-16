# Creating a learning unit

This workflow is intended for a new standalone topic or a substantial addition to an existing one. The repository does not enforce a single template: first find the closest existing lesson in the same subject and use its conventions.

You can work through these steps yourself or give the requirements to a coding agent such as Claude Code. The [coding AI prompt template](prompt-vorlage-lerneinheit.md) captures the repository-specific instructions and asks the agent to inspect, implement, test, and document the work. Treat its output as a draft that still needs a teacher's or subject expert's review.

## 1. Define the learning experience

Before writing UI, make the teaching intention explicit:

- **Learner and prior knowledge:** Which age/year group is this for? What should learners already know?
- **Learning outcome:** What should a learner understand, calculate, interpret, or be able to do afterward?
- **Sequence:** What is the smallest sensible progression from introduction to practice and reflection?
- **Evidence of learning:** What response or action will show understanding, and what feedback should follow?
- **Classroom context:** Is this individual self-study, teacher-led work, a real experiment, or a mixture? Which equipment, time, or safety conditions matter?
- **Scope and assumptions:** Which idealizations, units, conventions, or excluded cases could change how an answer should be interpreted?

For physics and mathematics in particular, distinguish a learner's measured/input value from a theoretical or calculated comparison. State assumptions and units. Do not quietly correct, replace, round away, or label a plausible measurement as wrong merely because it differs from an ideal model.

## 2. Choose the location and inspect prior art

1. Place the topic in the relevant subject/grade directory.
2. Read that subject's `index.html`, stylesheet, and a similar lesson.
3. Search for reusable patterns already used in that subject (for example form feedback, accessible dialogs, graphs, or measurement tables).
4. Read any nearby `README.md`, especially where there are models, local storage, browser tests, or copied lessons.
5. Decide how the new unit should be reached: from its subject landing page, the root landing page, or both.

Do not assume the layout in the architecture guide is mandatory. A simple guide may only need one HTML page; a larger lesson may benefit from separate model, interaction, and presentation files.

## 3. Build the smallest coherent unit

A typical topic can use this structure:

```text
subject/topic-name/
  html/
    index.html
    lesson.js       # only if interaction needs JavaScript
    lesson.css      # only if topic-specific styling is needed
  img/
  tests/
  README.md         # when setup, assumptions, or test behavior needs explanation
```

Use the structure of the neighboring topics when it differs. Keep filenames descriptive and use lowercase kebab-case for new topic directories and files.

In the page:

- Set the document language (`lang="de"` for German lesson content), character encoding, responsive viewport, a meaningful title, and a concise description.
- Use semantic headings, landmarks, lists, and native form controls. Associate every input with a visible label.
- Give meaningful alternative text to informative images; mark decorative imagery as decorative. For a complex interactive graph or diagram, provide a textual description and a keyboard-operable alternative where possible.
- Use progressive enhancement where practical. Explain if JavaScript is required, and give a useful message in a `<noscript>` element when the core lesson cannot work without it.
- Keep relative references correct from the document's location. Preview from the repository root to catch broken URLs.

## 4. Design interaction and feedback

- Make the next action and available controls obvious. Keep instructions close to the relevant activity.
- Accept input formats already familiar in the surrounding project (for example German decimal commas when appropriate); validate explicitly and explain how to correct invalid input.
- Distinguish incomplete input, invalid input, and an incorrect answer. Do not silently coerce invalid or missing values to zero.
- Give actionable feedback that helps the learner make progress, not only a score or a color change. Expose status updates to assistive technology where appropriate.
- Preserve learner-controlled diagrams and measurements. If you display a model-based comparison, identify it as a comparison.
- Support keyboard interaction and touch targets. Do not make dragging the only way to operate a control; include keyboard or direct-entry alternatives.
- If progress is stored, explain what is saved, where it stays, how to reset it, and what happens if storage is unavailable. Ask for consent before optional persistence when the lesson's design requires it.
- Keep personal or classroom data on-device unless there is a clear, disclosed, consent-based reason to do otherwise.

## 5. Add navigation and documentation

Add a descriptive link to the subject landing page. If the topic is intended for the root homepage, add a matching card in the root `index.html`. Check all links from the pages themselves; similar directory names can make a relative path easy to get wrong.

Add a topic README when contributors need information that is not obvious from the UI or source, such as:

- teaching sequence, materials, prerequisites, or safety;
- model equations, sign conventions, and limitations;
- storage keys, consent, reset, or export behavior;
- which tests to run and whether they need a browser, Chrome, or a separate profile;
- copied/shared lesson files that must be kept in sync;
- sources and licenses for data or assets.

Prefer a focused topic README to duplicating this repository-wide guide.

When implementation changes affect navigation, lesson behavior, assumptions, storage, or test procedures, update the relevant topic README and any affected repository guide in the same change.

## 6. Test and review

Add a small number of focused tests for the behavior you introduced. Pure calculation/model logic is often easier to test separately from browser interaction. If there are browser fixtures, follow the topic README: some test files are intended to be opened in a browser or run with a project-specific script, not with Node's test runner.

Before considering the lesson complete, use the [development checklist](development.md). Check the actual learner journey, not only whether the page loads.
