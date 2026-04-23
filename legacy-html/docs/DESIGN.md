# The Design System: Clinical Precision & Editorial Air

## 1. Overview & Creative North Star: "The Digital Kinesiologist"
This design system is built upon the concept of **Clinical Precision meet Editorial Air**. We are moving away from the "SaaS Dashboard" trope of heavy boxes and cluttered grids. Instead, we treat the interface as a high-end medical journal—authoritative, whitespace-heavy, and meticulously organized.

The **Creative North Star** is "The Digital Kinesiologist." The UI should feel like a premium, quiet clinic: sterile but welcoming, minimalist but deeply informed. We achieve this through **Asymmetric Breathing Room** (larger margins on one side to guide the eye) and **Tonal Depth** rather than structural rigidity. We don't just show data; we curate health.

---

## 2. Colors: Tonal Architecture
The palette is rooted in a "Pure White" philosophy, using subtle shifts in temperature to define space.

### The "No-Line" Rule
Traditional 1px borders are a crutch. Within this system, sectioning must be achieved through **background shifts**. A sidebar isn't "boxed in"; it is a `surface-container-low` (#eff4ff) shape resting against a `background` (#f8f9ff) canvas. This creates a "soft edge" that feels modern and expansive.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of vellum paper.
- **Base Layer:** `surface` (#f8f9ff) – The primary canvas.
- **Mid Layer:** `surface-container-low` (#eff4ff) – For sidebars and secondary navigation.
- **Top Layer:** `surface-container-lowest` (#ffffff) – Used for primary content cards. 
By nesting `lowest` (Pure White) inside `low` (Soft Tint), you create a natural lift that signals "interact with me" without a single drop shadow.

### The "Glass & Gradient" Rule
To inject "soul" into a clinical environment:
- **Real-time States:** Use `primary` (#00685f) with a subtle linear gradient to `primary-container` (#008378) for active posture tracking elements.
- **Floating Insights:** For mobile overlays or "Insight" popovers, use `secondary` (#712ae2) at 80% opacity with a `24px backdrop-blur`. This "frosted" look keeps the user grounded in their data while highlighting the AI’s suggestion.

---

## 3. Typography: The Editorial Scale
We use **Inter** for its neutral, architectural legibility. To break the "template" look, we utilize extreme scale contrast.

- **Display (The Statement):** Use `display-lg` (3.5rem) for high-level daily scores. Tighten the letter-spacing (-0.02em) to give it a premium, "printed" feel.
- **Monospace Integration:** All biometric data (degrees of tilt, time elapsed, spinal curvature percentages) **must** use a Monospace font. This creates a visual distinction between "Human Language" (Inter) and "Machine Precision" (Mono).
- **Hierarchy as Navigation:** Large `headline-lg` titles should be used asymmetrically—pushed to the far left—to act as a visual anchor for the airy white space surrounding them.

---

## 4. Elevation & Depth: Tonal Layering
We reject the heavy shadows of 2010-era design. Depth is a whisper, not a shout.

- **The Layering Principle:** Use `surface-container-high` (#dce9ff) only for elements that require immediate attention, like a "Bad Posture" alert. 
- **Ambient Shadows:** If a card *must* float (e.g., a modal), use a "Tinted Ambient" shadow:
  - `box-shadow: 0 20px 40px rgba(11, 28, 48, 0.05);` 
  - The shadow color is derived from `on-surface` (#0b1c30), making it feel like a natural light obstruction rather than a grey smudge.
- **The "Ghost Border" Fallback:** In high-density data views where tonal shifts aren't enough, use a **Ghost Border**: `outline-variant` (#bcc9c6) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Minimalist Primitives

### Cards & Lists
*   **The Rule:** No dividers. Use `32px` of vertical white space (Spacing XL) to separate list items. 
*   **Interactive Cards:** Use `surface-container-lowest` (#ffffff). On hover, do not add a shadow; instead, shift the background to `surface-bright`.

### Buttons
*   **Primary:** `primary` (#00685f) background with `on-primary` (#ffffff) text. Use a 12px radius. 
*   **Secondary (Insight):** A glassmorphic treatment using `secondary-fixed-dim` at 20% opacity with deep purple text.

### Chips (Status Markers)
*   **Real-time:** `primary-fixed` background with a pulse animation.
*   **Warning:** `error_container` (#ffdad6) with `on-error-container` (#93000a) text. No borders.

### Input Fields
*   **The "Clinical" Input:** Remove the four-sided box. Use a `surface-container-low` background with a 2px bottom-border in `outline-variant`. This mimics a medical form and feels more "bespoke" than a standard input box.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use whitespace as a functional element. If a screen feels "empty," you are likely on the right track.
*   **DO** use `secondary` (Purple) exclusively for AI-driven insights and "Future" data.
*   **DO** ensure all Monospace numbers are tabular (equal width) for data comparison.

### Don't
*   **DON'T** use #000000. Use `on-surface` (#0b1c30) for the deepest blacks to maintain the "Soft Slate" tonal harmony.
*   **DON'T** use 1px solid #E2E8F0 borders for layout sectioning. Use the background color shifts between `surface` and `surface-container`.
*   **DON'T** crowd the edges. A minimum of `24px` (or `32px` on desktop) internal padding for all containers is mandatory to maintain the "Airy" feel.