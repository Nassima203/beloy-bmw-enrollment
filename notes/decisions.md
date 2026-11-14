# Decisions

## Design tokens (css/tokens.css)

### AA adjustments to BMW colours (house rule 4)

| # | Where | BMW value | Problem | New value | Result |
|---|---|---|---|---|---|
| 1 | Success text, light | `#3db014` | 2.8:1 on white | `#2a7a0e` | 5.4:1 on white, 4.7:1 on `#e8f2eb`. BMW green kept for icons (`--color-success-icon`) |
| 2 | Warning, both themes | `#ffad1f` | fails as text | not used as text | only `--color-warning-bg` / `--color-warning-icon`, with normal text on top |
| 3 | Disabled primary button | white on `#bbd2f3` | unreadable | text `#666666` | 3.7:1 (disabled controls are exempt, but the label stays readable) |
| 4 | Accent in dark | `#1c69d4` | 2.9:1 on `#262626` | links white, focus ring `#6ea0ec` + 1px white | 5.7:1 on `#262626` |
| 5 | Error in dark | `#d20000` | 2.7:1 on `#262626` | `#ff6b6b` | 5.5:1 on `#262626`, 7.6:1 on black |

Extra: the selected-card border uses `--color-selected-border`: BMW blue in light, `#6ea0ec` in dark, because BMW blue is only 2.9:1 on the dark surface (3:1 is required for UI parts).

### Invented dark-theme values

bmw.fr has no dark theme, only dark sections. The roles those sections don't cover were chosen and contrast-checked (also listed in brand.md, "Dark theme"):
surface-alt `#1a1a1a`, selected bg `#0f2a4d`, error bg `#3a1414`, success bg `#14301a`, warning bg `#3d2e0a`, disabled button `#4d4d4d` / `#bbbbbb`.

### Fluid type range

Headings and body-1 scale with `clamp()` between a 400px viewport (BMW mobile measurement) and 1280px (assumed desktop width; the desktop measurement width wasn't recorded). Sizes measured only on mobile stay fixed.

### Dark theme selectors

The dark values are written twice: under `:root[data-theme="dark"]` (manual toggle) and under `@media (prefers-color-scheme: dark)` on `:root:not([data-theme="light"])` (OS setting). Plain CSS can't share one block between the two selectors, so both copies must be edited together.
