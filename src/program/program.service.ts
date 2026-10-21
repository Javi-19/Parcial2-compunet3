import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Program } from './entities/program.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { PaginationDto } from '../student/dto/pagination.dto';
import { Student } from '../student/entities/student.entity';
import { User } from '../user/entities/user.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { AssignStudentsDto } from './dto/assign-students.dto';
import { BulkCreateProgramDto } from './dto/bulk-create-program.dto';

@Injectable()
export class ProgramService {

    // TODO Reto 1: inyecta el repositorio de Program (y lo que necesites para las transacciones)

    // TODO Reto 1: create(createProgramDto, user) -> guarda el programa
    //   - nombre o código repetido -> 409 Conflict (no 500)

    // TODO Reto 1: findAll(paginationDto) -> lista paginada (limit / skip)

    // TODO Reto 2: findOne(id) -> programa con sus estudiantes, 404 si no existe

    // TODO Reto 2: assignStudents(id, assignStudentsDto) -> AGREGA estudiantes al programa
    //   dentro de una transacción (QueryRunner), conservando los que ya tenía.
    //   Mismo patrón del update de estudiantes corregido en clase (combinar las notas):
    //   traer los actuales -> combinar con los nuevos -> guardar la lista completa.
    //   Si algún id no existe: 404 y rollback.

    // TODO Reto 3: bulkCreate(bulkCreateProgramDto, user) -> crea todos los programas o ninguno
    //   (transacción). Cualquier nombre/código repetido -> 409 y rollback.


    private readonly logger = new Logger("ProgramService");

    constructor(
        @InjectRepository(Program)
        private readonly programRepository: Repository<Program>,
        private readonly datasource: DataSource
    ) { }

    async create(createProgramDto: CreateProgramDto, user: User) {
        try {
            const program = this.programRepository.create({
                ...createProgramDto,
                createdBy: user
            });
            await this.programRepository.save(program);
            return program;
        } catch (error) {
            this.handleException(error);
        }
    }

    findAll(paginationDto: PaginationDto) {
        const { limit, skip } = paginationDto;
        return this.programRepository.find({
            take: limit,
            skip: skip
        });
    }

    async findOne(term: string) {
        let program: Program | null;

        if (isUUID(term)) {
            program = await this.programRepository.findOne({
                where: { id: term },
                relations: { students: true }
            });
        } else {
            program = await this.programRepository.createQueryBuilder("program")
                .where("UPPER(program.name) = :name", { name: term.toUpperCase() })
                .leftJoinAndSelect("program.students", "students")
                .getOne();
        }

        if (!program) throw new NotFoundException(`Program ${term} not found`);

        return program;
    }

    async assignStudents(id: string, assignStudentsDto: AssignStudentsDto) {
        const program = await this.findOne(id);

        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const studentId of assignStudentsDto.studentIds) {
               
                // update() no dispara @BeforeUpdate, así el nickname del estudiante no cambia
                const result = await queryRunner.manager.update(Student, { id: studentId }, { program: { id: program.id  } });
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



    private handleException(error: any): never {
        if (error instanceof HttpException) throw error;

        if (error.code === '23505')
            throw new ConflictException(error.detail);

        this.logger.error(error);
        throw new InternalServerErrorException('Unexpected error, check server logs');
    }

    async createMany(dto: BulkCreateProgramDto, user: User) {
        const runner = this.datasource.createQueryRunner();
        await runner.connect();
        await runner.startTransaction();
        try {
            const created: Program[] = [];
            for (const details of dto.programs) {
                const program = runner.manager.create(Program, { ...details, createdBy: user });
                created.push(await runner.manager.save(Program, program));
            }
            await runner.commitTransaction();
            return created;
        } catch (error) {
            await runner.rollbackTransaction();
            this.handleException(error);
        } finally {
            await runner.release();
        }
    }

}
