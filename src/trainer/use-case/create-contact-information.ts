import { Injectable, Logger } from "@nestjs/common";
import * as DB from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { TrainerService } from "../trainer.service";
import { TrainerDto } from "../dto";

@Injectable()
export class PersistContactInformationUseCase {
  private readonly logger = new Logger(PersistContactInformationUseCase.name);
  private publicContactId: string;

  constructor(
    private readonly db: PrismaService,
    private readonly trainerService: TrainerService,
  ) {}

  async exec(command: TrainerDto.PersistContactInformation) {
    const trainer = await this.trainerService.validateTrainer(
      command.trainerId,
    );
    await this.createPublicContact(trainer, command);
    await this.updatePublicContact(trainer, command);
    await this.manageSocials(command);

    return {
      message: "Contact information saved successfully!",
    };
  }

  private async createPublicContact(
    trainer: DB.TrainerProfile,
    command: TrainerDto.PersistContactInformation,
  ) {
    if (trainer.publicContactId) return;

    const { publicContact } = await this.db.trainerProfile.update({
      where: { id: command.trainerId },
      data: {
        publicContact: {
          create: {
            emails: command.emails,
            phoneNumbers: command.phoneNumbers,
          },
        },
      },
      select: {
        publicContact: {
          select: {
            id: true,
          },
        },
      },
    });

    this.publicContactId = publicContact.id;
  }

  private async updatePublicContact(
    trainer: DB.TrainerProfile,
    command: TrainerDto.PersistContactInformation,
  ) {
    if (!trainer.publicContactId) return;

    this.publicContactId = trainer.publicContactId;

    await this.db.publicInfo.update({
      where: { id: trainer.publicContactId },
      data: {
        emails: command.emails,
        phoneNumbers: command.phoneNumbers,
        aboutMe: command.aboutMe,
      },
    });
  }

  private async manageSocials(command: TrainerDto.PersistContactInformation) {
    await this.db.publicInfo.update({
      where: { id: this.publicContactId },
      data: {
        socials: {
          deleteMany: {},
          create: command.socials?.map((s) => ({
            url: s.url,
            socialNetwork: {
              connect: { name: s.name },
            },
          })),
        },
      },
    });
  }
}
