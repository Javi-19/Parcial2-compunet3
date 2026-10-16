// TODO Reto 2: reglas de validación con class-validator
//   - studentIds: arreglo NO vacío, cada elemento debe ser un UUID
import { ArrayNotEmpty, IsArray, IsEmail, IsUUID } from "class-validator";
export class AssignStudentsDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID("all", { each: true, })
    studentIds: string[];
}
