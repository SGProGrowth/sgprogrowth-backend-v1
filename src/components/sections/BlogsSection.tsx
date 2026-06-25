import { blogPosts } from '../../data/homepageData'
import { Container } from '../layout/Container'
import { SectionHeader } from '../layout/SectionHeader'

export function BlogsSection() {
  return (
    <section id="blogs" className="section-padding bg-stone-50">
      <Container>
        <SectionHeader eyebrow="Resources" title="Insights from our coaching team" />
        <div className="grid gap-5 md:grid-cols-3">
          {blogPosts.map((post) => (
            <article key={post.title} className="card-interactive group flex flex-col p-6">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-forest-700">{post.category}</span>
              <time className="mt-3 text-xs text-ink-4">{post.date} · {post.readTime}</time>
              <h3 className="mt-3 text-[15px] font-bold text-ink group-hover:text-forest-800 transition-colors leading-snug">
                {post.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-ink-3 leading-relaxed">{post.excerpt}</p>
              <a href="#" className="mt-5 text-sm font-semibold link-underline">Read article</a>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
