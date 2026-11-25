---
name: ui-design
description: Design, build, or improve web and mobile interfaces using real product examples from UIZZE’s 800,000+ web and iOS screens. Use for UI design, UX design, frontend or web design, mobile app UI, responsive layouts, design systems, redesigns, visual polish, interface critique, and requests like “make this UI better.”
license: Apache-2.0
metadata:
  uizze-version: uizze-design-v14
  design-stack-version: 4.6.0
---

# Uizze UI Design

## Work from the product

Read the brief, existing UI, components, tokens, assets, and any PRODUCT.md or DESIGN.md before designing. The user's request and project constraints outrank this skill. Preserve an established visual system for extensions and polish; replace it only for an approved redesign. A new project does not require those files.

Identify the audience, primary task, important states, and intended result. Ask only about missing choices that would materially change the work. A precise request is enough to proceed; do not turn a small fix into a discovery workshop.

## Design decisions that prevent slop

- **Composition before decoration.** Make the main task, information order and next action readable at a glance. Use grouping, alignment, scale and whitespace before adding cards or borders. A repeated feature grid, nested panels or an extra label must serve the content; changing their colors does not make a generic composition product-specific.
- **A coherent visual system.** Reuse consistent roles for typography, spacing, color, corners, icons and elevation across screens. Emphasis must not compete with the primary action. Multiple accents, mixed typefaces, glass or expressive shapes can belong to a brand; preserve intentional choices rather than enforcing one palette or aesthetic everywhere. Use crisp assets from a consistent family, not emoji or invented logos as placeholders for finished controls.
- **Platform behavior is design.** Prefer the platform's established controls and navigation when they fit. Distinguish deeper navigation, a self-contained modal task and a short picker or sheet. Preserve keyboard behavior, focus, safe areas and back gestures. Completing sign-in or a purchase should return to the intended task without reopening a completed gate.
- **Design the state changes.** Match loading placeholders to the real layout; keep useful context during updates. Compose empty states around the next useful action and errors around recovery. Check long content, large text and keyboard-open layouts. Do not invent data or capabilities to make a successful state look convincing.
- **Motion earns its place.** Keep frequent actions quiet; reserve expressive moments for infrequent events. Give presses immediate feedback and use motion to explain a state or spatial change. Finger-driven movement should follow the gesture and remain interruptible on release or reversal. Keep reading content stable, avoid perpetual decorative loops, and preserve usability with reduced motion. Do not add an animation dependency just to satisfy this guidance.

## Use references to resolve design questions

When real examples can inform a new design, approved redesign or substantive improvement, use [the research playbook](reference/research.md): the agent discovers and inspects relevant screens and flow steps, selects useful examples, and turns their lessons into a checkable specification. Keep this work focused on the design question and handle discovery automatically; do not require manual browsing, a saved collection or shortlist approval. Supplied references and existing product constraints retain authority when present; small technical fixes need no research ceremony.

Apply [anti-slop craft](reference/anti-slop-craft.md) for visual consistency and, when relevant, navigation and motion. Preserve deliberate brand exceptions and native platform behavior.

Load these supporting playbooks only when the task needs them:

- Native inputs, sheets and menus: [mobile controls](reference/mobile-controls.md).
- Data-backed flows, recovery, typing or measured latency: [state and performance](reference/mobile-state-performance.md).
- New or revised illustrations and imagery: [image assets](reference/image-assets.md).
- Native screen, gesture and full-flow checks: [native verification](reference/native-verification.md).

## Image first, then implement

Follow [Uizze's image-to-UI workflow](references/uizze-image-to-ui.md) before visual implementation. For new visual work or an approved redesign, generate and inspect a realistic straight-on UI image with an available authorized tool before writing UI code. Use an approved supplied image instead when present. Save the target and its actual dimensions, then implement it 1:1 as semantic text, components and working controls.

Capture the real interface at the target viewport after fonts and images load, compare against the stable target, and correct layout, type, spacing and assets before claiming a match. Do not substitute a flattened screenshot, invent backend behavior or silently alter the design. Scoped technical fixes and audits do not need new concept images. If generation is unavailable, disclose that and use a supplied image or the existing system without blocking.

## Select the workflow

Load the playbook for the requested action, plus the platform and craft guidance needed to execute it:

- New interface or major redesign: [new-work](reference/new-work.md)
- Product or dashboard work: [operate](reference/operate.md)
- Refinement and polish: [polish](reference/polish.md)
- Simplification: [distill](reference/distill.md)
- Explicit web audit: [audit](reference/audit.md), read-only unless fixes were requested
- Native iOS: [iOS](reference/ios.md), alongside the action's playbook; for an audit, use [native audit](reference/audit.native.md) instead of a DOM scan
- Explicit `/overdrive`, “Uizze Overdrive”, or a request for exceptional interaction work: [Overdrive](reference/overdrive.md)

For implementation, use [craft](reference/craft.md) after the direction is settled. Load only relevant files; multiple complementary playbooks are allowed. Overdrive is opt-in, not the default for ordinary UI work. It requires a chosen direction before implementation.

“Use Uizze Overdrive on this screen” works through this router; a native slash command depends on the host. These are self-contained Markdown playbooks, not an installer, background service, or executable engine.

## Optional Uizze evidence

Read [the reference policy](references/uizze-reference-policy.md) before using `find_ui_references` or `find_ui_materials`. Inspect relevant visual evidence when it can inform the layout, state, interaction, or assets. Use the host's available tools, not invented calls or connections. Paid retrieval is optional; missing access does not block local design work.

Distinguish an exact reference, a related example, no match, and a service error. Briefly disclose a limitation that affected the result. Never claim an image was inspected or a state was found without evidence.

## Finish

Build the requested scope and exercise its important states. Render the real result at representative desktop/mobile sizes or native device classes, including the user's reported failing size.

For interaction changes, exercise the flow in motion: entry and exit, back, rapid or interrupted input, and relevant keyboard, loading and recovery transitions. A still image cannot verify motion. Use a short recording when it helps catch a flash, layout jump or broken gesture; measure performance before claiming a frame rate. Browser evidence does not establish native-device behavior.

Critique in a separate context using [the critique round](references/uizze-critique.md): a fresh subagent or a second model, given the contract, the captures and the chosen direction or supplied reference, names the single highest-impact difference. The agent that wrote the code does not grade its own render. Fix that one thing, render again, and stop after three rounds or when the critic finds nothing material; keep the best candidate rather than the last. Count the finish checks rather than judge them with `scripts/count-finish.mjs`: inert controls, missing loading, empty and error states, raw colours or radii outside the contract, default decoration, duplicate labels; check contrast and focus in the render. If a bounded pass cannot resolve an issue, report it instead of claiming a pass. When rendering is unavailable, distinguish code checks from visual verification.

Save the actual captures, tested states and source hashes using [visual verification](references/uizze-visual-verification.md). Its optional local integrity check rejects missing or stale evidence; it does not judge aesthetics or replace inspection. Link the receipt in the handoff and keep blocked checks explicit.

Keep the handoff concise: what changed, what was actually tested, and any remaining limitation. A skill does not authorize publishing, purchases, new dependencies, account changes, or destructive actions.
