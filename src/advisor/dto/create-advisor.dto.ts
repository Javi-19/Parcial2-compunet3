import { IsEmail, IsString, Matches, MinLength } from "class-validator";

export class CreateAdvisorDto {

    @IsString()
    @MinLength(5)
    fullname: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @Matches(/^[A-Z]\d{3}$/)
    office: string;
}
