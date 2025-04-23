import { TrainerProfile } from "./../dto/objects/trainerProfile";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateContactInformation } from "../dto/objects";

@Injectable()
export class CreateContactInformationUseCase {
  private readonly logger = new Logger(CreateContactInformationUseCase.name);

  constructor(private readonly db: PrismaService) {}
  //TODO CHECK IF IT IS ALREADY CREATED
  async exec(command: CreateContactInformation) {
    const trainer = await this.db.trainerProfile.findUnique({
      where: { id: command.trainerId },
    });

    if (!trainer) {
      throw new NotFoundException("Trainer not found");
    }

    if (trainer.publicContactId) {

      // if(command.socials.length > 0) {
      //   await this.db.publicSocialNetwork.upsert({
      //     where: {
      //       id: trainer.publicContactId,
      //     },
      //     data: command.socials.map((s) => ({
      //       url: s.url,
      //       socialNetwork: {
      //         connect: { name: s.name },
      //       },
      //     })),
      //   });
      // }
      await this.db.publicContact.update({
        where: { id: trainer.publicContactId },
        data: {
          emails: command.emails,
          phoneNumbers: command.phoneNumbers,
          socials: {
            create: command.socials.map((s) => ({
              url: s.url,
              socialNetwork: {
                connect: { name: s.name },
              },
            })),
          },
        },
      });
    } else {

    await this.db.trainerProfile.update({
      where: { id: trainer.id },
      data: {
        publicContact: {
          create: {
            emails: command.emails,
            phoneNumbers: command.phoneNumbers,
            socials: {
              create: command.socials.map((s) => ({
                url: s.url,
                socialNetwork: {
                  connect: { name: s.name },
                },
              })),
            },
          },
          update: {
            emails: command.emails,
            phoneNumbers: command.phoneNumbers,
            socials: {
              create: command.socials.map((s) => ({
                url: s.url,
                socialNetwork: {
                  connect: { name: s.name },
                },
              })),
            },
          },
        },
      },
    });

    return {
      message: "Social networks created successfully!",
    };
  }
}
