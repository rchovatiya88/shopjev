# Product search and recommendation UI/UX research

**Checked:** 2026-09-26. This informs a search-to-product-list prototype with an optional recommendation dialog and carousel.

## Evidence-based design decisions

1. **Keep search prominent and make suggestions useful, editable.** Baymard's ecommerce search research covers how shoppers form queries, autocomplete, results pages, and no-results states. Its study specifically reports that users use suggestions as starting points and can benefit when the active suggestion is copied into the search field so they can edit it before submitting. The prototype should show query suggestions and let keyboard users edit/submit normally; don't let autocomplete hijack the query. [Baymard search research](https://baymard.com/research/ecommerce-search), [active suggestion behavior](https://baymard.com/research-articles/copy-search-suggestion-to-search-field)

2. **Make the product listing page scannable and refinable.** Baymard's product-list research frames result list, filters, and sorting as a connected product-finding task; it reports observed usability problems when filters and result information are weak. Show result count, visible sort and filter affordances, active filter chips, meaningful product attributes (price, material/style/size when known), and a clear remove/reset path. Avoid overly dense product cards. [Product list research](https://baymard.com/research/ecommerce-product-lists), [filter UI](https://baymard.com/blog/ecommerce-filter-ui), [listing information](https://baymard.com/research-articles/product-listing-information)

3. **Recommendations should be supplementary and clearly contextual.** Baymard distinguishes alternatives from supplementary products and reports many product pages fail to present both appropriately. For a search-results experience, make the recommendation launcher optional and contextual (e.g., “Build a room around these results”), explain the criteria in a short sentence, and retain the underlying search page as the user's anchor. Do not claim personalization unless actual preference/history signals are used. [Baymard product suggestions](https://baymard.com/research-articles/product-page-suggestions)

4. **Prefer a user-controlled carousel.** W3C WAI says carousel controls must be keyboard-operable, changes need to be communicated to assistive technologies, focus should remain understandable, and automatic movement must be stoppable. This prototype uses explicit previous/next buttons and no autoplay; the product row can also be scrolled horizontally by touch/trackpad. Give each carousel a heading/region label and position announcement, and ensure buttons have accessible names. [WAI carousel tutorial](https://www.w3.org/WAI/tutorials/carousels/), [controls guidance](https://www.w3.org/WAI/tutorials/carousels/controls/)

5. **Treat the recommendation popup as a real modal.** WAI-ARIA APG specifies moving focus inside on open, containing Tab/Shift+Tab, closing on Escape, restoring focus to the invoking control, and including a visible close button. Only mark it modal if background interaction is truly blocked and visually obscured. On narrow screens, use a nearly full-screen dialog/sheet with its own scroll region and a reachable close action. [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

## Proposed experience flow

- Search field accepts plain-language intent (“warm, compact reading corner”), category terms, and exact product identifiers.
- Submit transitions to a results/listing view; keep the query visible/editable and show a concise result count.
- User can refine by category, price, style, material, and color. Selected filters are visible and removable.
- The page includes a clearly optional recommendation action near the result heading, e.g. **“Build a bedroom set”**.
- Activating it opens a modal with an explicit explanation of the interpreted intent, user-editable constraints, and a carousel of proposed items. Each item has a product name, image, price, source, and a specific reason it fits. A set summary shows roles covered and total item subtotal; only show totals that can be computed from displayed offer data.
- Buttons let user move through carousel, replace/remove items, or return to results. Avoid autoplay and avoid making recommendation UI block ordinary search.
- At mobile width, filters open in a dedicated drawer, product cards become a two-column or single-column layout depending on space, and the recommendation modal becomes a full-height sheet.

## Implementation checklist

- Semantic `form`, labelled search input, buttons, headings and list/grid structure.
- Search suggestion keyboard operation and focus styling.
- Modal: focus management, Escape close, background inertness, focus restore, visible close control.
- Carousel: labelled region, accessible previous/next controls, no autoplay, visually hidden position announcement, cards remain reachable to touch and keyboard users.
- Responsive: no horizontal page overflow; carousel scroll area is only intentionally horizontal.
- Reduced-motion preference honored for any nonessential transitions.
- Result states: populated, no matches with editable query/suggestions, loading, and source/image unavailable fallback.

## Limits

Baymard's public pages summarize portions of its proprietary research; this document does not claim to reproduce all paid guidelines. W3C WAI/APG provides accessibility design guidance, not a usability guarantee. Validate the final UI with keyboard, screen reader, touch, and users searching by both exact item and open-ended intent.
