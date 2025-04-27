import * as DB from "@prisma/client";

export const dateDayToWeekDay = (day: number): DB.WeekDay =>
  ({
    0: DB.WeekDay.SUNDAY,
    1: DB.WeekDay.MONDAY,
    2: DB.WeekDay.TUESDAY,
    3: DB.WeekDay.WEDNESDAY,
    4: DB.WeekDay.THURSDAY,
    5: DB.WeekDay.FRIDAY,
    6: DB.WeekDay.SATURDAY,
  })[day];
