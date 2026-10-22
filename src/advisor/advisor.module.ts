import { Module } from '@nestjs/common';
import { AdvisorService } from './advisor.service';
import { AdvisorController } from './advisor.controller';
import { Advisor } from './entities/advisor.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [AdvisorController],
  imports: [TypeOrmModule.forFeature([Advisor]),
  UserModule
],
  providers: [AdvisorService],
})
export class AdvisorModule {}
