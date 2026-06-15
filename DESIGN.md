---
name: PinGo
description: Collaborative travel management app — plan, share, and remember every trip together.
colors:
  primary: "#0046de"
  primary-light: "#3375ff"
  primary-deep: "#0037b0"
  bg-base: "#eef2f8"
  bg-base-dark: "#0a1628"
  surface: "#ffffff"
  surface-dark: "#172d48"
  surface-raised: "#f8fafc"
  surface-raised-dark: "#274060"
  surface-muted-dark: "#38506e"
  ink-primary: "#0d1a2e"
  ink-primary-dark: "#f8fafc"
  ink-secondary: "#64748b"
  ink-secondary-dark: "#94a3b8"
  ink-quiet: "#94a3b8"
  border: "#dce3ef"
  border-dark: "#274060"
  success: "#22c55e"
  warning: "#f59e0b"
  error: "#ef233c"
  category-city: "#0EA5E9"
  category-transport: "#3B82F6"
  category-restaurant: "#F97316"
  category-activity: "#22C55E"
  category-accommodation: "#8B5CF6"
  category-entertainment: "#EC4899"
  category-other: "#94A3B8"
typography:
  display:
    fontFamily: "PlusJakartaSans_700Bold, -apple-system, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.5px"
  headline:
    fontFamily: "PlusJakartaSans_700Bold, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "PlusJakartaSans_600SemiBold, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "PlusJakartaSans_400Regular, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  callout:
    fontFamily: "PlusJakartaSans_400Regular, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "PlusJakartaSans_500Medium, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.3
  caption:
    fontFamily: "PlusJakartaSans_600SemiBold, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.2px"
rounded:
  icon: "12px"
  input: "10px"
  card: "16px"
  sheet: "28px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "10px 20px"
  button-primary-active:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.card}"
    padding: "10px 20px"
  button-destructive:
    backgroundColor: "{colors.error}"
    textColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "10px 20px"
  button-pill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
  chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  chip-inactive:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
  input:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.input}"
    padding: "11px 16px"
  input-focused:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.input}"
    padding: "11px 16px"
---

# Design System: PinGo

## 1. Overview

**Creative North Star: "The Trusted Companion"**

PinGo earns trust by being ruthlessly clean and reliable — the travel app that feels like it was made by Apple for people who actually travel. Every screen is iOS-native in its bones: large-title navigation, physical scroll physics, predictable gestures, a color vocabulary that communicates state rather than personality. The interface disappears into the task.

The visual anchor is a deep navy dark mode and a cool-gray light mode, both organized around a single confident blue. Color earns its place — the primary blue appears on primary actions, active selections, and meaningful states. Category icons add a controlled semantic burst (each activity type has its own hue), but their role is classification, not decoration. The palette is restrained because trust is built through consistency, not novelty.

This system rejects three things by name: the generic startup aesthetic (gradient cards, blob illustrations, neon accents); the austere all-gray tool with no brand (all neutral-400, could be any sector); and the aggressive dark mode (pure OLED black, full-brightness white, no surface hierarchy). Between those three anti-references lives the system's operating space.

**Key Characteristics:**
- Single typeface (Plus Jakarta Sans) carrying all roles via weight contrast alone
- Deep navy dark mode (surface-900 = #0a1628) — never OLED black
- Subtle ambient shadows as depth cues, not decorative weight
- Press feedback on every interactive element: scale 0.97, 120ms EASE\_OUT
- iOS large-title navigation with scroll-driven compact title transition
- Swipeable list cards with revealed action buttons (gesture-native, not button-overflow)
- Consistent border-radius vocabulary: icon=12px, input=10px, card=16px, sheet=28px

## 2. Colors: The Confident Crew

One primary blue, deep navy surfaces, cool-gray neutrals. Color communicates role and state — never mood, never decoration.

### Primary
- **Confident Blue** (#0046de): All primary CTAs, FAB buttons, active tab/chip indicators, selected states, text links. The single loud color in the system — used on ≤15% of any given screen. Its restraint is what makes it trustworthy.
- **Sky Tint** (#3375ff): Hover/pressed state of primary-filled elements; primary icon color in dark mode where full primary reads as too saturated.
- **Deep Blue** (#0037b0): Active/held state of primary surfaces. Also the color of pressed primary buttons.

### Neutral
Two surface ramps (light and dark) that never touch:

**Light mode surfaces:**
- **Cool Base** (#eef2f8): Page background. Slightly cooler than pure white; never beige, cream, or warm-tinted. The warmth in this system lives in the brand, not the background.
- **White Surface** (#ffffff): Card and sheet backgrounds. Maximum clarity for content.
- **Whisper** (#f8fafc): Raised elements on light bg (secondary surfaces, hover state bg).
- **Subtle Border** (#dce3ef): Dividers, input outlines at rest, card separators.

**Dark mode surfaces:**
- **Page Void** (#0a1628): Dark mode page background. Not black — deep ink-navy with intentional presence. This is the floor; nothing goes darker.
- **Card Slate** (#172d48): Dark mode card and sheet backgrounds. Clearly distinct from the page.
- **Input Navy** (#274060): Dark mode input fields and raised interactive surfaces.
- **Muted Navy** (#38506e): Dark mode borders, dividers, inactive icons.

**Text:**
- **Ink** (#0d1a2e): Primary text, light mode.
- **Snow** (#f8fafc): Primary text, dark mode.
- **Paragraph** (#64748b): Secondary body text, metadata, supporting copy.
- **Quiet** (#94a3b8): Placeholder text, tertiary metadata, supplementary icons.

### Semantic Status
- **Success Green** (#22c55e): Completed states, "Visitado" badges, positive feedback.
- **Amber Warning** (#f59e0b): Budget alerts, caution indicators.
- **Signal Red** (#ef233c): Destructive actions, validation errors, delete confirmations.

### Semantic Category Palette
Each experience and wishlist item type has a dedicated icon color + background tint pair. These colors are semantic identifiers, not decorative accents.

| Type | Icon Color | Light Bg | Dark Bg |
|------|-----------|---------|--------|
| City | #0EA5E9 | #E0F2FE | #06304E |
| Transport | #3B82F6 | #DBEAFE | #061E4E |
| Restaurant | #F97316 | #FFEDD5 | #4E1E06 |
| Activity | #22C55E | #DCFCE7 | #064E3B |
| Accommodation | #8B5CF6 | #EDE9FE | #24064E |
| Entertainment | #EC4899 | #FCE7F3 | #4E062A |
| Other | #94A3B8 | #F1F5F9 | #334155 |

**The One Voice Rule.** Primary blue (#0046de) appears on primary actions, active states, and links — never as decoration, never on inactive elements, never as a background tint on inactive cards. Its scarcity is the point.

**The Deep Night Rule.** Dark mode is built on surface-900 (#0a1628). No surface, background, or modal may use a darker value. Pure black (#000) is forbidden — the navy depth is the brand identity.

**The Category Contract Rule.** Category colors are a closed vocabulary. When a new experience type is added to the data model, it gets exactly one icon color and one bg-tint pair, light and dark. No ad-hoc colors outside this table.

## 3. Typography: Single Family, All Roles

**System Font:** Plus Jakarta Sans (Google Fonts, loaded via `@expo-google-fonts/plus-jakarta-sans`)
**Fallback:** -apple-system, BlinkMacSystemFont, sans-serif

**Character:** Geometric-humanist hybrid. Clean enough for data labels, warm enough for personal moments. Works from 11px caption badges to 34px display titles without personality drift. Weight contrast (Regular 400 → Bold 700) is the entire scale mechanism.

### Hierarchy (iOS HIG–aligned)

- **Display** (700 Bold, 34px, line-height 1.15, tracking −0.5px): iOS Large Title. Section headings on main tab screens ("Mis deseos", "Mi perfil"). Scrolls up and collapses; never used for static subheadings.
- **Headline** (700 Bold, 20px, line-height 1.3): Bottom sheet titles, modal headings, detail screen section headers.
- **Title** (600 SemiBold, 17px, line-height 1.35): Navigation bar compact title (fades in on scroll), card primary title, list item primary text.
- **Body** (400 Regular, 17px, line-height 1.45): iOS Body — form field descriptions, detail screen prose, secondary explanatory text.
- **Callout** (400–500, 15px, line-height 1.4): Card secondary info, filter pill labels, metadata rows, button small text.
- **Label** (500 Medium, 13px, line-height 1.3): Form field labels above inputs, input annotations, supplementary UI text.
- **Caption** (600 SemiBold, 11px, line-height 1.25, tracking +0.2px): Badges, status chips ("Visitado"), swipe-action button labels, category counts.

**The Single Font Rule.** Plus Jakarta Sans is the only typeface in this system. No secondary display font, no mono variant for labels or code, no "expressive" pairing. Weight carries hierarchy; family is fixed. A future agent that introduces a second family is violating this system.

**The Scale Floor Rule.** 11px (Caption) is the minimum. Nothing below this size appears in production UI. Anything needing smaller type should be reconsidered at the information architecture level.

## 4. Elevation: Flat by Default, Lifted on Action

Surfaces are flat at rest. Shadows appear only to separate floating or interactive elements from the page — cards above page background, FAB above content, sheets above backdrop. They are ambient depth cues, not decorative weight.

Two rules govern the shadow vocabulary:

- **Primary-element shadows are hue-matched.** FAB and CTA buttons use a shadow with the primary blue as the shadow color (30–35% opacity). This makes the element feel lit from the same source as the brand.
- **Content shadows are colorless.** Card shadows use near-black at very low opacity (6%). Their only job is to signal interactivity; they have no expressive weight.

On Android, the card shadow is replaced by a hairline border (1px solid rgba(0,0,0,0.10)) due to unreliable RN shadow rendering on the platform.

### Shadow Vocabulary

- **Card Ambient** (`shadowColor: #000, offset: 0 2, opacity: 6%, radius: 8px`): Applied to all swipeable list cards and the base Card component. Barely visible at rest; signals "this is tappable" without lifting the card off the page.
- **FAB Active** (`shadowColor: #0046de, offset: 0 4, opacity: 30%, radius: 12px`): The Floating Action Button. Hue-matched to primary; creates a glow under the primary call-to-action.
- **CTA Active** (`shadowColor: #0046de, offset: 0 6, opacity: 35%, radius: 14px`): Hero call-to-action buttons (e.g., the primary sheet submit button). Stronger than FAB — reserved for the highest-priority action on a screen.

**The Flat-By-Default Rule.** Surfaces are flat unless they float. No decorative shadows on headers, tab bars, text elements, or static dividers. The shadow vocabulary has exactly three named entries and no others.

**The No Ghost Card Rule.** A 1px border plus a soft wide drop shadow (blur ≥ 16px) on the same element is the "ghost card" pattern — banned. Choose one: a defined shadow (≤ 8px blur) or a border. Never both as decoration.

## 5. Components

### Buttons

Shape is role-dependent: pill for small standalone actions, rounded rectangle (16px) for medium and large.

- **Primary (md)**: bg-primary-500, white text, 16px radius, 10px/20px padding, 17px semibold. Scale 0.97 on press, 120ms EASE\_OUT.
- **Primary (lg)**: same radius and color, 14px vertical padding. For full-width form submits.
- **Primary (sm / pill)**: rounded-full, 15px medium, 8px/16px padding. Inline actions and secondary CTAs.
- **Ghost**: 1px border (neutral-300 / neutral-600 dark), transparent bg, neutral text. Secondary actions that should not compete visually.
- **Outline**: 2px primary-500 border, white/surface-900 bg, primary-500 text. Affirmative secondary actions.
- **Destructive**: error (#ef233c) fill, white text, same radius as primary. Reserved for irreversible actions (delete, leave trip).
- **Disabled / Loading**: 50% opacity on the container. ActivityIndicator replaces text label during loading — same color as text.

Press feedback is universal: all variants scale to 0.97, 120ms EASE\_OUT on press-in; return to 1.0 on press-out.

### Filter Chips (FilterPill)

Horizontal scroll row, no scrollbar. Active: primary-500 fill, white semibold text. Inactive: white/surface-800 fill, neutral-600 regular text. Both rounded-full, 13px, 6px/14px padding. Press: scale 0.95, 120ms EASE\_OUT.

### Cards (Swipeable List Item)

The signature content pattern of PinGo. Rounded rectangle (16px), white/surface-800, Card Ambient shadow.

Internal structure: 44×44pt type icon badge (category bg-tint, rounded-xl=12px) + title (17px/600) + subtitle (location, 13–14px/400) + optional footer row separated by 1px hairline (neutral-100/surface-700). Footer carries time range, confirmation code, note excerpt, and status badge.

Swipe gesture reveals action buttons from the right: edit in primary-500, delete in error (#ef233c). The card body translates left; action buttons are revealed behind it. Each action is 72–76px wide. Snap velocity threshold: 700pt/s → momentum decay; slower → snap closed, 240ms EASE\_OUT.

Press feedback: scale 0.97 on press-in (120ms EASE\_OUT). The swipeable structure clips the scale animation to the card bounds.

### Inputs

Filled style, no visible stroke at rest. Container: rounded-[10px], neutral-100/surface-700 background, transparent 1px border (invisible but avoids layout shift on focus).

States:
- **Rest**: transparent border, neutral-100/surface-700 bg.
- **Focused**: primary-500/30 border (light) / primary-400/30 (dark). Background unchanged. The focus ring is the WCAG 2.4.7 indicator.
- **Error**: error-500 border, red-50/red-900 bg. Error message in error color below the field.
- **Disabled**: 50% opacity (inherited from parent or explicit prop).

Text: 17px/400, ink-primary. Label: 13px/500 above the field. Placeholder: neutral-400. Left icon when provided: neutral-400, 18px, 12px leading padding.

### Bottom Sheets

Rounded top corners (28px), white/surface-800 background. Drag handle: 36×5pt pill (neutral-300/surface-600 dark), centered, 12px top padding.

Title: 20px/600, left-aligned. Close button: "Cerrar" in primary-500/primary-300 text, 17px, right-aligned. Title + close row has 20px bottom margin.

Max height: 90% of screen height. Backdrop: rgba(0,0,0,0.4).

Animation: open 320ms EASE\_DRAWER (cubic-bezier(0.32, 0.72, 0, 1)); close/dismiss 240ms EASE\_DRAWER\_OUT (cubic-bezier(0.32, 0, 0.67, 0)); snap-back from partial drag 320ms EASE\_DRAWER. No withSpring; no bounce.

Scrollable variant uses `KeyboardAwareScrollView` from `react-native-keyboard-controller`. Never `KeyboardAvoidingView`.

### App Header (iOS Large Title)

Page background bleeds behind the header — no distinct header background or shadow. Two-state layout:

**Expanded** (scroll position ≤ 44pt): "PinG" wordmark (32px/700, tracking −0.5px) + logo image, left-aligned. Right: action icon buttons (32×32pt circular, neutral-200/surface-700 bg) + Avatar (44×44pt tap target).

**Compact** (scroll position > 52pt): Screen title (17px/600, centered, white or ink) fades in; action buttons fade in above 110pt. The large title in the scroll content simultaneously fades out (interpolated 0→44pt range).

### FAB (Floating Action Button)

56×56pt circle (rounded-full), primary-500 background, FAB Active shadow. Plus icon: 28px, white. Positioned `bottom: 16pt, right: 20pt`, above content.

On scroll down: translates 88pt down + fades out (fabAnimStyle driven by scrollY). On scroll up or at rest: returns to position. Animation: withTiming, EASE\_OUT, 280ms.

### FAB Pill

Horizontal variant of the FAB for screens where the primary "+" action already lives in the header (freeing the bottom-right slot for navigation). 56pt-tall capsule (rounded-full), primary-500 background, FAB Active shadow — same position, scroll behavior and animation as the circular FAB. Contains a 20px white icon + label (15px/600, white) naming the destination (e.g. "Ver mapa"). Reserved for the single most prominent navigation shortcut on the screen — never combine with a circular FAB.

### Category Icon Badge

Used in ExperienceCard and WishlistCard. Fixed 44×44pt container, rounded-xl (12px), category bg-tint background. Icon: category icon color, 22px Ionicons glyph. Never mixed — each experience/wishlist type uses exactly one color pair (light and dark variant).

### Segmented Tab Bar

Full-width two-option tab control. Used for major mode switches ("Pendientes / Visitados"). Not the tab bar navigation — this is an in-content control.

### Stagger Enter Animation

Lists use a staggered opacity + translateY entrance: delay of `index × 55ms`, duration 280ms, EASE\_OUT. Index 0 enters immediately; subsequent items cascade. Applies on initial list render only (not on scroll or re-filter).

## 6. Do's and Don'ts

### Do:
- **Do** use surface-900 (#0a1628) as dark mode page background. Nothing darker — this is the floor.
- **Do** scale every interactive element to 0.97 on press-in, 120ms EASE\_OUT. No exceptions: buttons, cards, chips, FAB.
- **Do** use withTiming for all Reanimated animations. The easing constants in `animations.ts` (EASE\_OUT, EASE\_DRAWER, EASE\_DRAWER\_OUT) cover all standard cases.
- **Do** use Plus Jakarta Sans exclusively. Weight contrast (400→700) carries the entire type hierarchy.
- **Do** give FAB and primary CTAs a hue-matched shadow (primary blue, 30–35% opacity). This is the one permitted expressive shadow; everything else is colorless ambient.
- **Do** use the category color table for all activity/wishlist type icons. It is a semantic system — adding a new type means extending the table, not picking a free color.
- **Do** specify both light and dark values for every new component or surface. Dual-mode parity is non-negotiable; dark mode is not an afterthought.
- **Do** keep touch targets ≥ 44×44pt per iOS HIG. The Avatar has 44×44pt hitSlop even though it renders smaller.
- **Do** use Skeleton for loading states in lists and data screens — not spinners centered in content.

### Don't:
- **Don't** use #000000 or any near-black (below #0a1628 in lightness) for any dark mode surface. The deep navy is the brand identity. Pure OLED black is the named anti-reference.
- **Don't** use withSpring for any UI animation. The project forbids bounce/spring curves; use withTiming with EASE\_DRAWER for snapping gestures.
- **Don't** use gradients on card backgrounds, headers, or UI text. `background-clip: text` with a gradient is banned outright.
- **Don't** add blob illustrations, hand-drawn SVG sketches, or travel-poster imagery. The system's personality comes from craft and precision, not thematic decoration.
- **Don't** build the generic startup aesthetic: purple/pink gradients, glassmorphism card stacks, oversized drop shadows (blur ≥ 20px), neon accents. These are named anti-references in PRODUCT.md.
- **Don't** use a `border-left` (or `border-right`) stripe ≥ 2px as a colored accent on cards, callouts, or list items. This is the "side-stripe border" anti-pattern — use bg-tint or leading icons instead.
- **Don't** pair a 1px border + a wide drop shadow (blur ≥ 16px) on the same element. The ghost card pattern is banned.
- **Don't** exceed 16px border-radius on cards or content containers. The card cap is rounded-2xl (16px). The sheet's 28px top-corners are a permitted exception because a sheet slides up from below and needs the stronger softening.
- **Don't** put the primary blue on inactive states, empty backgrounds, or decorative elements. Active/selected/CTA only.
- **Don't** use KeyboardAvoidingView. Use KeyboardAwareScrollView from react-native-keyboard-controller.
- **Don't** use the warm neutral band (beige, cream, sand, off-white with warm tint) for any background. The bg-base is cool-gray (#eef2f8). Warmth in this system is carried by accent color, not background temperature.
