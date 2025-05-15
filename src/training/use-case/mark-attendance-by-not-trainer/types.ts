import { Ids } from "../../../kernel/ids";

export type MarkAttendanceByNotTrainerCommand = {
  trainerQrCodeKey: string;
  trainerUsername: Ids.TrainerUsername;

  // *** trainee mark attendance for himself
  traineeUsername?: Ids.TraineeUsername;
  trainingId?: Ids.TrainingId;
  subscriptionTraineeId?: Ids.SubscriptionTraineeId;
  // ***

  // *** parent mark attendance for children
  childrenTrainings?: {
    trainingId?: Ids.TrainingId;
    childId: Ids.ParentTraineeLinkId;
    subscriptionTraineeId?: Ids.SubscriptionTraineeId;
  }[];
  // ***
};
