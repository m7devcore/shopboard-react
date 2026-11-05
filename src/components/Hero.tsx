export interface HeroProps {
  readonly eyebrow?: string
  readonly headline: string
  readonly subtitle: string
}

export default function Hero({
  eyebrow = 'Curated Essentials',
  headline,
  subtitle,
}: HeroProps) {
  return (
    <section
      className="shopboard-hero"
      aria-labelledby="shopboard-hero-heading"
    >
      {eyebrow ? <p className="hero-eyebrow">{eyebrow}</p> : null}
      <h2 id="shopboard-hero-heading" className="hero-headline">
        {headline}
      </h2>
      <p className="hero-subtitle">{subtitle}</p>
    </section>
  )
}
