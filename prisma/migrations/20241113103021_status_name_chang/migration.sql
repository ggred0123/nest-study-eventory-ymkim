/*
  Warnings:

  - You are about to drop the column `watingStatus` on the `club_waiting` table. All the data in the column will be lost.
  - Added the required column `status` to the `club_waiting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "club_waiting" DROP COLUMN "watingStatus",
ADD COLUMN     "status" "WaitingStatus" NOT NULL;
