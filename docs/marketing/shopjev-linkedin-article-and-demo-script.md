# ShopJev LinkedIn Article and Demo Script

## LinkedIn article

# Shopping is easier when search understands what you mean

Most people do not arrive at a store knowing the exact product name.

They say things like:

- “A black coffee table under $100.”
- “Help me pull together a calm, mid-century bedroom.”
- “I need comfortable waterproof shoes for walking around the city.”

Those searches mix products, preferences, budgets, and goals. A search box that treats every word as a keyword can miss what you actually want.

That is the problem I’m exploring with **ShopJev**, a shopping-discovery app for consumers. It helps people find products from shops on Shopify by describing what they need in their own words.

Instead of guessing a product name or browsing one store at a time, you can describe an item or an idea, then browse matching products, prices, images, and links to the shops selling them. For a request like “black coffee table under $100,” ShopJev separates the product description from the budget, applies the price limit, and brings closer matches to the top.

For a broader request—like putting together a mid-century bedroom—ShopJev can also show complementary product groups, such as lighting, textiles, and finishing touches.

Here is how the current prototype divides the work:

- **Jev interprets the query’s broad shopping intent** and routes it to relevant recommendation paths.
- **Shopify Global Catalog retrieves products** across merchants.
- **ShopJev applies explicit filters and local relevance ordering** to the returned products.
- Product images load from their Shopify-provided URLs; ShopJev does not download and host them.

In this version, Jev does not choose or rank individual product SKUs. The search and recommendation experience combines Jev’s structured intent decision with Shopify’s catalog retrieval and deterministic filtering. That boundary keeps product records out of Jev in the current design.

This is an early prototype, not a claim that every search is solved. Product availability and prices can change, so check the shop’s product page for current details. The next step is to test real searches and learn where the results still miss.

**What would you search for if you could describe what you need instead of guessing the product name?**

#ShopJev #Shopify #ProductDiscovery #Ecommerce #Search #AI

### Consumer-facing phrases to test

- Find products by describing what you need
- Search for products by style and budget
- Find affordable home decor that fits your style
- Discover products from multiple Shopify shops
- Get ideas for completing a room

## Demo video script (about 75 seconds)

### 0:00–0:07 — Hook

**On screen:** ShopJev results page; cursor clicks into search.

**Voiceover:** “What if shoppers could search for what they mean, instead of needing the exact product name?”

### 0:07–0:25 — Product plus constraint

**On screen:** Enter `black coffee table under $100`, then submit. Show the maximum-price control changing to $100 and the first result cards.

**Voiceover:** “I’ll search for a black coffee table under $100. ShopJev recognizes the product request, separates out the budget, and applies the price cap. The first results are black coffee tables priced below that limit.”

### 0:25–0:37 — Search by an idea

**On screen:** Search `mid-century modern bedroom with warm wood and soft lighting`.

**Voiceover:** “Shoppers can also start with a broader idea, like creating a warm, mid-century bedroom.”

### 0:37–0:53 — Recommendations

**On screen:** Select **Explore recommendations**. Show the complementary recommendation carousel and move through its groups.

**Voiceover:** “Jev identifies the broad home and decor intent. ShopJev uses that decision to open complementary Shopify searches for pieces like lighting, textiles, and finishing touches.”

### 0:53–1:08 — Explain what makes it different

**On screen:** Brief overlay: `Describe what you need` → `ShopJev understands the intent` → `Browse live products from Shopify shops`.

**Voiceover:** “Behind the scenes, Jev helps interpret the request, Shopify Global Catalog finds products across shops, and ShopJev applies filters like your budget. Jev doesn’t rank individual products in this prototype.”

### 1:08–1:15 — Close

**On screen:** Return to the product grid, then show the ShopJev name and URL.

**Voiceover:** “That’s ShopJev: search by what you mean. Find what fits. What would you shop for if you could just describe it?”

## Recording notes

- Use the local ShopJev page at `http://localhost:5173/`.
- Wait for live results before narrating product counts or prices.
- Keep the full search query and the $100 filter visible in the first demo segment.
- Present ShopJev as a consumer shopping experience, not a tool being sold to Shopify stores.
- Do not describe the current prototype as personalized or as Jev-ranked at the SKU level.
- Remind viewers that the merchant page is the source of truth for current price and availability.
