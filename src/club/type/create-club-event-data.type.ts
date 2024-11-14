export type CreateClubEventData = {
  hostId: number;
  clubId?: number | null;
  title: string;
  description: string;
  cityIds: number[];
  categoryId: number;
  startTime: Date;
  endTime: Date;
  maxPeople: number;
};
