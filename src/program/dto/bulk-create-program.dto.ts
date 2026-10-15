// TODO Reto 3: reglas de validación con class-validator / class-transformer
//   - programs: arreglo NO vacío de CreateProgramDto
//   - cada elemento se debe validar con las mismas reglas de CreateProgramDto

import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray, ValidateNested } from "class-validator";
import { CreateProgramDto } from "./create-program.dto";

//     (pista: @ValidateNested({ each: true }) + @Type(() => CreateProgramDto))
export class BulkCreateProgramDto {
    @IsArray()
    @ArrayNotEmpty()
    @ArrayMaxSize(10)
    @ArrayUnique((program: CreateProgramDto) => program.name)
    @ValidateNested({ each: true })
    @Type(() => CreateProgramDto)
    programs: CreateProgramDto[];
}
