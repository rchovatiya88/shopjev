# Official product catalog data acquisition for a JEV search/recommendation engine

> **Current project decision:** ShopJev uses Shopify Global Catalog live and does not build a stored cross-marketplace catalog. The Amazon/eBay/API/feed comparisons below are background research only; they are not permission or an active ingestion plan. See [the current product plan](../docs/product-search-jev-project-plan.md).

Research date: 2026-09-26. Sources are first-party documentation or agreements. This note covers official APIs and feeds only; it does not recommend bypassing robots.txt, anti-bot controls, or marketplace terms with scraping.

## Executive finding

The technical problem is easy at 10,000 records; the rights and freshness problem is the gating issue. A JEV index can rank a normalized catalog, but the catalog must be data that we are licensed to store, transform, embed, and display. Amazon and eBay are poor foundations for a persistent, mixed-marketplace training/index corpus under their current published terms:

* Amazon Creators API is an affiliate product-linking API, not a general bulk catalog license. It returns product metadata, images, prices and availability, but requests are capped at 10 items for `SearchItems` and the account is subject to revenue-based throughput. Amazon requires current API-derived prices/availability, proper tagged links, and says that machine-learning use of Program Content needs express prior written approval.
* eBay Browse API exposes searchable listings, prices, images, categories, aspects and item URLs, but the API agreement requires public listing content to stay current (item data no older than six hours), prohibits co-mingling eBay Content with non-eBay content in a Public Display, and prohibits using eBay Content to train AI or build a service competitive with eBay.
* Best Buy has a comparatively usable public product catalog API with more than one million products and near-real-time price updates, but it is primarily electronics and its terms impose branding, key, rate-limit and display requirements.
* Google Merchant API is useful for ingesting a merchant’s own catalog/feed, not for discovering Amazon/eBay products. It should be treated as a first-party merchant connector.

For a durable JEV product engine, start with a catalog owned by the merchants or licensed through an affiliate/product-feed agreement that explicitly permits storage, normalization, embeddings, recommendations, and image URL display. Use Amazon/eBay as click-through or live-lookup connectors only after legal/partner approval. Keep source-specific data boundaries so one source’s terms do not contaminate the shared index.

## Source comparison

| Source | Official access and useful fields | Scale/freshness constraints | Terms and architecture consequence | Fit |
|---|---|---|---|---|
| **Amazon Creators API** (successor to PA-API) | `SearchItems` supports keyword/category/brand/title and refinements. Request resources include browse nodes, item title, images, and `offersV2.listings.price`; responses include ASIN and `detailPageURL`. `GetItems` can batch up to 10 ASINs. [SearchItems reference](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/search-items), [FAQ](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/frequently-asked-questions) | `SearchItems.itemCount` is 1–10 and `itemPage` is 1–10, so one query exposes at most 100 result slots. New credentials start at up to 1 TPS and 8,640 TPD for 30 days; limits then depend on shipped referral revenue, up to 10 TPS. Access can be lost after 30 days without qualified sales. [API rates](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/api-rates) | Prices/availability may be shown only when served by Amazon or obtained through Creators API/PA-API under the license. Comparison displays must include Amazon’s lowest new price and, if provided, lowest used price. Amazon says Program Content may not be used for machine-learning models without express written approval, and may not be sold/resold/redistributed; stale/unavailable content must be removed. [Program policies](https://affiliate-program.amazon.com/help/operating/policies) | **Connector/live lookup**, subject to written approval for JEV/embedding use. Do not build the MVP around a permanent Amazon-derived vector index without counsel and Amazon approval. |
| **eBay Browse API** | `item_summary/search` supports keyword, category, GTIN, product, aspects and filters; `item/{item_id}` retrieves details. Browse requires an application access token. The response model includes item IDs, listing title, category/aspects, price, image and item URL. [Browse API overview](https://developer.ebay.com/api-docs/buy/api-browse.html), [Buy APIs overview](https://developer.ebay.com/develop/api/buy) | eBay publishes API limits and can require an Application Growth Check for higher limits; Buy APIs require an additional license. Public listing information must be kept within six hours of the eBay listing and other content within 24 hours. [API call limits](https://developer.ebay.com/develop/api-call-limits), [API license agreement](https://developer.ebay.com/join/api-license-agreement) | The license limits use to facilitating access to eBay, requires eBay public content to be visually isolated from non-eBay listings, and prohibits using eBay Content to train algorithms/ML/AI, to build a service competitive with eBay, or to sell/store/modify content except as allowed. It also requires deleting content that is no longer public. [Agreement sections 8–9](https://developer.ebay.com/join/api-license-agreement) | **Live eBay vertical** with a separate index/cache and click-through. A mixed JEV corpus or embeddings over eBay Content needs explicit written permission. |
| **Best Buy Products API** | Official catalog API covers pricing, availability, specifications, descriptions and images for more than one million current/historical products; product records expose SKU, title, short description, image URL, current/regular prices, availability and product/web links. Categories and Recommendations APIs are available. [API catalog](https://developers.bestbuy.com/apis), [field documentation](https://bestbuyapis.github.io/api-documentation/) | Most information, including pricing, is near real time. Best Buy limits calls per API key; over-limit requests return HTTP 403. The `in` operator can fetch multiple SKUs in one request. [Terms and operational policy](https://developer.bestbuy.com/legal) | Terms require the key to be protected, prohibit third-party access unless authorized, require Best Buy branding when its API is present, and can suspend the key for violating required display language. Product coverage is mainly consumer electronics, so it does not solve furniture/apparel breadth. | **Good legal/technical bootstrap** for a source-isolated 10k electronics catalog, subject to key/terms review. |
| **Google Merchant API** | Lets an authenticated merchant create/manage product data sources and product inputs. Product attributes include offer ID/SKU, title, link, image link, availability and price. It supports API, upload, file-fetch and Autofeed inputs. [Overview](https://developers.google.com/merchant/api/overview), [add/manage products](https://developers.google.com/merchant/api/guides/products/add-manage), [data sources](https://developers.google.com/merchant/api/guides/data-sources/overview) | This is account/merchant-scoped, not a public marketplace search API. Products should be refreshed at least every 30 days to prevent expiration. | Appropriate when merchants authorize us to ingest their own catalog. The merchant remains responsible for Shopping policies and product approvals. It is the cleanest path for a catalog whose rights permit indexing and recommendations. | **Strong primary source** for merchant-owned inventory; not a way to harvest Amazon/eBay. |

## What a 10,000-product seed can realistically look like

1. **Preferred seed:** onboard 5–20 merchants/brands and ingest their Google Merchant feeds, Shopify/product exports, or direct CSV/JSON feeds under a written data license. Ask for stable SKU/GTIN, category taxonomy, title, description, attributes, price/currency, availability, canonical product URL, image URLs, and update timestamps.
2. **Public API seed:** use Best Buy for an electronics-only 10k pilot. For Amazon, 10,000 products means at least 1,000 `SearchItems` calls if every call returns ten items, before dedupe and refresh; the first 30-day 8,640-TPD ceiling is technically sufficient for a one-time seed but does not grant permission to keep a derivative corpus or train JEV. eBay can technically return many search pages, but the six-hour display and anti-competition/AI restrictions make a permanent shared catalog unsafe without a written license.
3. **Discovery plus live details:** maintain an internal entity record with only permitted stable identifiers and taxonomy; call the marketplace connector at query/display time for volatile price, availability and image/link details. This lowers stale-price risk but still requires each provider’s display and caching rules.

## Recommended source-neutral schema

Keep raw source payloads in source-specific tables and expose a normalized view only for fields whose license permits reuse:

```text
product_source(source, source_item_id, sku_or_asin, gtin, canonical_url)
product_core(title, description, brand, category_path, attributes_json)
offer(source_item_id, seller_id?, price, currency, availability, condition, observed_at, expires_at)
media(source_item_id, image_url, source_license, observed_at)
provenance(source, terms_version, retrieved_at, refresh_deadline, allowed_uses)
```

For image URLs, store the URL and attribution/source metadata only when the source terms allow remote rendering. Render through the source URL or approved CDN; do not proxy/cache images by default. If a provider requires deletion or limits age, `refresh_deadline` must be enforced by a job that unpublishes the offer when it expires.

## JEV-specific decision boundary

Use JEV for intent parsing, query decomposition, constraint extraction, candidate scoring and explanation over an index that we are allowed to transform. Example: “mid-century modern bedroom under $2,000” becomes `{room: bedroom, style: mid-century modern, budget: 2000, required_roles: [bed, nightstand, lighting, rug]}`; deterministic filters and vector retrieval generate candidates; JEV ranks complete-room bundles and explains tradeoffs.

Do not send Amazon or eBay restricted content into model training, fine-tuning, or a persistent embedding store until the relevant provider gives written permission. A safe initial split is:

* **Owned/licensed corpus:** normalized text/attributes and embeddings; JEV can rank and compose room/outfit recommendations.
* **Marketplace connectors:** source-specific search results, volatile price/availability, image URL and click-through link; JEV can use only the allowed request-time fields, with provider-specific display and refresh policies.
* **User-generated feedback:** first-party clicks, saves, purchases and explicit preference signals; use these for personalization, with consent and retention controls.

## Contradictions and open checks

* A 10k catalog is small for a search engine but large for affiliate API policy: technical pagination does not equal a license to create a durable derivative catalog.
* “Do not host images” reduces storage cost, but remote image URLs can expire, be rate-limited, require attribution, or be disallowed from long-lived caching. Store a URL plus expiry/provenance and implement broken-image fallback.
* Prices are not stable product attributes. Store observation time, currency, condition and seller/offer identity; display a fresh value and link users to the source checkout page.
* A single mixed index is operationally attractive but legally risky. Keep per-source indexes and a licensed/owned canonical index until counsel confirms cross-source joins, embeddings, and display rights.
* Amazon’s published Creators API documentation says PA-API is deprecated on May 15, 2026; use Creators API docs and verify account eligibility before implementation. [PA-API migration notice](https://webservices.amazon.co.uk/paapi5/documentation/search-items.html)

## Sources consulted

All links above are first-party: Amazon Associates/Creators API, eBay Developers Program, Best Buy Developer, and Google for Developers. Terms and limits can change; capture the accepted agreement/version and re-check before launch.
