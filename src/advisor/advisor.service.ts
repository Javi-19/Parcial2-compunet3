import { Injectable } from '@nestjs/common';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { UpdateAdvisorDto } from './dto/update-advisor.dto';

@Injectable()
export class AdvisorService {
  create(createAdvisorDto: CreateAdvisorDto) {
    return 'This action adds a new advisor';
  }

  findAll() {
    return `This action returns all advisor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} advisor`;
  }

  update(id: number, updateAdvisorDto: UpdateAdvisorDto) {
    return `This action updates a #${id} advisor`;
  }

  remove(id: number) {
    return `This action removes a #${id} advisor`;
  }
}
