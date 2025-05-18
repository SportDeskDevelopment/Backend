import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.enableCors({
  //   origin: "http://localhost:5174",
  //   credentials: true,
  //   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  //   allowedHeaders: ["Content-Type", "Authorization"],
  // });
  app.enableCors();
  app.use(cookieParser());
  app.setGlobalPrefix("api");
  const port = process.env.PORT || 5000;
  await app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
bootstrap();
