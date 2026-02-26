# FE-001: Framework Choice

**Status**: Accepted
**Date**: 2026-02-26
**Updated**: 2026-02-26

## Problem

The current CLMS landing page is a single HTML file (`index.html`). To build app features (onboarding, dashboard, etc.), a component-based framework is needed. The landing page also requires SEO for organic search traffic (e.g. "chambers library management").

## Solution

**React + Next.js.**

- Next.js for SSR/SSG on the landing page (SEO) and SPA behavior for the app
- Landing page routes use static generation for fast load + SEO
- App routes (behind auth) use client-side rendering
- Migrate the existing landing page into the framework

## Alternatives Considered

- **React + Vite (SPA only)**: Initially chosen, but revised. SPA cannot be indexed properly by search engines. The landing page is the primary acquisition channel and needs SEO.
- **Separate landing (static HTML) + Vite app**: Two codebases to maintain. Component sharing becomes painful.
- **Plain HTML**: No scalability for app features.

## Consequences

- The existing `index.html` landing page must be converted to Next.js pages/components
- Landing page uses SSG (`generateStaticParams` / static export) for SEO
- App routes (`/app/*`, `/onboarding/*`) remain client-rendered SPA
- Current stack (Tailwind CSS, Iconify, fonts) is preserved and integrated
- Deployment: Vercel (already has `.vercel/` config) is a natural fit for Next.js
