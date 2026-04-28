---
name: Obsidian Council
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#1f1f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e4e2e4'
  on-surface-variant: '#c7c6ca'
  inverse-surface: '#e4e2e4'
  inverse-on-surface: '#303032'
  outline: '#919094'
  outline-variant: '#46464a'
  surface-tint: '#c8c6c7'
  primary: '#c8c6c7'
  on-primary: '#313031'
  primary-container: '#0a0a0b'
  on-primary-container: '#7a797a'
  inverse-primary: '#5f5e5f'
  secondary: '#e9c176'
  on-secondary: '#412d00'
  secondary-container: '#604403'
  on-secondary-container: '#dab36a'
  tertiary: '#b4c8e7'
  on-tertiary: '#1e314a'
  tertiary-container: '#000a1a'
  on-tertiary-container: '#677a97'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e3'
  primary-fixed-dim: '#c8c6c7'
  on-primary-fixed: '#1c1b1c'
  on-primary-fixed-variant: '#474647'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#d3e3ff'
  tertiary-fixed-dim: '#b4c8e7'
  on-tertiary-fixed: '#061c34'
  on-tertiary-fixed-variant: '#354862'
  background: '#131315'
  on-background: '#e4e2e4'
  surface-variant: '#353437'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-ui:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
  council-output:
    fontFamily: Newsreader
    fontSize: 19px
    fontWeight: '400'
    lineHeight: '1.7'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 32px
  gutter: 24px
  section-gap: 64px
  card-inner: 24px
---

## Brand & Style

The design system is engineered for high-stakes strategic environments. It evokes an atmosphere of a private digital war room or a high-level executive briefing. The personality is intellectual, stoic, and authoritative, minimizing visual noise to prioritize clarity of thought and the weight of decisions.

The design style is a hybrid of **Minimalism** and **Tonal Layering**. It utilizes a "Dark UI" first approach where depth is communicated through subtle shifts in charcoal values and microscopic border details rather than aggressive shadows. The interface remains quiet, allowing the "Council" outputs to command attention through superior typography and purposeful spacing.

## Colors

The palette is anchored in "Obsidian Black" (#050505) to eliminate screen glare and provide a void-like canvas for strategic data. 

- **Primary & Neutral:** Deep charcoals and blacks form the structural foundation. Surfaces use subtle value increments to denote hierarchy.
- **Accents:** "Muted Gold" (#C5A059) is used sparingly for critical path actions, high-priority "Council" conclusions, and premium states. "Slate Blue" (#4A5D78) serves as a secondary accent for interactive secondary elements and information density.
- **Functional:** Success and error states should be desaturated to maintain the serious tone—avoiding neon greens or bright reds in favor of sage and deep crimson.

## Typography

The typographic system bifurcates the user experience into "Interface" and "Intelligence."

- **Interface (Sans-Serif):** **Manrope** is used for all functional UI components, navigation, and input fields. Its geometric yet refined structure provides the necessary legibility for complex data.
- **Intelligence (Serif):** **Newsreader** is reserved exclusively for "Council" outputs, executive summaries, and strategic reports. This shift in typeface signals to the user that they are transitioning from "interacting" to "absorbing" authoritative information.
- **Metadata (Sans-Serif):** **Work Sans** is used for labels and small data points to maintain a grounded, professional feel.

## Layout & Spacing

This design system utilizes a **Fixed Grid** philosophy for desktop (12 columns) and a **Fluid Grid** for mobile. The layout prioritizes ample negative space to reduce cognitive load during decision-making.

The spacing rhythm is built on an 8px base unit. Margins are generous (32px minimum) to frame the content like a high-end publication. Elements are grouped into "Intelligence Clusters" using wide gaps (64px) to clearly separate distinct strategic threads.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**.

1.  **Base Layer:** The darkest obsidian background (#050505).
2.  **Surface Layer:** Elevated cards and panels use a subtle charcoal (#111112).
3.  **Interaction Layer:** Modals and drawers use a slightly lighter grey (#161618) with a 1px border (#242426).

Shadows are avoided in favor of 1px inner borders that create a "beveled" or "etched" appearance. For modals, a heavy backdrop blur (32px) is used to maintain focus while keeping the underlying strategic context visible.

## Shapes

The shape language is "Soft" (0.25rem / 4px). This minimal rounding removes the clinical coldness of sharp 90-degree angles while remaining significantly more professional and serious than the pill-shaped designs of consumer social apps.

- **Buttons/Inputs:** 4px radius.
- **Cards/Modals:** 8px (rounded-lg) to provide a structural frame for the 4px internal elements.
- **Selection Indicators:** Sharp vertical lines or micro-dots are preferred over large rounded blocks.

## Components

### Cards
High-contrast cards with no shadows. Use a 1px solid border (#242426) against the surface color. For "Council" insights, the top border may be accented with a 2px Muted Gold line.

### Buttons
- **Primary:** Solid Slate Blue (#4A5D78) with white text.
- **Secondary:** Ghost style with a 1px Slate Blue border.
- **Strategic Action:** Solid Muted Gold (#C5A059) with black text, reserved for "Finalize Decision" or "Submit to Council."

### Loading States
Instead of spinning wheels, use **Pulsing Glows**. Elements should subtly breathe with a soft luminescence, suggesting the "Council" is thinking. Shimmer effects on text should be slow and move from left to right.

### Drawers & Modals
Drawers slide from the right for "Contextual Intelligence." Modals are centered for "Critical Decisions." Both utilize a 1px border and a dark translucent overlay (80% opacity obsidian).

### Inputs
Minimalist underlines or very subtle 1px border boxes. Focus states should be indicated by the border turning from charcoal to Slate Blue, never using a glow or outer halo.