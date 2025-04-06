export function addMinutes(date: Date | string | number, minutes: number) {
  const newDate = new Date(date);
  newDate.setMinutes(newDate.getMinutes() + minutes);
  return newDate;
}
