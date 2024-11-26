import { WaitingStatus } from '@prisma/client';

export type ClubWaitingData = {
  id: number;
  clubId: number;
  userId: number;
  status: WaitingStatus;
};
