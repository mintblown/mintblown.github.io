# Prompt template: create a learning unit with a coding AI

Use this prompt with a repository-aware coding agent such as Claude Code. Replace the bracketed fields before starting. Keep the task focused: for a new lesson inside an existing subject, do not ask the agent to redesign the whole site.

```text
You are working in the existing Lernprojekte repository. Implement a new
browser-based learning unit in this repository; do not only provide a plan.
First inspect the repository and the closest existing lesson, its subject
landing page, shared styles, tests, and any topic README. Follow those
conventions and preserve unrelated work in the working tree.

## Learning requirements

- Subject and topic: [subject / topic]
- Target learners: [age, grade, school type or curriculum, prior knowledge]
- Learning outcomes: [what learners should understand or be able to do]
- Lesson sequence: [sections or steps and their order]
- Activity and interaction: [explanation, exercise, model, real experiment, etc.]
- Feedback and assessment: [how answers/actions are checked and what feedback says]
- Classroom context: [self-study / teacher-led / equipment, time, safety]
- Language and tone: [for example, clear German for grade 6]

## Subject-matter requirements

- Key concepts, terms, units, conventions, and formulas: [details]
- Assumptions, model limitations, and common misconceptions: [details]
- Sources to use or cite: [links or references]
- Expected examples and edge cases: [details]
- Do not invent missing scientific or curriculum facts. If a necessary detail
  is uncertain, ask me before implementing it or state the uncertainty clearly.

## Visual and technical requirements

- Target subject directory: [for example ph9/ or if6/]
- Lesson/topic name: [short lowercase-kebab-case name]
- Navigation: [subject landing page only / also root landing page]
- Existing assets or visual references: [paths, or "none"]
- Additional requirements: [colors, diagram style, device/browser constraints]

## Repository-specific instructions

- Use static HTML, CSS, JavaScript, SVG, and local assets consistent with the
  nearest existing lesson. Do not introduce a framework, build step, package,
  remote service, analytics, or external asset unless I explicitly approve it.
- Keep deployed URLs relative to the HTML page that uses them. GitHub Pages
  serves this static repository; the root entry point is index.html and there
  is no required build output directory.
- Use semantic HTML, responsive layout, visible input labels, accessible
  alternatives to dragging, keyboard operation, and useful status feedback.
- Keep calculations testable independently of DOM code where that fits the
  neighboring code. Validate empty, malformed, boundary, and incorrect input;
  never silently treat invalid or missing values as zero.
- For learner data, follow the nearest lesson's established approach. Explain
  persistence, consent, reset, and storage failure behavior; do not transmit
  personal or learner data.
- Distinguish learner measurements from theoretical/calculated comparisons.
  Preserve entered measurements and clearly state units, sign conventions,
  assumptions, and limitations.
- Update navigation links as requested. Update or create a topic README when
  it is needed to explain lesson flow, domain assumptions, data handling,
  sources, or how to run tests.
- Update repository documentation affected by your changes. At minimum,
  check the root README and doc/ guides; do not leave instructions outdated.

## Work and verification

1. Inspect relevant files and report any important ambiguity before making a
   consequential design or subject-matter assumption.
2. Implement the lesson and its navigation in the existing style. Keep the
   change scoped to this request.
3. Add a few focused tests for new behavior, following this topic's test
   conventions. Do not assume every *.test.js file is a Node test.
4. Run the relevant tests available in the environment. If a tool/browser is
   missing, say so explicitly; do not claim the test passed.
5. Check changed links and assets, local preview from the repository root,
   keyboard use, and a narrow viewport where practical.
6. Review the final diff for unrelated edits and update documentation to match
   the implemented behavior.

At the end, summarize changed files, the learner-facing result, tests run and
their outcomes, and any remaining manual subject-matter or GitHub Pages checks.

## My task

[Describe the exact lesson to create or change.]
```

## Using the template well

- Give the agent the actual curriculum, source material, and constraints instead of asking it to guess them.
- Identify whether the task is a new lesson in an existing area or a new subject/project; the current template is optimized for a lesson.
- Do not put credentials, student names, real student work, or other private information in a prompt or repository file.
- Read the generated lesson as a teacher: verify explanations, answer keys, safety notes, and alignment with the intended class.
- Verify the implementation locally and run the documented topic tests before merging or relying on a GitHub Pages deployment.
