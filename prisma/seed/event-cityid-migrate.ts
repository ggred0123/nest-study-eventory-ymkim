/* import { PrismaClient } from '@prisma/client';

type CreateEventCityId ={
    eventId: number;
    cityId: number;
}

async function main() {
    const prisma = new PrismaClient();

    const events = await prisma.event.findMany();

   const data: CreateEventCityId[] = events.map((event) => {
        return {
            eventId: event.id,
            cityId: event.cityId,
        };
    }
    );
    console.log(data);

    await prisma.eventCity.createMany({
        data,
    });

}
main();*/