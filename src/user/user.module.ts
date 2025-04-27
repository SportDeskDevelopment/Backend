import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { InitiateRoleUseCase } from "./use-cases/initiate-role";

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, InitiateRoleUseCase],
  exports: [UserService],
})
export class UserModule {}
