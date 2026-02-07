
import { prisma } from "../src/prisma";

async function main() {
    try {
        const toilet = await prisma.toilet.findFirst({
            where: { name: { contains: 'Market', mode: 'insensitive' } }
        });
        if (!toilet) { console.log("Toilet not found"); return; }

        console.log(`Toilet: ${toilet.name}`);
        console.log(`Toilet Ward ID: ${toilet.wardId}`);

        if (toilet.wardId) {
            const ward = await prisma.geoNode.findUnique({
                where: { id: toilet.wardId },
                include: { parent: true }
            });
            console.log(`Ward Name: ${ward?.name}`);
            console.log(`Ward Parent ID: ${ward?.parentId}`);
            console.log(`Ward Parent Name: ${ward?.parent?.name}`);
        }

        const user = await prisma.user.findFirst({
            where: { name: { contains: 'ashu', mode: 'insensitive' } },
            include: { cities: true }
        });
        const userZoneIds = user?.cities.flatMap(c => c.zoneIds) || [];
        console.log(`User Ashu Zone IDs: ${userZoneIds.join(', ')}`);

    } catch (e) { console.error(e); } finally { await prisma.$disconnect(); }
}
main();
