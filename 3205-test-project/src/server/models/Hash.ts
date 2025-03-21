import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Url } from "./Url.ts";
import { InferAttributes, InferCreationAttributes } from "sequelize";

@Table
export class Hash extends Model<InferAttributes<Hash>, InferCreationAttributes<Hash>> {
  @PrimaryKey
  @Column({ type: DataType.STRING })
  declare hash: string;

  @ForeignKey(() => Url)
  @Column({ type: DataType.STRING })
  declare shortUrl: string;

  @BelongsTo(() => Url)
  url!: Url;
}
