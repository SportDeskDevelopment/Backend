import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { EmailModule } from "./email/email.module";
import { PrismaModule } from "./prisma/prisma.module";
import { envConfig } from "./config/config.env";
import { TrainerModule } from './trainer/trainer.module';
import { TrainingModule } from './training/training.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    PrismaModule,
    AuthModule,
    EmailModule,
    TrainerModule,
    TrainingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
