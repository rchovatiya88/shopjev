import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Search, Heart, Sparkles, SlidersHorizontal, X, ChevronLeft, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react'
import './styles.css'

const DEFAULT_QUERY = 'mid-century modern bedroom'
const QUICK_SEARCH_GROUPS = [
  { title: 'Style & mood', terms: ['Mid-century modern living room', 'Quiet luxury bedroom', 'Warm minimalist home decor', 'Coastal grandmother style', 'Dark academia desk setup', 'Scandinavian dining room', 'Colorful maximalist accents', 'Earthy boho apartment'] },
  { title: 'Shop by room', terms: ['Small-space entryway storage', 'Cozy reading nook essentials', 'Guest bedroom refresh', 'Balcony furniture for two', 'Home office upgrades', 'A better-organized closet', 'Soft lighting for a bedroom', 'Small bathroom storage'] },
  { title: 'Gifts & everyday', terms: ['Gift for grandma', 'Gift for a new homeowner', 'Thoughtful gifts under $50', 'Gifts for someone who loves cooking', 'Comfortable walking shoes', 'Everyday white sneakers', 'A versatile black work bag', 'Lightweight layers for travel', 'Wedding guest outfit', 'Durable carry-on luggage', 'Coffee table under $100', 'Blackout curtains for better sleep', 'Useful gifts for college students', 'Rain jacket for city commuting'] },
]

function money(amount, currency = 'USD') {
  if (!Number.isFinite(amount)) return 'Price unavailable'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount / 100)
}

function productPrice(product) {
  const variants = (product.variants || []).filter((variant) => variant?.availability?.available !== false && Number.isFinite(variant?.price?.amount))
  const variant = variants.sort((a, b) => a.price.amount - b.price.amount)[0]
  const price = variant?.price || product.price_range?.min
  return { amount: price?.amount, currency: price?.currency || 'USD', variant }
}

function productCategory(product) {
  const categories = Array.isArray(product.categories) ? product.categories : []
  const humanCategory = categories.find((item) => typeof item?.value === 'string' && !/^\d+$/.test(item.value))
  const category = product.category || product.product_type || humanCategory || categories[0]
  const value = typeof category === 'string' ? category : category?.value || category?.name || category?.title
  return value && !/^\d+$/.test(String(value)) ? value : 'Product'
}

function imageFor(product) {
  const media = product.media?.find((item) => item.type === 'image' && item.url)
  return media ? { src: media.url, alt: media.alt_text || product.title } : null
}

function App() {
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [submitted, setSubmitted] = useState(DEFAULT_QUERY)
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [sort, setSort] = useState('relevant')
  const [maxPrice, setMaxPrice] = useState(2000)
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [intent, setIntent] = useState(null)
  const [jevAvailable, setJevAvailable] = useState(false)
  const [modal, setModal] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [recommendationError, setRecommendationError] = useState('')
  const [recommendationLoading, setRecommendationLoading] = useState(false)
  const [activeGroup, setActiveGroup] = useState(0)
  const [mobileFilters, setMobileFilters] = useState(false)
  const [categories, setCategories] = useState([])
  const opener = useRef(null)
  const closeButton = useRef(null)

  async function searchCatalog(nextQuery = query, nextMaxPrice = maxPrice, options = {}) {
    const cleanQuery = nextQuery.trim()
    if (!cleanQuery) return
    const append = Boolean(options.cursor)
    setSubmitted(cleanQuery)
    setLoading(true)
    setError('')
    setRecommendations([])
    setRecommendationError('')
    if (!append) { setProducts([]); setPagination(null) }
    try {
      const response = await fetch('/api/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cleanQuery, maxPrice: nextMaxPrice, cursor: options.cursor }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Shopify search could not be completed.')
      setProducts((current) => {
        const incoming = body.products || []
        if (!append) return incoming
        const seen = new Set(current.map((product) => product.id))
        return [...current, ...incoming.filter((product) => !seen.has(product.id))]
      })
      setPagination(body.pagination || null)
      if (!append) {
        setIntent(body.intent || null)
        setJevAvailable(Boolean(body.jevAvailable))
        setCategories([])
        if (Number.isFinite(body.filters?.maxPrice)) setMaxPrice(body.filters.maxPrice)
      }
    } catch (cause) {
      setProducts([])
      setIntent(null)
      setError(cause.message || 'Shopify search could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { searchCatalog(DEFAULT_QUERY) }, [])

  const categoryOptions = useMemo(() => [...new Set(products.map(productCategory).filter((category) => category !== 'Product'))].sort(), [products])
  const visibleProducts = useMemo(() => {
    let list = products.filter((product) => !categories.length || categories.includes(productCategory(product)))
    if (sort !== 'relevant') {
      list = [...list].sort((a, b) => {
        const pa = productPrice(a).amount ?? Infinity
        const pb = productPrice(b).amount ?? Infinity
        return sort === 'low' ? pa - pb : pb - pa
      })
    }
    return list
  }, [products, categories, sort])

  async function openRecommendations() {
    opener.current = document.activeElement
    setModal(true)
    setRecommendations([])
    setRecommendationError('')
    setRecommendationLoading(true)
    setActiveGroup(0)
    window.setTimeout(() => closeButton.current?.focus(), 0)
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: submitted, maxPrice }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Recommendations are unavailable right now.')
      setRecommendations(body.groups || [])
      if (!body.groups?.length) setRecommendationError('Jev could not confidently interpret this request. Try adding a category or a little more detail.')
    } catch (cause) {
      setRecommendationError(cause.message || 'Recommendations are unavailable right now.')
    } finally {
      setRecommendationLoading(false)
    }
  }

  function closeRecommendations() {
    setModal(false)
    window.setTimeout(() => opener.current?.focus?.(), 0)
  }

  function onDialogKey(event) {
    if (event.key === 'Escape') closeRecommendations()
    if (event.key === 'Tab') {
      const nodes = [...event.currentTarget.querySelectorAll('button:not([disabled]), a[href]')]
      const first = nodes[0]
      const last = nodes.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
  }

  const currentGroup = recommendations[activeGroup]
  const filterCount = categories.length + (maxPrice < 2000 ? 1 : 0)

  return <div className="app-shell">
    <header className="site-header"><div className="header-inner">
      <a href="#top" className="wordmark" aria-label="ShopJev home"><span className="wordmark-mark">s</span><span>shopjev</span></a>
      <form className="search-bar" onSubmit={(event) => { event.preventDefault(); searchCatalog(query) }}>
        <Search size={18} aria-hidden="true"/><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search products" placeholder="Describe what you’re looking for"/>
        <button disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
      </form>
      <div className="header-actions"><span>Saved <b>{saved.length}</b></span></div>
    </div></header>
    <main id="top">
      <section className="hero"><div className="hero-inner"><div>
        <p className="kicker"><Sparkles size={15}/> SHOP BY INTENT</p>
        <h1>Find what you need.<br/><em>Discover what fits.</em></h1>
        <p className="hero-copy">Search across Shopify stores by product, occasion, style, or the idea you have in mind.</p>
      </div><div className="hero-note"><span className="note-line"/><p>“A calm bedroom with<br/>warm wood and soft light.”</p></div></div></section>
      <section className="results-area"><div className="results-toolbar"><div>
        <p className="eyebrow">YOUR SEARCH</p><h2>{submitted || 'Search Shopify products'}</h2>
        <p className="result-count" aria-live="polite">{loading ? 'Searching live Shopify catalog…' : `${visibleProducts.length}${pagination?.has_next_page ? '+' : ''} live ${visibleProducts.length === 1 ? 'result' : 'results'} · United States`}</p>
      </div><div className="toolbar-actions">
        <button className="filter-toggle" onClick={() => setMobileFilters(!mobileFilters)}><SlidersHorizontal size={16}/> Filters <span>{filterCount}</span></button>
        <label className="sort-label">Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="relevant">Most relevant</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label>
      </div></div>
      <div className="content-grid"><aside className={`filter-panel ${mobileFilters ? 'mobile-open' : ''}`}>
        <div className="filter-heading"><h3>Refine</h3><button aria-label="Close filters" onClick={() => setMobileFilters(false)}><X size={16}/></button></div>
        <div className="quick-searches" aria-label="Popular searches">
          <div className="quick-searches-heading"><span>Quick searches</span><small>Tap to explore</small></div>
          {QUICK_SEARCH_GROUPS.map((group) => <section className="quick-search-group" key={group.title}>
            <h4>{group.title}</h4>
            <div className="quick-search-list">{group.terms.map((term) => <button key={term} className={`quick-search-chip ${submitted === term ? 'active' : ''}`} aria-pressed={submitted === term} onClick={() => { setQuery(term); setCategories([]); searchCatalog(term, 2000); setMobileFilters(false) }}>{term}</button>)}</div>
          </section>)}
        </div>
        {categoryOptions.length > 1 && <div className="filter-group"><span>Categories in these results</span>{categoryOptions.map((category) => <label key={category}><input type="checkbox" checked={categories.includes(category)} onChange={() => setCategories((current) => current.includes(category) ? current.filter((value) => value !== category) : [...current, category])}/>{category}</label>)}</div>}
        <div className="filter-group"><label htmlFor="max-price">Maximum price</label><div className="range-labels"><span>$0</span><span>{maxPrice >= 2000 ? '$2,000+' : `$${maxPrice.toLocaleString()}`}</span></div><input id="max-price" type="range" min="50" max="2000" step="50" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} onMouseUp={() => searchCatalog(submitted, maxPrice)} onTouchEnd={() => searchCatalog(submitted, maxPrice)}/></div>
        <button className="clear-button" onClick={() => { setCategories([]); setMaxPrice(2000); searchCatalog(submitted, 2000) }}>Clear filters</button>
      </aside>
      <div className="listing-column">
        <div className="intent-banner"><div className="intent-icon"><Sparkles size={18}/></div><div><strong>{intent?.label || 'Shopping ideas, shaped around your search'}</strong><p>{jevAvailable ? 'Jev interpreted your query; Shopify product data stays out of Jev.' : 'Live products from Shopify Global Catalog.'}</p></div><button onClick={openRecommendations} disabled={!jevAvailable || !products.length || loading} title={!jevAvailable ? 'Add TYPESAFE_API_KEY on the server to enable Jev recommendations' : undefined}>Explore recommendations <span>→</span></button></div>
        {error ? <div className="error-state"><h3>We couldn’t reach the live catalog</h3><p>{error}</p><button className="text-button" onClick={() => searchCatalog(submitted)}>Try again <RefreshCw size={13}/></button></div> : loading && !products.length ? <div className="loading-state"><span className="spinner"/><p>Finding live products across Shopify stores…</p></div> : visibleProducts.length ? <div className="listing-grid">{visibleProducts.map((product) => {
          const price = productPrice(product)
          const image = imageFor(product)
          const seller = price.variant?.seller?.name || product.seller?.name || 'Shopify merchant'
          const productUrl = price.variant?.url || product.url
          return <article className="product-card" key={product.id}>
            <div className="product-image-wrap">{image ? <img className="product-image" src={image.src} alt={image.alt} loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; event.currentTarget.parentElement.classList.add('image-unavailable') }}/> : <div className="image-placeholder">Image unavailable</div>}
              <button className={`icon-button save-button ${saved.includes(product.id) ? 'saved' : ''}`} aria-label={`${saved.includes(product.id) ? 'Unsave' : 'Save'} ${product.title}`} onClick={() => setSaved((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id])}><Heart size={17} fill={saved.includes(product.id) ? 'currentColor' : 'none'}/></button>
            </div><div className="product-info"><p className="eyebrow">{productCategory(product) === 'Product' ? seller : `${productCategory(product)} · ${seller}`}</p><h3 title={product.title}>{product.title}</h3><div className="price-row"><span className="price">{money(price.amount, price.currency)}</span>{product.price_range?.max?.amount > product.price_range?.min?.amount && <span className="price-range">– {money(product.price_range.max.amount, product.price_range.max.currency)}</span>}</div>
              {price.variant?.sku && <p className="sku-line">SKU {price.variant.sku}</p>}
              {productUrl ? <a className="text-button product-link" href={productUrl} target="_blank" rel="noreferrer">View at {seller} <ExternalLink size={12}/></a> : <span className="muted-note">Merchant link unavailable</span>}
            </div>
          </article>
        })}</div> : !loading && <div className="empty-state"><h3>No live products found</h3><p>Try another description, category, or price range.</p><button className="text-button" onClick={() => { setQuery(''); setSubmitted(''); setProducts([]); setError('') }}>Clear search</button></div>}
        {pagination?.has_next_page && pagination.cursor && <button className="load-more-button" disabled={loading} onClick={() => searchCatalog(submitted, maxPrice, { cursor: pagination.cursor })}>{loading ? 'Loading…' : 'Load more products'}</button>}
      </div></div></section>
    </main>
    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeRecommendations()}><section className="recommendation-modal" role="dialog" aria-modal="true" aria-labelledby="recommendation-title" onKeyDown={onDialogKey}>
      <div className="modal-topline"><span className="ai-label"><Sparkles size={15}/> JEV-ASSISTED DISCOVERY</span><button className="icon-button" ref={closeButton} onClick={closeRecommendations} aria-label="Close recommendations"><X size={19}/></button></div>
      <div className="modal-heading"><div><p className="eyebrow">BASED ON YOUR SEARCH</p><h2 id="recommendation-title">Explore what goes with it</h2><p className="modal-copy">Jev reads your intent, then ShopJev searches Shopify for complementary ideas. Product details stay with Shopify.</p></div></div>
      {recommendationLoading ? <div className="loading-state modal-loading"><span className="spinner"/><p>Finding complementary products…</p></div> : recommendationError ? <div className="recommendation-message" role="status">{recommendationError}</div> : recommendations.length > 0 && <>
        <div className="bundle-tabs" role="tablist" aria-label="Recommendation groups">{recommendations.map((group, index) => <button key={group.title} role="tab" aria-selected={index === activeGroup} className={activeGroup === index ? 'active' : ''} onClick={() => setActiveGroup(index)}>{group.title}</button>)}</div>
        {currentGroup && <><div className="bundle-header"><div><h3>{currentGroup.title}</h3><p>{currentGroup.queryLabel}</p></div><div className="carousel-controls"><button className="icon-button" aria-label="Previous recommendation group" onClick={() => setActiveGroup((activeGroup + recommendations.length - 1) % recommendations.length)}><ChevronLeft/></button><button className="icon-button" aria-label="Next recommendation group" onClick={() => setActiveGroup((activeGroup + 1) % recommendations.length)}><ChevronRight/></button></div></div>
          <div className="bundle-carousel">{currentGroup.products.map((product) => { const price = productPrice(product); const image = imageFor(product); const url = price.variant?.url || product.url; return <article className="bundle-card" key={product.id}>{image ? <img src={image.src} alt={image.alt} loading="lazy" referrerPolicy="no-referrer"/> : <div className="bundle-image-empty">No image</div>}<div><p className="eyebrow">{productCategory(product)}</p><h4>{product.title}</h4><strong>{money(price.amount, price.currency)}</strong>{url && <a href={url} target="_blank" rel="noreferrer" className="fit-note">View product <ExternalLink size={11}/></a>}</div></article>})}</div>
        </>}
      </>}
      <div className="modal-footer"><span className="merchant-note">Prices and availability can change at the merchant.</span><button className="primary-button" onClick={closeRecommendations}>Back to results →</button></div>
    </section></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
