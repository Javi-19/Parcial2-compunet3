import { ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { User } from '../user/entities/user.entity';
import { PaginationDto } from '../student/dto/pagination.dto';
import { Advisor } from './entities/advisor.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AssignStudentsDto } from '../program/dto/assign-students.dto';
import { Student } from '../student/entities/student.entity';

@Injectable()
export class AdvisorService {

  private readonly logger = new Logger("AdvisorService");

  constructor(
    @InjectRepository(Advisor)
    private readonly advisorRepository: Repository<Advisor>,
    private readonly datasource: DataSource
  ) { }


  async assignStudents(id: string, assignStudentsDto: AssignStudentsDto) {
    const advisor = await this.findOne(id);

    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const studentId of assignStudentsDto.studentIds) {

        // update() no dispara @BeforeUpdate, así el nickname del estudiante no cambia
        const result = await queryRunner.manager.update(Student, { id: studentId }, { advisor: { id: advisor.id } });
        if (!result.affected)
          throw new NotFoundException(`Student with id ${studentId} not found`);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleException(error);
    } finally {
      await queryRunner.release();
    }

    return this.findOne(id);
  }


  async create(createAdvisorDto: CreateAdvisorDto, user: User) {
    try {
      const advisor = this.advisorRepository.create({
        ...createAdvisorDto,
        createdBy: user
      });
      await this.advisorRepository.save(advisor);
      return advisor;
    } catch (error) {
      this.handleException(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, skip } = paginationDto;
    return this.advisorRepository.find({
      take: limit,
      skip: skip
    });
  }

  async findOne(id: string) {
    const advisor = await this.advisorRepository.findOne({
      where: { id },
      relations: { students: true },
    });

    if (!advisor) {
      throw new NotFoundException(`Advisor ${id} not found`);
    }

    return advisor;
  }


  async removeAdvisor(advisorId: string, studentId: string) {
    const result = await this.datasource
      .createQueryBuilder()
      .update(Student)
      .set({ advisor: null })
      .where('id = :studentId', { studentId })
      .andWhere('"advisorId" = :advisorId', { advisorId })
      .execute();

    if (!result.affected) {
      throw new NotFoundException(
        'Student is not assigned to this advisor'
      );
    }

    return { message: 'Student unassigned successfully' };
  }

  private handleException(error: any): never {
    if (error instanceof HttpException) throw error;

    if (error.code === '23505')
      throw new ConflictException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
