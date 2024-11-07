export type EventData = {
  id: number;
  hostId: number;
  title: string;
  cityIds: number[];
  description: string;
  categoryId: number;
  startTime: Date;
  endTime: Date;
  maxPeople: number;
};
