import { useState } from 'react'
import type { Product } from '@/types'
import Hero from '@/components/home/Hero'
import Categories from '@/components/home/Categories'
import NewArrivals from '@/components/home/NewArrivals'
import Trending from '@/components/home/Trending'
import BestSellers from '@/components/home/BestSellers'
import FlashSale from '@/components/home/FlashSale'
import CollectionBanner from '@/components/home/CollectionBanner'
import Lookbook from '@/components/home/Lookbook'
import AboutBrand from '@/components/home/AboutBrand'
import ReviewsSection from '@/components/home/ReviewsSection'
import InstagramGallery from '@/components/home/InstagramGallery'
import Newsletter from '@/components/home/Newsletter'
import QuickViewModal from '@/components/product/QuickViewModal'

export default function Home() {
  const [quickView, setQuickView] = useState<Product | null>(null)

  return (
    <>
      <Hero />
      <Categories />
      <NewArrivals onQuickView={setQuickView} />
      <Trending onQuickView={setQuickView} />
      <FlashSale />
      <BestSellers onQuickView={setQuickView} />
      <CollectionBanner />
      <Lookbook />
      <AboutBrand />
      <ReviewsSection />
      <InstagramGallery />
      <Newsletter />
      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </>
  )
}
