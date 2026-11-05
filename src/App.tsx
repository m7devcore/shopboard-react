import Header from './components/Header.tsx'

export default function App() {
  return (
    <div className="shopboard-app">
      <Header title="ShopBoard" totalItems={0} />
      <main className="shopboard-content">
        <p className="stage-notice">
          Stage 3A: Header component initialized. Storefront catalog and cart
          integration in progress.
        </p>
      </main>
    </div>
  )
}
