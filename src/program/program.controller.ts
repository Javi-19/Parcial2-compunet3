import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ProgramService } from './program.service';
import { BulkCreateProgramDto } from './dto/bulk-create-program.dto';
import { PaginationDto } from 'src/student/dto/pagination.dto';
import { Auth } from 'src/user/decorators/auth.decorator';
import { GetUser } from 'src/user/decorators/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { ValidRoles } from 'src/user/enums/valid-roles.enum';
import { CreateProgramDto } from './dto/create-program.dto';
import { AssignStudentsDto } from './dto/assign-students.dto';

@Controller('program')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  // TODO Reto 1: POST   /api/program               -> crear programa
  // TODO Reto 1: GET    /api/program               -> listar (paginado con PaginationDto)
  // TODO Reto 2: GET    /api/program/:id           -> programa con sus estudiantes
  // TODO Reto 2: PATCH  /api/program/:id/students  -> agregar estudiantes (acumulativo)
  // TODO Reto 3: POST   /api/program/bulk          -> crear programas en lote (todo o nada)
  // TODO Reto 4: proteger los POST y el PATCH para que solo un admin pueda usarlos

  @Post('bulk')
  @Auth(ValidRoles.admin)
  createManyPrograms(@Body() dto: BulkCreateProgramDto, @GetUser() user: User) {
    return this.programService.createMany(dto, user);
  }


  @Post()
  @Auth(ValidRoles.admin)
  create(@Body() createProgramDto: CreateProgramDto, @GetUser() user: User){
    return this.programService.create(createProgramDto, user);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto){
    return this.programService.findAll(paginationDto);
  }

 

  @Post(":id/students")
  @Auth(ValidRoles.admin)
  addStudents(@Param("id", ParseUUIDPipe) id: string, @Body() assignStudentsDto: AssignStudentsDto){
    return this.programService.assignStudents(id, assignStudentsDto);
  }


}
