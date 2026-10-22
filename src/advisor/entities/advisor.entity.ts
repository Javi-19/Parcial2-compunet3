import { Student } from "../../student/entities/student.entity";
import { User } from "../../user/entities/user.entity";
import { Column, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export class Advisor {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("text")
    fullName: string;

    @Column({
        type: "text",
        unique: true
    })
    email: string;

    @Column("text")
    office: string;


    @OneToMany(
        () => Student,
        (student) => student.advisor
    )
    students?: Student[];

    @ManyToOne(
        () => User,
        { nullable: true }
    )
    createdBy?: User;
}
