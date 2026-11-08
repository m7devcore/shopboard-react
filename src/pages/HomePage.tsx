/**
 * ShopBoard — Home Page (Day 5 Phase 3)
 *
 * Real storefront landing page providing a curated introduction to ShopBoard essentials,
 * brand values, category highlights, and direct navigation into the catalog.
 */

import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <span className="hero-eyebrow">Curated Essentials</span>
        <h1 className="home-headline">Everyday Carry & Studio Goods</h1>
        <p className="home-subtitle">
          Thoughtfully engineered bags, footwear, and accessories built for
          daily utility, longevity, and modern work.
        </p>
        <div className="home-cta-group">
          <Link to="/products" className="btn-primary-cta">
            Explore Catalog →
          </Link>
          <a href="#categories" className="btn-secondary-cta">
            View Categories
          </a>
        </div>
      </section>

      <section className="home-values" aria-label="Brand principles">
        <div className="value-card">
          <div className="value-icon" aria-hidden="true">
            🎯
          </div>
          <h2 className="value-title">Daily Utility</h2>
          <p className="value-description">
            Functional goods designed for working professionals, travelers, and
            studio creatives.
          </p>
        </div>
        <div className="value-card">
          <div className="value-icon" aria-hidden="true">
            🌱
          </div>
          <h2 className="value-title">Durable Materials</h2>
          <p className="value-description">
            Full-grain leathers, reinforced canvas, and high-tensile fabrics
            designed to endure.
          </p>
        </div>
        <div className="value-card">
          <div className="value-icon" aria-hidden="true">
            🛡️
          </div>
          <h2 className="value-title">Verified Pricing</h2>
          <p className="value-description">
            Strict boundary validation guarantees upfront pricing with zero
            hidden surcharges.
          </p>
        </div>
      </section>

      <section
        id="categories"
        className="home-categories"
        aria-label="Featured categories"
      >
        <div className="section-header">
          <h2 className="section-title">Shop by Category</h2>
          <p className="section-subtitle">
            Focused collections built around everyday routines.
          </p>
        </div>

        <div className="category-cards-grid">
          <Link to="/products" className="category-card">
            <div className="category-card-icon" aria-hidden="true">
              🎒
            </div>
            <h3 className="category-card-title">Bags</h3>
            <p className="category-card-text">
              Totes, backpacks, and crossbodies engineered for everyday carry.
            </p>
            <span className="category-card-link">View Collection →</span>
          </Link>

          <Link to="/products" className="category-card">
            <div className="category-card-icon" aria-hidden="true">
              👟
            </div>
            <h3 className="category-card-title">Shoes</h3>
            <p className="category-card-text">
              Sneakers, boots, and classic loafers built for comfort and style.
            </p>
            <span className="category-card-link">View Collection →</span>
          </Link>

          <Link to="/products" className="category-card">
            <div className="category-card-icon" aria-hidden="true">
              🧢
            </div>
            <h3 className="category-card-title">Accessories</h3>
            <p className="category-card-text">
              Beanies, scarves, leather belts, and minimalist cardholders.
            </p>
            <span className="category-card-link">View Collection →</span>
          </Link>
        </div>
      </section>

      <section className="home-bottom-banner">
        <div className="banner-content">
          <h2>Ready to explore our full collection?</h2>
          <p>
            Browse all 12 curated essentials with real-time stock and dynamic
            pricing.
          </p>
          <Link to="/products" className="btn-primary-cta">
            Go to Catalog →
          </Link>
        </div>
      </section>
    </div>
  )
}
