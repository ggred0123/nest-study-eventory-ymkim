export type CreateEventData = {
  hostId: number;
  title: string;
  clubId?: number | null;
  description: string;
  cityIds: number[];
  categoryId: number;
  startTime: Date;
  endTime: Date;
  maxPeople: number;
};
