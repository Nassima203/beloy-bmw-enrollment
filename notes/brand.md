# Brand extraction: BMW (bmw.fr/fr/index.html)

Date: 14/11/2026
Tools: Chrome DevTools (Styles, Computed, CSS Overview), Console (a small script listing the `:root` custom properties and the `.ctx-mode--dark` rules), WebAIM Contrast Checker.

## Method

1. Inspecting `<html>`, I saw that the site exposes its design system as **CSS custom properties** on `:root`, already named by role (`--cta`, `--copy-text`, `--disclaimer`…).
2. I wrote a small Console script to copy all of them (183 variables), then kept only the ones useful for an enrollment flow. Variables tied to their own components (`--compare-*`, `--stage-*`, `--model-spotlight-*`, `--swiper-*`) are ignored.
3. The site has no global dark mode, but it does have **dark sections** (class `.ctx-mode--dark`) that redefine the same variables. I use them as the base for my dark theme.
4. Raw files kept: `notes/bmw-variables.css`, `notes/bmw-dark.css`.

## Colours (light theme)

| Role | BMW variable | Value | Contrast |
|---|---|---|---|
| Headings and text | `--heading`, `--copy-text` | `#262626` | 15.1:1 on white ✅ |
| Secondary text | `--disclaimer` | `#666666` | 5.7:1 on white, 5.3:1 on #f6f6f6 ✅ |
| Main background | `--surface-background-primary` | `#ffffff` | |
| Secondary background (sections, cards) | `--surface-background-secondary` | `#f6f6f6` | |
| Decorative border | `--border` | `#e6e6e6` | decorative only |
| Input border | `--input-border-color` | `#8e8e8e` | 3.3:1 ✅ (3:1 required for UI components) |
| Input border hover | `--input-border-color-hover` | `#4d4d4d` | |
| Primary button | `--cta` | `#1c69d4` | white text on it: 5.2:1 ✅ |
| Primary button hover | `--cta-hover` | `#0653b6` | |
| Primary button disabled | `--cta-disabled` | `#bbd2f3` | see adjustments |
| Secondary button (black) | `--nba` / `--nba-hover` | `#262626` / `#4d4d4d` | white text ✅ |
| Link | `--link` / `--link-hover` | `#262626` / `#1c69d4` | ✅ |
| Information background (selection, callout) | `--information-background` | `#dde8f9` | |
| Error | `--error` / `--error-background` | `#d20000` / `#f7e7e9` | 5.6:1 on white ✅ |
| Success | `--success` / `--success-background` | `#3db014` / `#e8f2eb` | 2.8:1 ❌ as text, see adjustments |
| Warning | `--warning` / `--warning-background` | `#ffad1f` / `#fbedc9` | ❌ as text, icon or background only |
| Keyboard focus | `--focus-visible-color-highlight` | `#1c69d4`, 4px ring + 1px white outline | ✅ |

## Typography

- Site typeface: **BMW Type Next** (`bmwTypeNextWeb`), licensed, not usable.
- Substitute: **Inter** (Google Fonts).
- Why: a plain, technical grotesque close to BMW Type Next; available in the four weights BMW uses (300, 400, 500, 700); has tabular figures (`font-variant-numeric: tabular-nums`), which keep prices aligned and make the payment reference easy to read and copy down; very legible on mobile.
- BMW weights: body text **300** (`--default-font-weight`), inputs **400**, clickable elements and links **500**, prices **700**.
- BMW type scale, measured twice: at mobile width (400px) and on desktop. BMW makes headings slightly larger on wide screens; I reproduce that with `clamp()` between the two values:

| BMW token | Mobile | Desktop | Line height (mobile) |
|---|---|---|---|
| `--headline-1` | 33px (2.0625rem) | 35px (2.1875rem) | 46px |
| `--headline-2` | 28px (1.75rem) | 29px (1.8125rem) | 40px |
| `--headline-3` | 23px (1.4375rem) | 25px (1.5625rem) | 32px |
| `--subsection-1` | 19px (1.1875rem) | 20px (1.25rem) | 28px |
| `--subsection-2` | 17px (1.0625rem) | not measured | 26px |
| `--body-1` | 16px (1rem) | 17px (1.0625rem) | 26px |
| `--body-2` | 14px (0.875rem) | | 22px |
| `--body-3` | 12px (0.75rem) | | 18px |
| `--label-1` | 12px (0.75rem) | | 16px |
| Highlighted price (`--stage-price-tag-price`) | 33px | | 35px |

- Measured on the page: buttons and links at 14px, weight 500.

## Shapes and spacing

- Button height: small 36px (`--button-small-height`), large 52px (`--button-large-height`).
- Grid side margin: 24px (1.5rem).
- Outline button border: 1px, 2px on hover.
- Focus ring: 4px (0.25rem) blue + 1px white.
- Border radius: **3px** (measured on a blue clickable element). Nearly sharp corners, applied to buttons, inputs and cards.
- Padding: the script picked up a small element (4px padding, auto height), not the large button. So I keep BMW's official 52px height (`--button-large-height`) and set 24px horizontal padding, consistent with the BMW grid margin. This is my assumption, recorded as such.
- No uppercase or letter spacing on buttons (`text-transform: none`, `letter-spacing: normal`).

## Look and feel

Restrained, lots of white, very dark grey text rather than pure black, light text weight (300), a single blue reserved for the primary action, nearly sharp corners (3px).

## Logo

BMW's round logo is not allowed. Stand-in: my own typographic wordmark ("BMW" in Inter 700 + "Electric cover" in 300), with no circle, so it does not evoke the roundel.

## Dark theme (invented, based on `.ctx-mode--dark`)

| Role | Value | Source | Contrast |
|---|---|---|---|
| Page background | `#000000` | BMW dark `--navigation-background` | |
| Surface (cards) | `#262626` | BMW dark `--surface-background-primary` | |
| Border | `#4d4d4d` | BMW palette grey | |
| Text | `#ffffff` | dark `--copy-text` | 15.1:1 on #262626 ✅ |
| Secondary text | `#bbbbbb` | BMW palette grey | 7.9:1 on #262626 ✅ |
| Primary button | `#1c69d4`, white text | same blue as light | 5.2:1 ✅ |
| Secondary button | `#ffffff`, text `#262626` | BMW dark `--nba` | ✅ |
| Link | `#ffffff` | BMW dark `--link` | ✅ |
| Error | `#ff6b6b` | adjusted | 5.4:1 on #262626 ✅ |
| Success | `#3db014` | BMW | 5.3:1 on #262626 ✅ |
| Surface alt (sections, callouts) | `#1a1a1a` | invented grey | secondary text #bbbbbb: 9.1:1 ✅ |
| Input border | `#8e8e8e` | BMW `--input-border-color` | 4.6:1 on #262626 ✅ (3:1 required) |
| Primary button hover | `#0653b6`, white text | same as light | 7.2:1 ✅ |
| Primary button text | `#ffffff` | same as light | 5.2:1 on #1c69d4 ✅ |
| Disabled button | `#4d4d4d`, text `#bbbbbb` | BMW palette greys | 4.4:1 (disabled, exempt) |
| Secondary button hover | `#bbbbbb`, text `#262626` | BMW dark `--nba-hover` | 7.9:1 ✅ |
| Link hover | `#bbbbbb` | BMW dark `--link-hover` | 10.9:1 on #000 ✅ |
| Selected background | `#0f2a4d` | invented navy | white text 14.4:1 ✅ |
| Focus ring | `#6ea0ec` + 1px white | AA adjustment 4 | 5.7:1 on #262626 ✅ |
| Error background | `#3a1414` | invented | error text #ff6b6b 5.9:1 ✅ |
| Success background | `#14301a` | invented | success text #3db014 5.1:1 ✅ |
| Warning background | `#3d2e0a` | invented | white text 13.2:1 ✅ |

Why it still reads as BMW: these are the values BMW already uses in its own dark sections, with the same blue for the primary action.

## AA adjustments (house rule 4)

1. **Success text**: `#3db014` gives 2.8:1 on white. In light, success text becomes `#2a7a0e` (5.4:1). The BMW green stays for icons and backgrounds.
2. **Warning**: `#ffad1f` fails as text. Used only as a background or icon, with `#262626` text on it.
3. **Disabled button**: white text on `#bbd2f3` is unreadable. Disabled elements are exempt under WCAG, but I use `#666666` text so the label can still be read.
4. **Accent in dark mode**: blue `#1c69d4` as text or focus ring on `#262626` is only 2.9:1. In dark, links become white (as BMW does) and the focus ring becomes light blue `#6ea0ec` (5.7:1) with a white outline.
5. **Error in dark mode**: `#d20000` is 2.7:1 on `#262626`, changed to `#ff6b6b`.
