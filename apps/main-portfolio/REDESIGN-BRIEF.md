# Portfolio Redesign Brief

## Goal
Evolve the current VIER.OS portfolio into a polished, overall software-engineering showcase. It must work for recruiters, engineering teams, collaborators, and potential freelance/part-time clients without looking like a freelance agency landing page.

## Keep
- Existing VIER.OS identity: dark cyan/indigo palette, glass surfaces, technical feel.
- Current SEO metadata and verified Search Console setup.
- Current overall positioning: Software Engineer first; backend-heavy, full-stack capable, practical AI/agentic engineering.
- Flagship projects: Hippocampus, PesoPilot, Yomira.
- Existing React + Vite + Tailwind architecture unless a UI change genuinely requires otherwise.

## Redesign Direction
Prefer an evolution, not a total rebrand. Make it feel like a modern engineering portfolio: stronger hierarchy, cleaner typography, better storytelling, less visual noise, more intentional motion, and richer project case studies.

Target flow:
Hero -> Flagship Engineering Work -> Professional Experience -> Engineering Stack -> Engineering Focus -> About -> Contact.

Flagship projects should feel like mini case studies rather than generic cards. Show the problem/product, engineering role, architecture or technical decisions, stack, meaningful implementation highlights, links, and strong screenshots where available.

## Mobile-First Problems Already Identified
- Header navigation is hidden below `lg` with no mobile-menu replacement.
- Hero uses the desktop `text-display-hero` token (80px) even on mobile; a 48px mobile token exists but is not applied.
- Global gutter is 32px at all widths while a 20px mobile-margin token exists.
- Large section spacing is 120px at all widths.
- The hero code visual disappears below `lg`, leaving mobile with no equivalent visual treatment.
- Project cards use desktop-oriented padding/layout and should be reviewed at narrow widths.

## Responsive Acceptance Criteria
Design and verify at approximately 375, 430, 768, 1024, and 1440px widths. No horizontal overflow. Use fluid/responsive typography and spacing. Provide a real mobile navigation pattern. Keep touch targets comfortable. Stack project media/content cleanly on mobile. Preserve readable line lengths. Respect reduced-motion preferences where animation is used.

## Visual Priorities
1. Strong hero that communicates Software Engineer + backend/full-stack/AI without feeling like a sales page.
2. Hippocampus, PesoPilot, and Yomira as the visual center of the portfolio.
3. Professional experience should carry real credibility and not be buried.
4. Tech stack should be grouped and scannable rather than becoming an icon wall.
5. Engineering Focus should communicate capabilities, not services for sale.
6. Contact should stay opportunity-neutral: roles, collaborations, freelance/part-time, and technical conversations.

## Constraints
Do not remove or weaken existing SEO. Avoid unnecessary dependencies or architecture rewrites. Do not invent project metrics or professional achievements. Preserve current content facts unless repo evidence supports an update. Prioritize accessibility, responsive behavior, maintainability, and performance.

## Definition of Done
The redesigned portfolio is visually coherent on desktop and mobile, the flagship projects are significantly stronger, navigation works on mobile, responsive typography/spacing are fixed, there is no horizontal overflow, existing links/SEO still work, and the production build/CI passes.