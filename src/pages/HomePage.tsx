import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { HeroSection } from '../components/sections/HeroSection'
import { TrustBar } from '../components/sections/TrustBar'
import { SuccessMetricsSection } from '../components/sections/SuccessMetricsSection'
import { FeaturedCoursesSection } from '../components/sections/FeaturedCoursesSection'
import { CourseCategoriesSection } from '../components/sections/CourseCategoriesSection'
import { WhyChooseUsSection } from '../components/sections/WhyChooseUsSection'
import { HowItWorksSection } from '../components/sections/HowItWorksSection'
import { PlatformComparisonSection } from '../components/sections/PlatformComparisonSection'
import { LearningPathsSection } from '../components/sections/LearningPathsSection'
import { TestimonialsSection } from '../components/sections/TestimonialsSection'
import { CorporateSection } from '../components/sections/CorporateSection'
import { BlogsSection } from '../components/sections/BlogsSection'
import { CTASection } from '../components/sections/CTASection'

export function HomePage() {
  return (
    <div id="top" className="min-h-screen bg-stone-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-forest-800 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <TrustBar />
        <SuccessMetricsSection />
        <FeaturedCoursesSection />
        <CourseCategoriesSection />
        <WhyChooseUsSection />
        <HowItWorksSection />
        <PlatformComparisonSection />
        <LearningPathsSection />
        <TestimonialsSection />
        <CorporateSection />
        <BlogsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
