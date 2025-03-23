import { InferAttributes, InferCreationAttributes } from "sequelize";
import { Column, PrimaryKey, Table, Model, DataType } from "sequelize-typescript";

@Table
export class Url extends Model<InferAttributes<Url>, InferCreationAttributes<Url>> {
  @PrimaryKey
  @Column({ type: DataType.STRING, allowNull: false })
  declare shortUrl: string;

  @Column({ type: DataType.STRING, allowNull: false, })
  declare originalUrl: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0, allowNull: false })
  declare clickCount: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare expiresAt?: Date;
}
