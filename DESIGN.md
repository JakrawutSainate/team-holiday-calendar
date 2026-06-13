# Design System

## Visual Theme
HolidayHQ features a clean, high-contrast, off-white workspace theme based on Slate/Zinc scales, prioritizing visual hierarchy and readability over generic AI card structures.

## Color Palette
Using CSS custom variables in tailwind/globals setup:
- **Background**: `#f8fafc` (Soft slate tint, light and calm)
- **Foreground**: `#0f172a` (Deep slate, high legibility)
- **Surface**: `#ffffff` (Pure white for active workspace containers)
- **Primary**: `#0f172a`
- **Secondary / Slate**: `#475569`
- **Outline / Border**: `#e2e8f0` (Light crisp dividers)
- **Error / Warn**: `#ef4444`

## Typography
- **Font Stack**: `"Geist", "Inter", sans-serif`
- **Scale**:
  - Main headings: `text-4xl font-bold tracking-tight`
  - Subheadings: `text-lg text-secondary`
  - Table headers: `font-medium text-xs text-secondary`
  - Buttons / Controls: `font-semibold text-sm`

## Layout & Rhythm
- **Navigation Sidebar**: Fixed width `64` (left-aligned) for main navigation.
- **Main Section Spacing**: Varied rhythm using `space-y-12` or `gap-8` to separate major content groups.
- **No side-stripe borders**: Custom panels use uniform, crisp `border-outline-variant` boundaries without artificial left/right highlight colors.
- **No uppercase eyebrows**: Section labels use readable sentence case with weight emphasis rather than tracked all-caps lines.
