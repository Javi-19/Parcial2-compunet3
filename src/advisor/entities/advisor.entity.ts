import { User } from "../../user/entities/user.entity";
import { Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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


    @ManyToOne(
        () => User,
        { nullable: true }
    )
    createdBy?: User;
}
