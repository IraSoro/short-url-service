import { InferAttributes, InferCreationAttributes } from "sequelize";
import { Column, DataType, Index, Model, Table } from "sequelize-typescript";

@Table
export class Redirection extends Model<InferAttributes<Redirection>, InferCreationAttributes<Redirection>> {
    @Column({ type: DataType.STRING })
    declare ipAddress: string;

    @Index
    @Column({ type: DataType.STRING })
    declare shortUrl: string;
}
