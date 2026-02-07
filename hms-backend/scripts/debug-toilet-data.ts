
import { prisma } from "../src/prisma";

async function main() {
    try {
        console.log("--- DEBUG START ---");

        // 1. Find User 'Ashu'
        const user = await prisma.user.findFirst({
            where: { name: { contains: 'ashu', mode: 'insensitive' } },
            include: { cities: true, modules: true }
        });

        if (user) {
            console.log(`User: ${user.name}`);
            console.log("CityRoles:", user.cities.map(c => ({ role: c.role, z: c.zoneIds, w: c.wardIds })));
            console.log("ModuleRoles:", user.modules.map(m => ({ module: m.moduleId, role: m.role, z: m.zoneIds, w: m.wardIds })));
        } else { console.log("User Ashu not found"); }

        // 2. Find Toilet
        const toilet = await prisma.toilet.findFirst({
            where: { name: { contains: 'Market', mode: 'insensitive' } }
        });

        if (toilet) {
            console.log(`Toilet: ${toilet.name}, ID: ${toilet.id}`);
            console.log(`T_WardId: ${toilet.wardId}, T_ZoneId: ${toilet.zoneId}`);

            if (toilet.wardId) {
                const ward = await prisma.geoNode.findUnique({ where: { id: toilet.wardId }, include: { parent: true } });
                console.log(`Ward: ${ward?.name} (${ward?.id})`);
                console.log(`WardParent (Zone): ${ward?.parent?.name} (${ward?.parent?.id})`);
            }
        } else { console.log("Toilet not found"); }

        console.log("--- DEBUG END ---");
    } catch (e) { console.error(e); } finally { await prisma.$disconnect(); }
}
main();
