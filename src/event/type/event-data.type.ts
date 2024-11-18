export type EventData = {
  id: number;
  hostId: number;
  title: string;
  description: string;
  categoryId: number;
  startTime: Date;
  endTime: Date;
  maxPeople: number;
  eventCity: {
    id: number;
    cityId: number;
  }[];
  club: {
    id: number;
  } | null;
};
