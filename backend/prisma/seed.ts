import { PrismaClient, UserRole } from '@prisma/client'
import * as argon2 from 'argon2'
import { seedWorkspace } from './seed-workspace'

const prisma = new PrismaClient()

async function main() {
  const orgSlug = process.env.DEFAULT_ORGANIZATION_SLUG ?? 'sg-pro-growth'
  const orgName = process.env.DEFAULT_ORGANIZATION_NAME ?? 'SG Pro Growth'

  const organization = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: {},
    create: {
      name: orgName,
      slug: orgSlug,
      settings: { timezone: 'Asia/Kolkata' },
    },
  })

  const categories = [
    { slug: 'cloud-computing', title: 'Cloud Computing', description: 'AWS, Azure, GCP certifications', icon: 'cloud' },
    { slug: 'project-management', title: 'Project Management', description: 'PMP, Agile, Scrum', icon: 'pm' },
    { slug: 'data-analytics', title: 'Data & Analytics', description: 'Data engineering and analytics', icon: 'data' },
    { slug: 'leadership', title: 'Leadership', description: 'BNI and executive coaching', icon: 'leadership' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  const passwordHash = await argon2.hash('Password123!')

  const seedUsers: Array<{
    email: string
    name: string
    role: UserRole
    organizationLabel: string
    title?: string
    designation?: string
  }> = [
    { email: 'neha.sharma@example.com', name: 'Neha Sharma', role: UserRole.student, organizationLabel: 'TechCorp India', title: 'Software Engineer' },
    { email: 'ankit.verma@example.com', name: 'Ankit Verma', role: UserRole.student, organizationLabel: 'FinServe Global', title: 'Business Analyst' },
    { email: 'cloud.lead@example.com', name: 'Aanya Mehta', role: UserRole.instructor, organizationLabel: 'Sharva Group · Cloud Academy', designation: 'Lead Cloud Coach' },
    { email: 'pm.coach@example.com', name: 'Rohan Kapoor', role: UserRole.instructor, organizationLabel: 'Sharva Group · PM Institute', designation: 'Senior PM Coach' },
    { email: 'data.trainer@example.com', name: 'Sneha Desai', role: UserRole.instructor, organizationLabel: 'Sharva Group · Analytics Lab', designation: 'Data Coach' },
  ]

  for (const seed of seedUsers) {
    const existing = await prisma.user.findUnique({ where: { email: seed.email } })
    if (existing) continue

    const user = await prisma.user.create({
      data: {
        email: seed.email,
        passwordHash,
        emailVerifiedAt: new Date(),
        roles: { create: { role: seed.role } },
        organizationMembers: {
          create: { organizationId: organization.id, role: 'member' },
        },
        ...(seed.role === UserRole.student
          ? {
              studentProfile: {
                create: {
                  displayName: seed.name,
                  organizationLabel: seed.organizationLabel,
                  title: seed.title,
                  timezone: 'Asia/Kolkata',
                },
              },
            }
          : {
              instructorProfile: {
                create: {
                  displayName: seed.name,
                  organizationLabel: seed.organizationLabel,
                  designation: seed.designation,
                  title: seed.designation,
                  expertise: [],
                  credentials: [],
                  skills: [],
                },
              },
            }),
      },
    })

    console.log(`Seeded ${seed.role}: ${user.email}`)
  }

  await seedWorkspace(prisma)

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
