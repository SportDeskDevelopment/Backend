import { Brand } from "../../shared/lib/typescript";

export type UserId = Brand<string, "UserId">;
export type TrainerId = Brand<string, "TrainerId">;
export type TrainingId = Brand<string, "TrainingId">;
export type SubscriptionId = Brand<string, "SubscriptionId">;
export type SubscriptionTraineeId = Brand<string, "SubscriptionTraineeId">;
export type GroupId = Brand<string, "GroupId">;
export type TraineeId = Brand<string, "TraineeId">;
export type AttendanceId = Brand<string, "AttendanceId">;
export type ParentId = Brand<string, "ParentId">;
export type ParentTraineeLinkId = Brand<string, "ParentTraineeLinkId">;

// Usernames
export type Username = Brand<string, "Username">;
export type TrainerUsername = Brand<string, "TrainerUsername">;
export type TraineeUsername = Brand<string, "TraineeUsername">;
export type ParentUsername = Brand<string, "ParentUsername">;
