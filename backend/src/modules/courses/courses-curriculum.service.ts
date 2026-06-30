import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.module'
import { ReorderCurriculumDto, UpdateCurriculumDto } from '../../common/dto/course.dto'
import { courseDetailInclude, mapInstructorCourse } from './course.mapper'
import { CoursesService } from './courses.service'

@Injectable()
export class CoursesCurriculumService {
  constructor(
    private prisma: PrismaService,
    private coursesService: CoursesService,
  ) {}

  async getCurriculum(slug: string, instructorId: string) {
    const course = await this.coursesService.getOwnedCourseRecord(slug, instructorId)
    const full = await this.prisma.course.findUniqueOrThrow({
      where: { id: course.id },
      include: courseDetailInclude,
    })
    return mapInstructorCourse(full, instructorId).modules
  }

  async replaceCurriculum(slug: string, instructorId: string, dto: UpdateCurriculumDto) {
    const course = await this.coursesService.getOwnedCourseRecord(slug, instructorId)
    const incomingModuleIds = dto.modules.map((m) => m.id).filter(Boolean) as string[]
    const incomingLessonIds = dto.modules.flatMap((m) =>
      m.lessons.map((l) => l.id).filter(Boolean),
    ) as string[]

    await this.prisma.$transaction(async (tx) => {
      const existingModules = await tx.courseModule.findMany({
        where: { courseId: course.id },
        include: { lessons: true },
      })

      const modulesToDelete = existingModules.filter((m) => !incomingModuleIds.includes(m.id))
      for (const mod of modulesToDelete) {
        await tx.courseModule.delete({ where: { id: mod.id } })
      }

      for (const modInput of dto.modules) {
        const existingModule = modInput.id
          ? existingModules.find((m) => m.id === modInput.id)
          : undefined

        let moduleId: string

        if (existingModule) {
          await tx.courseModule.update({
            where: { id: existingModule.id },
            data: { title: modInput.title.trim(), sortOrder: modInput.order },
          })
          moduleId = existingModule.id
        } else {
          const created = await tx.courseModule.create({
            data: {
              ...(modInput.id ? { id: modInput.id } : {}),
              courseId: course.id,
              title: modInput.title.trim(),
              sortOrder: modInput.order,
            },
          })
          moduleId = created.id
        }

        const existingLessons = existingModule?.lessons ?? []
        const lessonsToDelete = existingLessons.filter((l) => !incomingLessonIds.includes(l.id))
        for (const lesson of lessonsToDelete) {
          await tx.courseLesson.delete({ where: { id: lesson.id } })
        }

        for (const lessonInput of modInput.lessons) {
          const existingLesson = lessonInput.id
            ? existingLessons.find((l) => l.id === lessonInput.id)
            : undefined

          if (existingLesson) {
            await tx.courseLesson.update({
              where: { id: existingLesson.id },
              data: {
                title: lessonInput.title.trim(),
                description: lessonInput.description?.trim(),
                type: lessonInput.type,
                durationMinutes: lessonInput.durationMinutes,
                sortOrder: lessonInput.order,
              },
            })
          } else {
            await tx.courseLesson.create({
              data: {
                ...(lessonInput.id ? { id: lessonInput.id } : {}),
                moduleId,
                title: lessonInput.title.trim(),
                description: lessonInput.description?.trim(),
                type: lessonInput.type,
                durationMinutes: lessonInput.durationMinutes,
                sortOrder: lessonInput.order,
              },
            })
          }
        }
      }
    })

    return this.getCurriculum(slug, instructorId)
  }

  async reorder(slug: string, instructorId: string, dto: ReorderCurriculumDto) {
    const course = await this.coursesService.getOwnedCourseRecord(slug, instructorId)

    await this.prisma.$transaction(async (tx) => {
      for (let index = 0; index < dto.moduleOrder.length; index++) {
        const moduleId = dto.moduleOrder[index]
        await tx.courseModule.updateMany({
          where: { id: moduleId, courseId: course.id },
          data: { sortOrder: index },
        })
      }

      if (dto.lessonOrder) {
        for (const [moduleId, lessonIds] of Object.entries(dto.lessonOrder)) {
          const module = await tx.courseModule.findFirst({
            where: { id: moduleId, courseId: course.id },
          })
          if (!module) throw new BadRequestException(`Invalid module: ${moduleId}`)

          for (let i = 0; i < lessonIds.length; i++) {
            await tx.courseLesson.updateMany({
              where: { id: lessonIds[i], moduleId },
              data: { sortOrder: i },
            })
          }
        }
      }
    })

    return this.getCurriculum(slug, instructorId)
  }
}
