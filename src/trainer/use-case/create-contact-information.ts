import { Injectable, Logger } from "@nestjs/common";
import * as DB from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateContactInformation } from "../dto/objects";
import { TrainerService } from "../trainer.service";

@Injectable()
export class CreateContactInformationUseCase {
  private readonly logger = new Logger(CreateContactInformationUseCase.name);
  private publicContactId: string;

  constructor(
    private readonly db: PrismaService,
    private readonly trainerService: TrainerService,
  ) {}

  async exec(command: CreateContactInformation) {
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
    command: CreateContactInformation,
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
    command: CreateContactInformation,
  ) {
    if (!trainer.publicContactId) return;

    this.publicContactId = trainer.publicContactId;

    await this.db.publicContact.update({
      where: { id: trainer.publicContactId },
      data: {
        emails: command.emails,
        phoneNumbers: command.phoneNumbers,
      },
    });
  }

  private async manageSocials(command: CreateContactInformation) {
    await this.db.publicContact.update({
      where: { id: this.publicContactId },
      data: {
        socials: {
          deleteMany: {
            // publicContactId: trainer.publicContactId,
          },
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
