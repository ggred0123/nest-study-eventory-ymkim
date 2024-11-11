export type EventData = {
  id: number;
  hostId: number;
  cityIds: number[];
  title: string;
  description: string;
  categoryId: number;
  startTime: Date;
  endTime: Date;
  maxPeople: number;
};
