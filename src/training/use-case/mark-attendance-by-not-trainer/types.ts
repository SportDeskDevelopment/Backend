import { Ids } from "../../../kernel/ids";

export type MarkAttendanceByNotTrainerCommand = {
  trainerQrCodeKey: string;
  trainerUsername: Ids.TrainerUsername;

  // username of the user who is marking the attendance (trainee or parent)
  username: Ids.Username;

  // *** trainee mark attendance for himself
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
