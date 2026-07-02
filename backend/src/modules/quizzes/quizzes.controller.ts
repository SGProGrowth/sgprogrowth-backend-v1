import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import {
  CreateQuizDto,
  GenerateQuizQuestionsDto,
  GradeQuizAnswerDto,
  InstructorQuizzesQueryDto,
  SaveQuizAnswersDto,
  SetQuizQuestionsDto,
  UpdateQuizDto,
} from '../../common/dto/quiz.dto'
import { ApiMessageDto } from '../../common/dto/auth.dto'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { QuizzesService } from './quizzes.service'

@ApiTags('quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Get('mine')
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'List quizzes owned by instructor' })
  listMine(@CurrentUser() user: JwtPayload, @Query() query: InstructorQuizzesQueryDto) {
    return this.quizzesService.listInstructorQuizzes(user.sub, query)
  }

  @Get('me')
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'List available quizzes for student' })
  listForStudent(@CurrentUser() user: JwtPayload) {
    return this.quizzesService.listStudentQuizzes(user.sub)
  }

  @Get('me/analytics')
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'Student quiz performance analytics' })
  studentAnalytics(@CurrentUser() user: JwtPayload) {
    return this.quizzesService.getStudentAnalytics(user.sub)
  }

  @Post()
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Create draft quiz' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateQuizDto) {
    return this.quizzesService.createQuiz(user.sub, dto)
  }

  @Get(':id')
  @Roles(UserRole.instructor, UserRole.student)
  @ApiOperation({ summary: 'Quiz detail' })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (user.activeRole === UserRole.instructor) {
      return this.quizzesService.getQuizForInstructor(id, user.sub)
    }
    return this.quizzesService.getQuizForStudent(id, user.sub)
  }

  @Patch(':id')
  @Roles(UserRole.instructor)
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateQuizDto) {
    return this.quizzesService.updateQuiz(id, user.sub, dto)
  }

  @Delete(':id')
  @Roles(UserRole.instructor)
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<ApiMessageDto> {
    return this.quizzesService.deleteQuiz(id, user.sub)
  }

  @Post(':id/publish')
  @Roles(UserRole.instructor)
  publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.quizzesService.publishQuiz(id, user.sub, user.email)
  }

  @Post(':id/unpublish')
  @Roles(UserRole.instructor)
  unpublish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.quizzesService.unpublishQuiz(id, user.sub)
  }

  @Post(':id/archive')
  @Roles(UserRole.instructor)
  archive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.quizzesService.archiveQuiz(id, user.sub)
  }

  @Put(':id/questions')
  @Roles(UserRole.instructor)
  setQuestions(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SetQuizQuestionsDto,
  ) {
    return this.quizzesService.setQuestions(id, user.sub, dto)
  }

  @Post(':id/questions/generate')
  @Roles(UserRole.instructor)
  generateQuestions(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateQuizQuestionsDto,
  ) {
    return this.quizzesService.generateQuestions(id, user.sub, dto)
  }

  @Get(':id/analytics')
  @Roles(UserRole.instructor)
  analytics(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.quizzesService.getInstructorAnalytics(id, user.sub)
  }

  @Get(':id/attempts')
  @Roles(UserRole.instructor)
  listAttempts(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.quizzesService.listQuizAttemptsForInstructor(id, user.sub)
  }

  @Post(':id/attempts/start')
  @Roles(UserRole.student)
  startAttempt(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.quizzesService.startAttempt(id, user.sub)
  }

  @Get(':id/attempts/history')
  @Roles(UserRole.student)
  attemptHistory(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.quizzesService.listStudentAttempts(id, user.sub)
  }

  @Get('attempts/:attemptId/player')
  @Roles(UserRole.student)
  getPlayer(@Param('attemptId') attemptId: string, @CurrentUser() user: JwtPayload) {
    return this.quizzesService.getAttemptPlayer(attemptId, user.sub)
  }

  @Patch('attempts/:attemptId/answers')
  @Roles(UserRole.student)
  saveAnswers(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SaveQuizAnswersDto,
  ) {
    return this.quizzesService.saveAnswers(attemptId, user.sub, dto)
  }

  @Post('attempts/:attemptId/submit')
  @Roles(UserRole.student)
  submit(@Param('attemptId') attemptId: string, @CurrentUser() user: JwtPayload) {
    return this.quizzesService.submitAttempt(attemptId, user.sub)
  }

  @Get('attempts/:attemptId/result')
  @Roles(UserRole.instructor, UserRole.student)
  getResult(@Param('attemptId') attemptId: string, @CurrentUser() user: JwtPayload) {
    const role = user.activeRole === UserRole.instructor ? 'instructor' : 'student'
    return this.quizzesService.getAttemptResult(attemptId, user.sub, role)
  }

  @Post('attempts/:attemptId/answers/:answerId/grade')
  @Roles(UserRole.instructor)
  gradeAnswer(
    @Param('attemptId') attemptId: string,
    @Param('answerId') answerId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: GradeQuizAnswerDto,
  ) {
    return this.quizzesService.gradeAnswer(attemptId, answerId, user.sub, dto)
  }
}
