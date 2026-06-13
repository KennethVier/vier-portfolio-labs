---
name: PesoPilot
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 24px
  gutter: 16px
  table-cell-padding: 8px 12px
  density-compact: 4px
  density-comfortable: 12px
---

## Brand & Style
The design system is anchored in the concept of "Algorithmic Trust." It targets high-intent users who manage complex financial lives and value privacy above all else. The brand personality is private, intelligent, and highly organized—acting as a silent, efficient co-pilot rather than a distracting assistant.

The visual style is **Corporate / Modern** with a **High-Density** layout. It draws inspiration from "Modern Excel" and professional trading terminals: clean lines, structured data grids, and a focus on information utility. It avoids unnecessary decorative elements, favoring a functional aesthetic where every pixel serves a data-driven purpose. The emotional response should be one of control, clarity, and precision.

## Colors
This design system utilizes a palette optimized for financial clarity and "at-a-glance" status reporting.

- **Primary (Finance Blue):** A deep, trustworthy Cobalt (#2563EB) used for primary actions, active states, and navigation.
- **Secondary (Growth Green):** Used exclusively for positive financial indicators, savings goals, and income.
- **Accents (Warning/Critical):** Orange (#F59E0B) indicates budget thresholds (80%+), while Red (#EF4444) signifies overages or overdue liabilities.
- **Neutrals:** A "Cool Gray" scale based on Slate. Backgrounds use #F8FAFC to maintain a crisp, airy feel, while borders use #E2E8F0 to create the spreadsheet-inspired structure without visual clutter.

## Typography
The typography strategy is bifurcated between readability and data precision. 

**IBM Plex Sans** is used for headlines to provide a systematic, engineered feel. **Inter** handles all body copy and UI labels due to its exceptional legibility at small sizes. **JetBrains Mono** is reserved specifically for numerical data, currency values, and timestamps. This monospaced choice ensures that columns of numbers align perfectly in tables, facilitating easier vertical scanning of financial records.

On mobile devices, `display-lg` should scale down to `24px` to ensure large balance amounts remain visible without horizontal scrolling.

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop (12-column, 1200px max-width) and a **Fluid Grid** on mobile (4-column).

A strict 4px spacing scale is used to maintain high information density. Data grids and tables are the centerpiece:
- **Desktop:** High density with 8px vertical padding in table rows.
- **Mobile:** Reflows into card-based lists, but maintains the 4px rhythm for internal element grouping.
- **Sidebars:** Fixed 240px width for navigation, allowing the main content area to function as a data canvas.

Margins are kept tight (24px) to maximize the "dashboard" feel, ensuring that as much data as possible is visible "above the fold."

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows. This maintains the "Modern Excel" aesthetic.

- **Level 0 (Background):** #F8FAFC (Main canvas).
- **Level 1 (Cards/Grids):** Pure White (#FFFFFF) with a 1px solid border (#E2E8F0).
- **Level 2 (Modals/Popovers):** Pure White with a very soft, high-diffusion shadow (0px 4px 20px rgba(0, 0, 0, 0.05)) to suggest it is floating above the data.
- **Active State:** A subtle 2px Primary Blue left-border highlight is used for active table rows or navigation items.

## Shapes
The design system uses **Soft (0.25rem)** roundedness. This subtle rounding softens the technical nature of the finance data without making the UI feel "bubbly" or informal. 

- Standard components (Inputs, Buttons, Cards) use a **4px** corner radius.
- Tags and Status Badges use a slightly more rounded **6px** radius to distinguish them from actionable buttons.
- Graphs and Charts should use square ends for bars and line points to maintain the precision aesthetic.

## Components

### Buttons
- **Primary:** Solid Finance Blue with white text. High contrast, used for "Add Transaction" or "Save."
- **Secondary:** White background with Finance Blue border and text. Used for "Export" or "Filter."
- **Ghost:** No border or background unless hovered. Used for table row actions like "Edit."

### Data Grids
- Headers: #F1F5F9 background, bold `label-caps` typography, 1px bottom border.
- Rows: Zebra striping is discouraged; instead, use thin 1px horizontal borders (#E2E8F0) and a subtle #F8FAFC hover state.
- Cells: Currency must use `data-mono` and be right-aligned for comparison.

### Status Badges
- Small, uppercase text. 
- Backgrounds are low-opacity versions of the status color (e.g., Green 10%) with high-contrast text of the same hue for maximum accessibility.

### Input Fields
- Structured with a persistent label above the field. 
- Focus state: 1px Finance Blue border with a 2px light blue outer glow.
- Numeric inputs should include a "currency" prefix ($/€/£) locked to the left.

### Cards
- Used for high-level summaries (Net Worth, Monthly Spend).
- Minimalist: Title (top-left), Monospaced Value (center), Trend Indicator (bottom-right).