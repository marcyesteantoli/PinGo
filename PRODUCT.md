# Product

## Register

product

## Users

Mixed profiles sharing the same app: friend groups aged 20–35 on leisure trips and couples/families on longer planned trips. Both are mobile-native and expect iOS-quality visual polish. Context: planning ahead on the couch and using actively mid-trip (on the go, bright ambient light, one hand). Any given screen may serve either profile — design for the demanding end.

## Product Purpose

TripSync is a collaborative mobile app for managing trips end-to-end: shared itinerary (Timeline), centralized documents (offline-first), shared expenses with settlement, a collective photo diary, and a personal wishlist. The job to be done is reducing coordination overhead for groups — one place instead of shared notes, separate spreadsheets, and scattered chats. Success = a group completes a trip and TripSync held everything together.

## Brand Personality

Elegant · Modern · Minimal

Voice is calm and direct, never cheerful-corporate. Copy earns its place. No motivational filler. When in doubt, say less.

## References

- **Apple Maps / Podcasts**: iOS native purity — materials, translucencies, large-title navigation, SF symbol–class icons, scroll physics that feel physical. The app should be indistinguishable from a first-party iOS app at first glance.
- **Splitwise / Tricount**: Utility-first information design — data surfaces cleanly, hierarchy is clear, nothing decorative competes with the numbers. Functional screens have no ornamental weight.

## Anti-references

- **Generic startup aesthetic**: purple/pink gradients, blob illustrations, oversized drop shadows, glassmorphic card stacks. Any UI that could pass for a SaaS landing page is wrong here.
- **Austere / sector-neutral**: a fully gray UI with no accent color and no distinct personality. TripSync should feel designed, not assembled.
- **Aggressive dark mode**: pure OLED black (#000) with full-brightness white text. Dark mode is a deep-navy system (surface-900 = #0a1628) with careful hierarchy — not a contrast-maxed terminal aesthetic.

## Design Principles

1. **iOS native fluency** — every transition, gesture, and layout should feel first-party. No web-ported patterns, no Android affordances. Use iOS system behaviors as the baseline, then refine.
2. **Restraint as craft** — whitespace, weight contrast, and scale carry hierarchy. Color is an accent, not wallpaper. A screen that works in monochrome is a screen with good bones.
3. **Data first** — functional modules (expenses, documents, timeline) surface information cleanly. Visual polish emerges from structure; it never papers over structural problems.
4. **Dual-mode parity** — light and dark themes are equal citizens. Dark mode is deep navy, not OLED black. Every surface, text, and icon color is specified for both.
5. **Travel as context, not costume** — the app lives in the travel domain but does not dress up as a travel poster. Personality comes from precision and craft, not themed illustration or wanderlust imagery.

## Accessibility & Inclusion

- WCAG AA minimum: body text ≥ 4.5:1 contrast against its background; large text (≥ 18px or bold ≥ 14px) ≥ 3:1
- Reduced motion: every Reanimated animation must degrade gracefully (crossfade or instant) when the system reduces motion preference is active
- Touch targets ≥ 44×44pt per iOS HIG
- Placeholder text contrast must meet the same 4.5:1 threshold as body text (common failure point)
- Color is never the sole information carrier for status or category
