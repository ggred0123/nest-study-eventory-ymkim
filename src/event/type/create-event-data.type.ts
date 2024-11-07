export type CreateEventData = {
  hostId: number;
  title: string;
  description: string;
  cityIds: number[];
  categoryId: number;
  startTime: Date;
  endTime: Date;
  maxPeople: number;
};
