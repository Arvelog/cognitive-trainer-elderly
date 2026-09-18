# Поруч — interface system

The redesign uses UI/UX Pro Max's accessibility, interaction, responsive-layout and React focus guidance. Its wellness search matched the Organic Biophilic style and Lora typography. Marketing-oriented hero/testimonial recommendations were not applicable to this working practice app. The final palette and layout below are product-specific choices, not an unmodified generated preset.

## Direction

A quiet, adult practice space: forest green, white surfaces, clear type and restrained rounded corners. One primary action per screen. No scores, streak pressure, ornamental animation or extra setup before practice.

- Primary/action: `#245c45`; hover: `#17432f`.
- Text: `#183c32`; secondary text: `#52665d`.
- Canvas: `#f7f9f7`; cards: `#ffffff`; supporting surfaces: `#edf4ee` and `#e6f0e5`.
- Success: `#276043` on `#eaf5ed`; retry/hint uses amber plus explanatory text.
- Focus ring: `#98630b`; on the dark session card: `#f5cf77`.
- Lora for welcoming and closing headings; IBM Plex Sans for instructions, answers and controls. Ukrainian content and local font fallbacks are preserved.
- Lucide icons for interface controls. Existing emoji remain only as exercise content, not navigation or structural icons.

## Screens and behavior

- Home: resume/full session first, short familiar-word session second, six directly selectable blocks, preparation and collapsed caregiver guidance.
- An active session must never be replaced without the native confirmation dialog. Cancel receives initial focus, Escape closes, focus returns to the triggering control.
- Practice: six-block progress rail, one large task, distinct audio and hint buttons, two or three large answers, collapsible caregiver help, persistent back/next controls.
- Short laptop viewports use tighter spacing without reducing instructional text. Phones use one task column and a two-button bottom bar with a safe-area inset.
- Blocks advance directly to the next task without automatic breaks. The optional «Перерва» button opens a pause where the user can continue, return later or finish early. Summary shows actual completed counts, including partial sessions.
- Keep the existing storage key, reducers, task generation and saved-answer migrations. The visual redesign does not replace saved task snapshots.

## Accessibility and validation

- Visible keyboard focus, skip link, semantic controls, native modal focus containment and descriptive labels.
- 44 px minimum controls; major task actions are 56–76 px.
- Reduced-motion and forced-colors handling; no timed or decorative animations.
- Measured text contrast: primary text/canvas 11.46:1; secondary text/mint 5.26:1; light text/action 6.41:1; primary action/light surface 7.32:1.
- Browser verification uses a separate local origin to avoid altering the user's saved practice.
- Verify home and task layouts at 320, 375, 768, 1024 and 1440 px, plus landscape; exercise both extended and short flows, reload/resume, confirmation/cancel, hints, writing recall and partial summaries.
- Run existing core, therapy and generation regression suites and the production build after implementation.
