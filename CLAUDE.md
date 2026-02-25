# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 15 ERD Builder application. Users upload CSV/Excel files, relationships are auto-inferred from column names, and everything is editable via a sidebar. Styled in a neo-industrial "Brass Hands" aesthetic.

## Tech Stack
- **Next.js 15** (App Router, TypeScript, Tailwind CSS v4)
- **papaparse** for CSV parsing, **xlsx** (SheetJS) for Excel
- **useReducer** for all state management (no external state library)
- **pnpm** as package manager

## Build & Dev Commands
- `pnpm dev` — start development server
- `pnpm build` — production build
- `pnpm lint` — run ESLint

## Architecture

```
src/
  app/
    layout.tsx          — Google Fonts (Space Grotesk, Space Mono, Inter), metadata
    page.tsx            — 'use client', renders <ERDBuilder />
    globals.css         — Tailwind v4 directives + neo-industrial base styles
  types/
    erd.ts              — Column, Table, Relationship, ERDState, ERDAction types
  lib/
    constants.ts        — Colors, geometry (TABLE_W=260, ROW_H=24, HEADER_H=56), grid layout
    geometry.ts         — getTableHeight, getFieldY, getConnectorPath (cubic Bezier), getFieldSuffix
    erd-reducer.ts      — useReducer with 18+ action types for all mutations
    parse-file.ts       — CSV/Excel parsing, PK detection, auto-grid positioning
    infer-relationships.ts — 4-strategy relationship inference with dedup
    export-svg.ts       — SVG serialization + download
  components/
    ERDBuilder.tsx      — Top-level orchestrator (useReducer, layout, keyboard shortcuts)
    Header.tsx          — Sticky header with title + dynamic stats
    Toolbar.tsx         — ADD TABLE, UPLOAD MORE, EXPORT SVG, RESET buttons
    UploadPanel.tsx     — Drop zone shown when no tables loaded
    Canvas.tsx          — SVG wrapper with drag handling + viewBox calculation
    SVGDefs.tsx         — Arrow markers, glow filter definitions
    GridPattern.tsx     — Dot grid background pattern
    TableNode.tsx       — SVG table card with header, accent bar, field rows
    FieldRow.tsx        — Single column row in table (PK/FK badges, type label)
    RelationshipLine.tsx — Bezier curve connector with cardinality label
    JoinHighlight.tsx   — Cross-table field match lines on hover
    Sidebar.tsx         — Right sidebar container (320px, 4px border-left)
    TableEditor.tsx     — Edit table name, subtitle, color; add/delete columns
    RelationshipEditor.tsx — Edit from/to/cardinality; delete relationships
    AddTableModal.tsx   — Modal form for manual table creation
    StatsFooter.tsx     — Bottom bar with interaction hints
```

## Data Model
- **Column**: id, name, type, isPrimaryKey, isForeignKey
- **Table**: id, name, subtitle, color, x, y, columns[]
- **Relationship**: id, fromTableId, fromColumnId, toTableId, toColumnId, cardinality, inferred
- **ERDState**: tables map, relationships[], selection/hover/drag state, sidebar mode

## Design System (Neo-Industrial / Brass Hands)
- **Palette**: `#242424` bg, `#ff7235` accent, `#adb3b7` muted/border, `#1a1a1a` canvas
- **Typography**: Space Grotesk (display), Space Mono (mono labels/nav), Inter (body)
- **Principles**: Zero border-radius, no shadows/gradients, 4px solid `#adb3b7` dividers, monospace labels

## Relationship Inference (4 strategies)
1. `_id` suffix match (0.95 confidence)
2. Exact column name match (0.85)
3. Legacy prefix-suffix / AS400 style (0.7)
4. CamelCase Id match (0.6)

## Key Interactions
- **Drag tables** on canvas to reposition
- **Double-click table** → sidebar opens with TableEditor
- **Click relationship line** → sidebar opens with RelationshipEditor
- **Hover fields** → cross-table join highlight lines appear
- **Escape** closes sidebar/modals

## Conventions
- All IDs generated with `crypto.randomUUID()`
- Inline styles for SVG elements, Tailwind for layout containers
- File-per-table convention for uploads (one CSV/sheet = one table)
