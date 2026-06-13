# PesoPilot UI Authority v2

## Purpose

This document defines the official visual authority for PesoPilot.

Business logic, architecture, database design, and application behavior remain governed by:

* PesoPilot-v1.0-Source-of-Truth.md
* PesoPilot-v1.0-Domain-Model-and-Database.md
* PesoPilot-v1.0-Frontend-Architecture.md
* PesoPilot-v1.0-Backend-Architecture.md
* PesoPilot-v1.0-AI-Architecture.md
* PesoPilot-v1.0-Coding-Standards.md

Visual implementation is governed by:

* pesopilot-design-v2.md
* Stitch Design System v2 exports
* This document

---

# Visual Authority Order

## Level 1 — Design Tokens

Source:

pesopilot-design-v2.md

Authority:

* Colors
* Typography
* Spacing
* Radius
* Elevation
* Component styling
* Brand identity

These tokens must not be replaced unless explicitly approved.

---

## Level 2 — Stitch Design Exports

Source:

docs/design-v2/

Contains:

* Dashboard
* Expenses
* Income
* Savings
* Salary Cutoffs
* Cashflow
* Settings

Authority:

* Layout
* Visual hierarchy
* Component placement
* Card styling
* Table styling
* Sidebar styling
* Empty states
* Financial SaaS presentation

When implementing UI, developers should visually match these exports as closely as practical.

---

## Level 3 — Existing Component Architecture

All UI implementations must be built using the existing component architecture.

Dashboard Components:

* PageHeader
* KpiGrid
* StatCard
* MetricCard
* SectionCard
* StatusBadge
* WarningCard
* InsightCard

Core Components:

* Button
* Input
* Card
* Badge
* Modal
* DataGrid
* LoadingState
* EmptyState
* ErrorState

Developers may extend component styling.

Developers should not replace the component system unless approved.

---

# Design Principles

PesoPilot is:

* A Financial Operating System
* A Decision Support Tool
* A Privacy-First Finance Workspace

PesoPilot is NOT:

* A Banking App
* A Mobile Wallet
* A Budget Toy
* A Gamified Finance App

The visual style should communicate:

* Algorithmic Trust
* Clarity
* Precision
* Professionalism
* Control

---

# Approved Future-Only Design Elements

The Stitch exports contain concepts that are approved visually but are not yet implemented functionally.

Examples:

* Financial Health Score
* AI Coach
* AI Financial Insights
* Budget Shock Predictions
* Income Stability
* Velocity Analysis
* Savings Goals
* Forecasting Widgets
* Reports

These may appear in designs.

They must not be implemented until their corresponding roadmap phases exist.

Design approval does not imply feature approval.

---

# UI Refactoring Rule

When redesigning existing pages:

1. Preserve business behavior.
2. Preserve architecture.
3. Preserve repositories and services.
4. Apply visual styling from Stitch exports.
5. Reuse existing component library.
6. Prefer extending components over creating new ones.

Visual redesign must never introduce business logic changes.

---

# Current Approved Screens

Approved Design System v2 Screens:

* Dashboard
* Expenses
* Income
* Savings
* Salary Cutoffs
* Cashflow
* Settings

These screens are now the primary visual reference for all future UI implementation work.
