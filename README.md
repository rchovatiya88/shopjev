# ShopJev

ShopJev is a consumer shopping search prototype. Search for a product, occasion, style, or goal across Shopify Global Catalog. Jev can interpret the shopper's query and open complementary Shopify searches in the recommendation carousel.

## Run locally

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```sh
npm install
cp .env.example .env
# Add a Typesafe key to .env to enable Jev intent and recommendations.
npm run dev
```

Open `http://localhost:5173`. Shopify Catalog search is live without an API key, subject to Shopify's keyless rate limits. Jev is optional; without `TYPESAFE_API_KEY`, product search still works and recommendations stay disabled. `.env` is server-only and ignored by Git.

For a production-style local run:

```sh
npm run build
npm start
```

## How it works

1. The browser sends a query and optional maximum price to the ShopJev server.
2. The server asks Jev to classify only the shopper's query. It never sends Shopify titles, descriptions, SKUs, prices, image URLs, or other product data to Jev.
3. The server queries Shopify Global Catalog live, using US shipping context and current availability. Search responses are not cached or persisted.
4. When a shopper opens recommendations, Jev classifies the query and ShopJev runs three complementary live Shopify searches. Jev does not select or rank individual products.
5. Product images render directly from Shopify's image URLs in the associated listing; ShopJev does not download or host them. Product links open the merchant's URL.

Exact Shopify product/variant GIDs use `lookup_catalog`. SKU-like searches run a Shopify search and keep only variants with an exact SKU match. Price filters are converted to Shopify's integer minor currency units in server code.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `TYPESAFE_API_KEY` | No | Enables Jev query classification and recommendation search groups. |
| `SHOPIFY_AGENT_PROFILE_URL` | No | HTTPS URL for a hosted UCP platform profile. Defaults to Shopify's published valid Global Catalog profile fixture for development. |
| `PORT` | No | HTTP server port; defaults to `5173`. |

Do not add secrets to client-side Vite variables (such as `VITE_TYPESAFE_API_KEY`). For a deployed app, host a ShopJev UCP agent profile and set its HTTPS URL in the server environment. Production deployment must use a Node server that can run `server/index.js`; static-only hosting cannot protect Jev credentials or serve the API routes.

## Shopify data handling

- Shopify results are fetched again for every search and recommendation request. The app does not retain a product database.
- Shopify product data and images are not cached. Images are loaded directly from the URL returned with the relevant live listing.
- Price and availability are current only as of the Shopify response; merchant checkout is the final source of truth.
- Shopify's Global Catalog has dynamic rate limits. Keyless access does not support limit increases.
- Shopify marks some enriched fields as inferred. ShopJev currently avoids using inferred product descriptions as factual claims.

See [Shopify's Global Catalog docs](https://shopify.dev/docs/agents/catalog/global-catalog), [catalog usage guidelines](https://shopify.dev/docs/agents/catalog), [Jev model docs](https://docs.typesafe.ai/models), and [Jev's known limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13).

## Checks

```sh
npm test
npm run build
```
