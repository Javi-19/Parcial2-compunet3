import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common';
import { AdvisorService } from './advisor.service';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { GetUser } from '../user/decorators/get-user.decorator';
import { Auth } from '../user/decorators/auth.decorator';
import { ValidRoles } from '../user/enums/valid-roles.enum';
import { User } from '../user/entities/user.entity';
import { PaginationDto } from '../student/dto/pagination.dto';
import { AssignStudentsDto } from '../program/dto/assign-students.dto';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';


@Controller('advisor')
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) { }

  @Post()
  @Auth(ValidRoles.admin)
  create(@Body() createAdvisorDto: CreateAdvisorDto, @GetUser() user: User) {
    return this.advisorService.create(createAdvisorDto, user);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.advisorService.findAll(paginationDto);
  }


  @Get(':id')
  find(@Param('id', ParseUUIDPipe) id: string) {
    return this.advisorService.findOne(id);
  }

  @Patch(':id/students')
  @Auth(ValidRoles.admin)
  assignStudents(@Param("id", ParseUUIDPipe) id: string, @Body() assignStudentsDto: AssignStudentsDto) {
    return this.advisorService.assignStudents(id, assignStudentsDto);
  }

  @Auth(ValidRoles.admin)
  @ApiOperation({ summary: "Delete a advisor", description: "Requires the admin role" })
  @ApiParam({ name: "id", description: "advisor id (UUID)", format: "uuid" })
  @ApiOkResponse({ description: "advisor was deleted" })
  @ApiNotFoundResponse({ description: "advisor not found" })
  @Delete(':advisorId/students/:studentId')
  remove(
    @Param('advisorId', ParseUUIDPipe) advisorId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string
  ) {
    return this.advisorService.removeAdvisor(advisorId, studentId);
  }
}
