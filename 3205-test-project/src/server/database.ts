import { Sequelize } from "sequelize-typescript";
import { Hash } from "./models/Hash.ts";
import { Redirection } from "./models/Redirection.ts";
import { Url } from "./models/Url.ts";

const sequelize = new Sequelize(
  {
    database: "postgres",
    dialect: "postgres",
    host: "localhost",
    username: "admin",
    password: "admin",
    logging: false,
    models: [
      Hash,
      Redirection,
      Url
    ],
  }
);

export async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Connected to PostgreSQL");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}
