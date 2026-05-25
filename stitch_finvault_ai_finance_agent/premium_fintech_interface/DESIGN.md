---
name: Premium Fintech Interface
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d8fb'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2ff'
  surface-container: '#ebedff'
  surface-container-high: '#e4e7ff'
  surface-container-highest: '#dce1ff'
  on-surface: '#131a34'
  on-surface-variant: '#434656'
  inverse-surface: '#282f4a'
  inverse-on-surface: '#eff0ff'
  outline: '#737687'
  outline-variant: '#c3c5d8'
  surface-tint: '#004cec'
  primary: '#003fc8'
  on-primary: '#ffffff'
  primary-container: '#1a56f5'
  on-primary-container: '#e1e4ff'
  inverse-primary: '#b7c4ff'
  secondary: '#5a5e6c'
  on-secondary: '#ffffff'
  secondary-container: '#dcdfef'
  on-secondary-container: '#5f6270'
  tertiary: '#005b3e'
  on-tertiary: '#ffffff'
  tertiary-container: '#007652'
  on-tertiary-container: '#89fcc7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#dfe2f2'
  secondary-fixed-dim: '#c3c6d6'
  on-secondary-fixed: '#171b27'
  on-secondary-fixed-variant: '#434653'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#faf8ff'
  on-background: '#131a34'
  surface-variant: '#dce1ff'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 34px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  amount-lg:
    fontFamily: Manrope
    fontSize: 34px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: -0.5px
  amount-md:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: -0.5px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 20px
  gutter: 12px
  section-gap: 24px
  stack-compact: 8px
  stack-default: 16px
---

## Brand & Style

The design system is engineered for a premium fintech experience that balances institutional trust with the agility of a modern startup. The brand personality is precise, transparent, and authoritative, yet avoids the coldness of traditional banking through purposeful whitespace and vibrant accent colors.

The visual style is a fusion of **Corporate Modern** and **Minimalism**. It prioritizes information density for data-rich screens while maintaining a breathable layout. Key characteristics include:
- **High Information Clarity:** Using scale and weight to guide the eye toward financial totals.
- **Intentional Contrast:** A deep navy foundation paired with a sterile light gray creates a sophisticated "dark mode/light mode" hybrid feel within a single view.
- **Modern Precision:** Hairline borders and specific container dimensions evoke a sense of high-end craftsmanship.

## Colors

The color palette of the design system is anchored by a "Midnight & Electric" theme. 

- **Primary & Accents:** The Electric Blue (#1A56F5) is the primary action color, used sparingly to draw attention to critical CTAs. Positive green (#059669) is reserved for growth indicators and successful transactions.
- **Surface Strategy:** The UI utilizes a Dark Navy (#0B0F1A) for top-level headers to create a "vault" like security feeling, while the main content area rests on a soft Light Gray (#F4F5F9).
- **Functional Semantics:** Red is used strictly as a status indicator (dot), while the text associated with negative values remains Dark Navy to maintain a sophisticated, non-alarmist aesthetic.

## Typography

This design system utilizes **Manrope** for its technical yet approachable character, which excels in rendering numerical data. 

- **Amount Styling:** Monetary values are treated as hero elements. They use a tighter letter-spacing (-0.5px) to ensure multi-digit figures remain compact and legible.
- **Information Hierarchy:** Headers are kept at a medium weight (500) to feel refined rather than aggressive. 
- **Labels:** Micro-copy and labels use uppercase styling with increased tracking to differentiate "metadata" from "content."

## Layout & Spacing

The design system follows a **Fixed-Fluid hybrid** layout model. On mobile devices, it adheres to a 20px safe-margin on the X-axis. 

- **Grid:** A 4-column grid for mobile and a 12-column grid for desktop.
- **Rhythm:** Spacing follows a 4px baseline, with 16px being the standard unit for internal card padding and 24px for vertical separation between distinct logical sections.
- **Safe Areas:** The design accommodates a notched header by housing the primary balance and profile information in a high-contrast dark header block that extends to the status bar.

## Elevation & Depth

Hierarchy in the design system is achieved through **Low-contrast Outlines** and **Tonal Layering** rather than traditional shadows.

- **Outlines:** Cards and containers use a crisp 0.5px border (#E8EAF0) to define boundaries against the light gray background. This creates a "blueprint" aesthetic that feels precise.
- **Surface Tiering:** 
    - **Level 0 (Background):** #F4F5F9 (Light Gray)
    - **Level 1 (Cards):** #FFFFFF (Pure White)
    - **Level 2 (In-card indicators):** Soft-tinted backgrounds for icons (e.g., 10% opacity of the icon color).
- **Interactive States:** Subtle 2px "Lift" shadows are permitted only on primary action buttons upon hover/press to provide tactile feedback.

## Shapes

The design system employs a "Soft-Geometric" shape language. 

- **Primary Radius:** A 14px radius is applied to all main containers, cards, and primary buttons. This provides a modern, friendly silhouette that contrasts with the hairline 0.5px borders.
- **Utility Radius:** Icon containers and smaller input fields use a tighter 8px radius to maintain structural integrity.
- **Icons:** Use a 24px glyph size centered within a 28x28px rounded container.

## Components

### Buttons
- **Primary:** Filled #1A56F5 with white text. 14px radius, 14px Manrope Bold.
- **Secondary:** Transparent with 0.5px #E8EAF0 border.
- **Height:** Standard buttons are 48px or 52px for high-intent actions.

### Cards
- **Structure:** White background, 14px radius, 0.5px border.
- **Content:** Internal padding is 16px or 20px. Use the `label-caps` style for headers within cards to maintain a structured, dashboard look.

### Icon Containers
- **Visuals:** 28x28px footprint with an 8px radius. Backgrounds should be a 10% opacity version of the icon's primary color (e.g., light blue background for a blue icon).

### Inputs & Selection
- **Field Style:** Minimalist. Use a bottom-border only or a very light hairline container. Focused states should highlight the border in Electric Blue.
- **Indicators:** Use 6px solid circular dots for category colors (e.g., expense tracking) to keep the UI clean.

### Navigation
- **Bottom Bar:** Solid Dark Navy (#0B0F1A) or White depending on the view. Icons are paired with 10px labels. The active state uses high-contrast white or primary blue.