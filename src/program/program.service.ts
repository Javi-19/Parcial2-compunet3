import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Program } from './entities/program.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { PaginationDto } from 'src/student/dto/pagination.dto';
import { Student } from 'src/student/entities/student.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { AssignStudentsDto } from './dto/assign-students.dto';

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
    ){}

    async create(createProgramDto: CreateProgramDto, user: User){
        try{
            const program = this.programRepository.create({
                ...createProgramDto,
                createdBy: user
            });
            await this.programRepository.save(program);
            return program;
        }catch(error){
            this.handleException(error);
        }
    }

    findAll(paginationDto: PaginationDto){
        const { limit, skip } = paginationDto;
        return this.programRepository.find({
            take: limit,
            skip: skip
        });
    }

    async findOne(term: string){
        let program: Program | null;

        if(isUUID(term)){
            program = await this.programRepository.findOne({
                where: { id: term },
                relations: { students: true }
            });
        }else{
            program = await this.programRepository.createQueryBuilder("program")
                .where("UPPER(program.name) = :name", { name: term.toUpperCase() })
                .leftJoinAndSelect("program.students", "students")
                .getOne();
        }

        if(!program) throw new NotFoundException(`Program ${term} not found`);

        return program;
    }

    async addEstudents(id: string, assignStudentsDto: AssignStudentsDto){
        const club = await this.findOne(id);

        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try{
            for(const id of assignStudentsDto.studentIds){
                // update() no dispara @BeforeUpdate, así el nickname del estudiante no cambia
                const result = await queryRunner.manager.update(Student, { studentIds }, { program: { id } });
                if(!result.affected)
                    throw new NotFoundException(`Student with id ${studentIds} not found`);
            }

            const totalStudents = await queryRunner.manager.count(Student, { where: { program: { id } } });
            if(totalStudents > program.maxStudents)
                throw new BadRequestException(`Program ${program.name} only allows ${program.maxStudents} students`);

            await queryRunner.commitTransaction();
        }catch(error){
            await queryRunner.rollbackTransaction();
            this.handleException(error);
        }finally{
            await queryRunner.release();
        }

        return this.findOne(id);
    }

    async remove(id: string){
        const club = await this.findOne(id);
        await this.clubRepository.remove(club);
    }

    private handleException(error: any): never{
        if(error instanceof HttpException) throw error;

        if(error.code === '23505')
            throw new ConflictException(error.detail);

        this.logger.error(error);
        throw new InternalServerErrorException('Unexpected error, check server logs');
    }
async createMany(dto: CreateManyClubsDto, user: User) {
    const runner = this.datasource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
        const created: Club[] = [];
        for (const details of dto.clubs) {
            const club = runner.manager.create(Club, { ...details, createdBy: user });
            created.push(await runner.manager.save(Club, club));
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
