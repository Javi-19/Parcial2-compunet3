import { ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { User } from '../user/entities/user.entity';
import { PaginationDto } from '../student/dto/pagination.dto';
import { Advisor } from './entities/advisor.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isUUID } from 'class-validator';

@Injectable()
export class AdvisorService {

  private readonly logger = new Logger("AdvisorService");

  constructor(
    @InjectRepository(Advisor)
    private readonly advisorRepository: Repository<Advisor>,
    private readonly datasource: DataSource
  ) { }


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


  remove(id: number) {
    return `This action removes a #${id} advisor`;
  }

  private handleException(error: any): never {
    if (error instanceof HttpException) throw error;

    if (error.code === '23505')
      throw new ConflictException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
