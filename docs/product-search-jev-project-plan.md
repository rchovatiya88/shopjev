# ShopJev product plan

**Status:** Shopify Global Catalog is the selected live product source. This replaces the earlier proposal to create a persistent cross-source product database.

## Product direction

ShopJev is a consumer shopping discovery experience for people who know the outcome they want but not necessarily the exact product name. The initial audience is US shoppers, the catalog is broad, and the first release is focused on validating repeat use rather than earning affiliate revenue.

**Positioning:** Describe what you need. Find products that fit—and discover what goes with them.

Search by exact product or SKU, category, occasion, style, or shopping goal. Product results remain the primary experience. Recommendations are optional and open a small set of complementary searches.

## Shopify + Jev responsibilities

- Shopify Global Catalog performs live discovery and supplies current listing metadata, prices, availability, image URLs, merchant names, and merchant links.
- Jev receives only the shopper's query and classifies broad intent. It does not receive Shopify product fields, images, or candidates.
- ShopJev maps a high-confidence category intent to a few complementary text searches and executes each against Shopify.
- Code handles exact product/variant IDs, exact SKU matching, price limits, currency formatting, filtering, and sorting.
- If Jev is unavailable or uncertain, the app keeps live Shopify search and disables recommendations.

## Data and privacy boundaries

- Do not build a persistent index from Global Catalog results. Search results are fetched per request and not written to a database or cache.
- Render Shopify image URLs in the matching live product listing. Do not proxy, download, or host the images.
- Treat price and availability as observed values; merchant product/checkout pages are the final source of truth.
- Do not forward Shopify product fields to Jev unless a terms review explicitly allows that processing and the implementation is updated deliberately.

## Evaluation

Maintain a US-English query set that includes exact SKU and product ID searches, category and style searches, intent/occasion requests, hard price ceilings, impossible constraints, and ambiguous prompts. Compare Shopify's live ranking alone against the user experience with Jev intent labels and complementary search groups. Track query success, product click-through, recommendation use, repeat sessions, latency, Jev availability, Shopify errors, and no-result rates.

Only add Jev to product ranking if a separate terms review allows the product data flow and an offline comparison shows useful improvement over Shopify's relevance. Keep exact matching and all price arithmetic deterministic.

## Monetization and growth

First validate that shoppers understand the intent-led search and return to use it. Shopify promoted placements are optional, invite-led in preview, and should not be treated as a launch revenue plan. If added later, preserve the merchant-supplied attribution URL, distinguish promoted listings from organic results, and disclose material connections clearly.

## Primary references

- [Shopify Global Catalog](https://shopify.dev/docs/agents/catalog/global-catalog)
- [Shopify catalog usage guidelines](https://shopify.dev/docs/agents/catalog)
- [Shopify promoted placements](https://shopify.dev/docs/agents/catalog/promoted-placement)
- [TypeSafe Jev model reference](https://docs.typesafe.ai/models)
- [Jev 1.13 known limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13)
- [Product search and recommendation UX notes](../research/product-search-recommendation-ux.md)
