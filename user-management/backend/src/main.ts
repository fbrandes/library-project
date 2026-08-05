import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

const port = Number(process.env.USER_MANAGEMENT_PORT ?? 8080);
const app = await NestFactory.create(AppModule);
app.enableCors();
await app.listen(port);
