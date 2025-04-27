import { Ids } from "../../../kernel/ids";

export type MarkAttendanceByNotTrainerCommand = {
  trainerQrCodeKey: string;
  trainerId: Ids.TrainerId;
  username: string;
  trainingId?: Ids.TrainingId;
  subscriptionTraineeId?: Ids.SubscriptionTraineeId;
};
