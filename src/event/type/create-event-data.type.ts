export type CreateEventData = {
  hostId: number;
  title: string;
  description: string;
  categoryId: number;
  startTime: Date;
  endTime: Date;
  maxPeople: number;
};
