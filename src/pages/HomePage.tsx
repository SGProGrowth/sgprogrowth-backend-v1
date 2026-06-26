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
    <>
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
    </>
  )
}
