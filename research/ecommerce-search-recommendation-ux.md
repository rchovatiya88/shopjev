# Ecommerce Search, Product Listing, and Recommendation UX Research

Research date: 2026-09-26
Scope: a search box that leads to a product listing page (PLP), with an optional JEV recommendation experience shown in a popup and/or carousel. Product images remain remote URL references.

## Executive recommendation

Use the product listing page as the primary experience. Let the shopper submit a natural-language query, show the interpreted intent as removable chips, and expose ordinary filters and sorting alongside the results. Make JEV recommendations an explicit, user-triggered action such as **Get a room plan** or **Help me choose**. Open a focused dialog containing a short, evidence-labeled set of recommendations. Keep the same recommendation cards available in an inline carousel on the PLP so users who do not want an interruption can continue browsing.

Do not auto-open a recommendation popup merely because a search was submitted. Material Design describes dialogs as interruptive and says to use them sparingly; W3C requires modal focus containment and an escape path. A user-initiated “Help me choose” action gives the dialog a clear purpose and a reliable return point.

## Findings and design implications

### 1. Search input and query interpretation

* WAI-ARIA’s combobox pattern defines a search field with a popup of suggestions. The popup is collapsed by default, can show suggestions as the user types, and supports Down Arrow, Escape, and Enter interactions. Use a real labelled `input type="search"` or an ARIA-compliant combobox; do not make suggestion rows independently tabbable. Source: [WAI-ARIA Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).
* Apple’s Human Interface Guidelines recommend one clearly identified search location, a clear current scope, suggestions or completions, and a way to narrow results. Apple also recommends prioritizing the most relevant results first and categorizing results when that helps people find items. Source: [Apple HIG: Searching](https://developer.apple.com/design/human-interface-guidelines/searching).
* Baymard’s search research says product-type and feature terms should become visible refinements when the catalog has matching attributes. For this product, JEV can turn “mid-century modern bedroom” into a visible intent summary such as `Room: Bedroom`, `Style: Mid-century modern`, and suggested needs such as `Lighting` or `Nightstands`. The shopper must be able to remove or edit each interpretation. Source: [Baymard: Ecommerce Search Query Types](https://baymard.com/research-articles/ecommerce-search-query-types).

**UI implication:** after submit, show the original query, a plain-language “Interpreted as” row, and removable chips. Label JEV’s interpretation as a suggestion, not as a hidden change to the query. Keep exact SKU and product-name searches deterministic.

### 2. Product listing page structure

* Baymard’s product-list research finds that filtering, sorting, and list presentation work together: the user needs tools to narrow a large set, order it, and scan enough information to evaluate products. Their benchmark reports poor or mediocre product-list performance on a majority of desktop and mobile sites. Source: [Baymard: Product Lists & Filtering UX](https://baymard.com/research/ecommerce-product-lists).
* Baymard recommends showing the current applied filters in an overview so users can understand and remove constraints quickly. Source: [Baymard: Display Applied Filters in an Overview](https://baymard.com/research-articles/how-to-design-applied-filters).
* Baymard also reports that filters should exist for the information shown in list items; otherwise users can see an attribute but cannot use it to narrow the list. Source: [Baymard: Have Filters for All Displayed List Item Info](https://baymard.com/research-articles/have-filters-for-list-item-info).
* Apple recommends making essential information easy to find and using grouping and spacing to communicate hierarchy. Source: [Apple HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout).

**UI implication:** use a desktop two-column PLP with a filter rail and product grid; use a mobile filter button that opens a full-height sheet. Place applied filter chips above the grid. Show result count, sort, and a small JEV intent summary near the heading. Keep cards scannable: image, full title, price, rating/review count, seller or shipping signal, and one clear action.

### 3. Recommendation content and trust

* Baymard’s cross-sell research finds that irrelevant recommendations damage confidence in recommendations across the site. It recommends dynamic counts based on relevance instead of filling a fixed quota, clear labels that explain the recommendation context, and priority for compatible or complementary items. Source: [Baymard: 6 Ways to Improve the Relevance of Cross-Sells](https://baymard.com/research-articles/product-recommendations-cart).
* Baymard’s product-page recommendation research identifies four essential attributes for evaluating suggestions: high-quality thumbnail, fully visible title, price, and average user rating. It says these details matter on mobile as well as desktop. Source: [Baymard: List Item Attributes for Cross-Sell Recommendations](https://baymard.com/research-articles/product-page-suggestions-information).
* Baymard distinguishes alternative recommendations from supplementary recommendations. Alternatives help users find a better match; supplementary products help complete a setup or look. Source: [Baymard: Recommend Alternative and Supplementary Products](https://baymard.com/research-articles/product-page-suggestions).

**UI implication:** every recommendation group needs an explicit reason label, for example `Matches your mid-century style`, `Completes the bedroom`, or `Works with this bed`. Do not show low-confidence filler items. If JEV finds only two strong matches, show two. Keep alternatives and complementary products in separate groups when both are present.

### 4. Modal behavior

* W3C’s modal dialog pattern requires focus to move inside the dialog when it opens, Tab and Shift+Tab to stay within it, Escape to close it, and focus to return to the invoking control when it closes. The dialog should have `role="dialog"`, `aria-modal="true"`, and an accessible name. Source: [WAI-ARIA Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
* W3C’s HTML dialog technique recommends using the native `dialog` element where possible; it moves focus into the modal, makes outside content inert, supports Escape, and returns focus to the invoking element. Source: [W3C H102: Creating modal dialogs with the HTML dialog element](https://www.w3.org/WAI/WCAG22/Techniques/html/H102).
* Material Design says dialogs interrupt the current task, should be used sparingly, should retain focus, and should not be obscured or partially off screen. It recommends full-screen dialogs on mobile for complex tasks. Source: [Material Design: Dialogs](https://m1.material.io/components/dialogs.html).

**UI implication:** the trigger is a real button with a specific label (`Get personalized recommendations`). The dialog title explains the task, the close button is visible, Escape works, the background is inert, and closing returns focus to the trigger. On desktop use a wide but bounded dialog; on mobile use a full-screen or bottom-sheet style dialog with a pinned title and close control. Avoid putting a second dialog inside it.

### 5. Carousel behavior

* W3C’s carousel tutorial requires semantic structure, controls to display and announce items, and user control to pause movement because automatic motion can make text hard to read. Source: [WAI Carousels Tutorial](https://www.w3.org/WAI/tutorials/carousels/).
* Baymard’s carousel research reports interaction problems and recommends static content when a carousel does not provide enough value. Source: [Baymard: 10 UX Requirements for Homepage Carousels](https://baymard.com/research-articles/homepage-carousel).

**UI implication:** recommendation carousels should not auto-advance. Use previous/next buttons with accessible names, visible overflow or pagination that communicates more items, keyboard support, touch swipe, and a responsive card count. On mobile, show one full card plus a visible portion of the next card to signal horizontal scrolling. Preserve a normal vertical list fallback for keyboard and screen-reader users.

### 6. Focus visibility and target size

* WCAG 2.2 includes Focus Visible as a Level AA success criterion; visible focus must remain apparent for keyboard users. Source: [W3C: Understanding Focus Visible](https://www.w3.org/WAI/WCAG22/UNDERSTANDING/focus-visible.html).
* W3C’s WCAG 2.2 techniques include minimum target-size guidance for pointer inputs. Use generously sized controls for close, filter, carousel, and card actions, especially on mobile. Source: [W3C WCAG 2.2: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
* Apple’s focus guidance recommends a focus ring for text/search fields and a highlight for list or collection items. Source: [Apple HIG: Focus and Selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection).

**UI implication:** provide a strong `:focus-visible` outline, never remove the browser focus indicator without a replacement, and make icon-only actions have visible labels to assistive technology. Ensure card links and controls have touch-friendly hit areas.

## Proposed user flows

### Flow A: natural-language search to PLP

1. User types “mid-century modern bedroom under $2,000” and submits.
2. Search suggestions may show matching product categories, styles, and recent searches.
3. PLP heading preserves the query. An intent strip shows `Bedroom`, `Mid-century modern`, and `Under $2,000` as removable chips.
4. Product grid shows normal retrieval results. JEV can reorder only the retrieved shortlist and returns a short reason for the leading items.
5. A non-blocking inline panel says `Want help planning the room?` with a **Get recommendations** button.

### Flow B: user-triggered recommendation dialog

1. User activates **Get recommendations**.
2. Dialog opens with title `Build your mid-century bedroom` and a concise explanation of the current intent.
3. JEV returns a dynamic number of high-confidence groups, such as `Start with`, `Complete the look`, and `Alternative styles`.
4. Each card includes image, title, price, rating, source/seller, reason label, and `View product`.
5. User can refine the plan with lightweight controls such as room size, number of sleepers, color, and budget. Recompute only after a deliberate action such as **Update recommendations**.
6. Close returns focus to **Get recommendations** and leaves the PLP state unchanged.

### Flow C: mobile

Use a full-width search field, horizontally scrollable intent chips, a sticky `Filter & sort` button, two-column product cards, and a full-screen recommendation dialog. In the dialog, use a vertical list by default; a horizontal carousel is acceptable only when card comparison is simple and the next card is visibly peeking into view.

## Recommended acceptance criteria for the UI build

1. Search submit navigates to a stable PLP URL that preserves the query and filters.
2. Search suggestions support keyboard navigation, Enter selection, and Escape dismissal.
3. Intent chips are visible, removable, and do not silently alter the original query.
4. Product cards expose image alt text, title, price, rating, and a keyboard-accessible product link.
5. Recommendation trigger is user-initiated and its label explains the action.
6. Dialog focus is trapped, Escape closes it, a visible close button exists, and focus returns to the trigger.
7. Recommendations show an explanation label and no filler items when confidence is low.
8. Carousel does not auto-advance and supports buttons, keyboard, touch, and an accessible non-carousel reading order.
9. Mobile filter and recommendation surfaces are usable without horizontal page overflow.
10. Remote image URLs have meaningful alt text and a visible loading/error fallback; the app does not need to host image files.

## Research limits

Baymard’s full benchmark is a paid research corpus; the linked pages expose the relevant public findings and methodology summaries, but not every underlying guideline or test artifact. W3C and Apple sources define interaction and accessibility behavior, not a complete ecommerce visual design. The recommendation content still needs evaluation with real catalog data and search logs.

## Sources

* [WAI-ARIA Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
* [WAI-ARIA Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
* [WAI Carousels Tutorial](https://www.w3.org/WAI/tutorials/carousels/)
* [W3C H102: Creating modal dialogs with the HTML dialog element](https://www.w3.org/WAI/WCAG22/Techniques/html/H102)
* [W3C: Understanding Focus Visible](https://www.w3.org/WAI/WCAG22/UNDERSTANDING/focus-visible.html)
* [W3C WCAG 2.2: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
* [Apple HIG: Searching](https://developer.apple.com/design/human-interface-guidelines/searching)
* [Apple HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
* [Apple HIG: Focus and Selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection)
* [Material Design: Dialogs](https://m1.material.io/components/dialogs.html)
* [Baymard: Product Lists & Filtering UX](https://baymard.com/research/ecommerce-product-lists)
* [Baymard: Ecommerce Search Query Types](https://baymard.com/research-articles/ecommerce-search-query-types)
* [Baymard: Display Applied Filters in an Overview](https://baymard.com/research-articles/how-to-design-applied-filters)
* [Baymard: Have Filters for All Displayed List Item Info](https://baymard.com/research-articles/have-filters-for-list-item-info)
* [Baymard: 6 Ways to Improve the Relevance of Cross-Sells](https://baymard.com/research-articles/product-recommendations-cart)
* [Baymard: List Item Attributes for Cross-Sell Recommendations](https://baymard.com/research-articles/product-page-suggestions-information)
* [Baymard: Recommend Alternative and Supplementary Products](https://baymard.com/research-articles/product-page-suggestions)
* [Baymard: 10 UX Requirements for Homepage Carousels](https://baymard.com/research-articles/homepage-carousel)
