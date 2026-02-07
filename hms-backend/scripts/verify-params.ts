
import { prisma } from "../src/prisma";
import { Role } from "../generated/prisma";
import { getQcScope } from "../src/utils/qcScope";

async function main() {
    try {
        console.log("--- VERIFY QC SCOPE LOGIC ---");

        // 1. Get User 'Ashu'
        const user = await prisma.user.findFirst({
            where: { name: { contains: 'ashu', mode: 'insensitive' } }
        });
        if (!user) { console.log("User not found"); return; }
        console.log(`User: ${user.name} (${user.id})`);

        // 2. Get Toilet 'Market'
        const toilet = await prisma.toilet.findFirst({
            where: { name: { contains: 'Market', mode: 'insensitive' } }
        });
        if (!toilet) { console.log("Toilet not found"); return; }
        console.log(`Toilet WardId: ${toilet.wardId}`);

        // 3. Get City & Module
        const cityId = toilet.cityId;
        const moduleId = (await prisma.module.findUnique({ where: { name: 'TOILET' } }))?.id;
        if (!moduleId) { console.log("Module not found"); return; }

        // 4. Run existing getQcScope
        const scope = await getQcScope({ userId: user.id, cityId, moduleId, roles: [Role.QC, Role.CITY_ADMIN] });
        console.log("Basic Scope:", JSON.stringify(scope, null, 2));

        // 5. Run Expansion Logic (Simulated)
        if (scope.zoneIds.length > 0) {
            console.log(`Expanding zones: ${scope.zoneIds.join(', ')}`);
            const childWards = await prisma.geoNode.findMany({
                where: { cityId, level: 'WARD', parentId: { in: scope.zoneIds } },
                select: { id: true, name: true, parentId: true }
            });
            console.log(`Found ${childWards.length} child wards`);
            childWards.forEach(w => console.log(` - Ward: ${w.name} (${w.id}) Parent: ${w.parentId}`));

            const ids = childWards.map(w => w.id);
            const expandedWardIds = Array.from(new Set([...scope.wardIds, ...ids]));

            // 6. Check Match
            const isMatch = expandedWardIds.includes(toilet.wardId!);
            console.log(`Does QC Scope cover Toilet Ward? ${isMatch ? "YES" : "NO"}`);
        } else {
            console.log("No zones to expand");
        }

    } catch (e) { console.error(e); } finally { await prisma.$disconnect(); }
}
main();
