
import { prisma } from "../src/prisma";

async function main() {
    try {
        const user = await prisma.user.findFirst({ where: { name: { contains: 'ashu', mode: 'insensitive' } }, include: { cities: true } });
        const toilet = await prisma.toilet.findFirst({ where: { name: { contains: 'Market', mode: 'insensitive' } } });

        if (!user || !toilet) { console.log("Missing data"); return; }

        const userZoneIds = user.cities.flatMap(c => c.zoneIds);
        const wardId = toilet.wardId;
        let wardParentId = null;

        if (wardId) {
            const w = await prisma.geoNode.findUnique({ where: { id: wardId } });
            wardParentId = w?.parentId;
        }

        console.log("JSON_START");
        console.log(JSON.stringify({
            user: user.name,
            userZoneIds,
            toiletName: toilet.name,
            toiletWardId: wardId,
            wardParentId
        }));
        console.log("JSON_END");

    } catch (e) { console.error(e); } finally { await prisma.$disconnect(); }
}
main();
