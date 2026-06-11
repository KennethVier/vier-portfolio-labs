# Design System

Version: 1.0

Status: Approved Draft

Derived From:

* 00-source-of-truth.md
* design.md
* Stitch Generated Screens

Authority Level:

Visual Authority

---

# Purpose

This document defines the official design system for PesoPilot v1.0.

Its purpose is to ensure:

* Consistency
* Scalability
* Professionalism
* Data readability
* Financial clarity

All UI implementation must follow this document and the Stitch-generated design system.

---

# Design Authority

The following file is the highest authority for visual decisions:

```txt
design.md
```

When conflicts exist:

```txt
design.md wins
```

This document exists to explain how the design system should be implemented.

---

# Design Philosophy

PesoPilot follows:

```txt
Algorithmic Trust
```

The UI should feel:

```txt
Private
Intelligent
Professional
Organized
Reliable
```

Users should feel:

```txt
Control
Clarity
Confidence
```

while using the application.

---

# Design Direction

PesoPilot is:

```txt
Corporate
Modern
Data Driven
High Density
```

Influences:

```txt
Modern Excel
Trading Dashboards
Financial Workstations
Professional Analytics Platforms
```

The application is NOT:

```txt
A Banking App
A Crypto Dashboard
A Social App
A Gamified Finance App
```

---

# Visual Principles

Every screen should prioritize:

1. Financial Clarity
2. Information Density
3. Readability
4. Speed of Understanding
5. Consistency

Visual decoration should never compete with financial data.

---

# Color System

Source:

```txt
design.md
```

---

# Primary Color

Purpose:

```txt
Primary Actions
Navigation
Active States
```

Finance Blue

Examples:

```txt
Buttons
Selected Navigation
Links
Active Filters
```

---

# Success Color

Purpose:

```txt
Income
Savings
Positive Trends
```

Growth Green

Examples:

```txt
Income Metrics
Savings Metrics
Positive Indicators
```

---

# Warning Color

Purpose:

```txt
Budget Warnings
```

Orange

Examples:

```txt
80% Budget Usage
Potential Overspending
```

---

# Error Color

Purpose:

```txt
Critical Financial Risk
```

Red

Examples:

```txt
Budget Deficits
Failed Operations
Critical Alerts
```

---

# Neutral Palette

Purpose:

```txt
Layouts
Cards
Tables
Backgrounds
```

Should remain subtle.

Financial information should remain the visual focus.

---

# Typography

Source:

```txt
design.md
```

---

# Heading Font

```txt
IBM Plex Sans
```

Used for:

```txt
Page Titles
Section Headers
Metric Headers
```

Characteristics:

```txt
Technical
Professional
Structured
```

---

# Body Font

```txt
Inter
```

Used for:

```txt
Descriptions
Labels
Forms
Tables
Navigation
```

Characteristics:

```txt
Readable
Efficient
Clean
```

---

# Data Font

```txt
JetBrains Mono
```

Used for:

```txt
Currency Values
Totals
Financial Metrics
Timestamps
```

Purpose:

```txt
Perfect Numeric Alignment
```

Example:

```txt
₱15,000.00
₱8,250.00
₱1,245.50
```

must align vertically.

---

# Typography Rules

Do:

```txt
Use Mono for financial values
Use IBM Plex Sans for headings
Use Inter for body content
```

Do Not:

```txt
Mix random fonts
Use decorative fonts
Use script fonts
```

---

# Layout System

Desktop:

```txt
12 Column Grid
1200px Max Width
```

Mobile:

```txt
4 Column Grid
Fluid Layout
```

---

# Layout Principles

The application should feel like:

```txt
A Financial Workspace
```

not

```txt
A Marketing Website
```

---

# Sidebar

Fixed Width:

```txt
240px
```

Contains:

```txt
Dashboard
Expenses
Salary Cutoff
Savings
Cashflow
Reports
Expense Inbox
Settings
```

Active item:

```txt
Finance Blue Indicator
```

---

# Page Content Area

Primary working area.

Purpose:

```txt
Data
Reports
Forms
Dashboards
```

Must maximize usable space.

---

# Dashboard Design Rules

Dashboard is the application's most important screen.

Must show:

```txt
Income
Expenses
Savings
Available Cash
Budget Status
Insights
```

Above the fold.

---

# Dashboard Philosophy

Users should immediately understand:

```txt
How much money they have
How much they spent
How much they saved
Whether they are at risk
```

without scrolling.

---

# Dashboard Cards

Purpose:

High-level summaries.

Examples:

```txt
Income
Expenses
Savings
Remaining Cash
```

Structure:

```txt
Title
Value
Trend
```

Value:

```txt
JetBrains Mono
```

---

# Table Design

Tables are first-class components.

The application is heavily data-driven.

---

# Table Rules

Headers:

```txt
Bold
Uppercase
High Contrast
```

Rows:

```txt
Clean
Readable
Compact
```

Avoid:

```txt
Heavy Zebra Striping
```

Use:

```txt
Subtle Hover States
Thin Dividers
```

---

# Financial Table Rules

Currency values:

```txt
Right Aligned
JetBrains Mono
```

Example:

```txt
Expense Table
Income Table
Savings Table
```

---

# Card Design

Cards should:

```txt
Contain Information
Not Decoration
```

Characteristics:

```txt
Minimal
Bordered
Low Elevation
```

Avoid:

```txt
Heavy Shadows
Glassmorphism
Neon Effects
```

---

# Status Badges

Purpose:

Quick status recognition.

Examples:

```txt
Active
Pending
Approved
Warning
Critical
```

Style:

```txt
Subtle Background
Colored Text
```

Must remain readable.

---

# Forms

Forms are critical for financial entry.

Every form should prioritize:

```txt
Speed
Accuracy
Validation
```

---

# Input Design

Requirements:

```txt
Persistent Labels
Clear Errors
Predictable Layout
```

Examples:

```txt
Expense Form
Income Form
Savings Form
```

---

# Currency Inputs

Must display:

```txt
₱
```

prefix.

Examples:

```txt
₱150
₱2500
₱15000
```

Validation should occur before persistence.

---

# Empty States

Every screen requires:

```txt
Empty State
```

Examples:

```txt
No Expenses Yet

No Savings Yet

No Reports Available
```

Provide guidance for next actions.

---

# Loading States

Every data-driven screen requires:

```txt
Loading State
```

Examples:

```txt
Dashboard Loading
Report Loading
Expense Loading
```

Avoid blank screens.

---

# Error States

Every feature requires:

```txt
Error State
```

Examples:

```txt
Unable to Load Expenses

Unable to Generate Forecast

Unable to Load Dashboard
```

Errors must be actionable.

---

# Charts

Purpose:

Visualize trends.

Not decoration.

---

# Approved Charts

```txt
Category Breakdown
Spending Trend
Savings Trend
Cashflow Trend
```

---

# Chart Rules

Prioritize:

```txt
Readability
Comparability
Clarity
```

Avoid:

```txt
3D Charts
Fancy Animations
Visual Gimmicks
```

---

# Navigation Rules

Users should always know:

```txt
Where They Are
```

Active navigation must be obvious.

Use:

```txt
Finance Blue
Active Indicator
```

---

# Responsive Design

Desktop First

Mobile Compatible

The mobile experience must preserve:

```txt
Readability
Data Density
Financial Visibility
```

without sacrificing usability.

---

# Design Anti-Patterns

Avoid:

```txt
Glassmorphism
Neon UI
Overuse of Gradients
Random Colors
Large Empty Spaces
Marketing Style Layouts
Playful Banking Aesthetics
```

Avoid making PesoPilot look like:

```txt
A Startup Landing Page
A Crypto App
A Social Feed
```

---

# Stitch UI Rule

The Stitch-generated screens are considered:

```txt
Reference Implementation
```

New screens should reuse:

```txt
Cards
Tables
Spacing
Typography
Badges
Navigation
```

from existing screens.

Do not redesign existing screens without documented UX reasons.

---

# Component Consistency Rule

If a component already exists:

```txt
Reuse It
```

Do not create visually different versions of:

```txt
Buttons
Cards
Badges
Inputs
Tables
```

unless justified.

---

# Accessibility Rules

Minimum requirements:

```txt
Visible Labels
Readable Contrast
Keyboard Accessibility
Error Visibility
```

Financial data must remain accessible.

---

# UI Success Criteria

A successful PesoPilot UI should feel:

```txt
Professional
Reliable
Fast
Focused
Data-Oriented
```

Users should feel:

```txt
I understand my finances.

I know where my money is going.

I know what I should do next.
```

within seconds of opening the application.

---

# Approval Rule

This document is approved only if it remains aligned with:

* 00-source-of-truth.md
* design.md
* Stitch Generated Screens

If conflicts exist:

```txt
design.md wins
```
