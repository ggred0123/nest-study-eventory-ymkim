import { ReviewData } from "src/review/type/review-data.type";



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
  reviews:ReviewData[];

  eventJoin: {
    user:{
      id:number,
      name:string,
    }
  }[];

  
};
