import { courseCategories } from '../../data/homepageData'
import { Container } from '../layout/Container'
import { SectionHeader } from '../layout/SectionHeader'
import { CategoryCard } from '../ui/CategoryCard'

export function CourseCategoriesSection() {
  return (
    <section id="categories" className="section-padding bg-stone-50">
      <Container>
        <SectionHeader
          eyebrow="Browse by topic"
          title="Find your learning path"
          description="Structured programs across project management, cloud, data, leadership, and software engineering."
          align="center"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {courseCategories.map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
      </Container>
    </section>
  )
}
