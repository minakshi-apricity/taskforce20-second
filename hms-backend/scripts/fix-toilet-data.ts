
import { prisma } from "../src/prisma";

async function main() {
    try {
        console.log("--- FIX TOILET DATA ---");

        // 1. Get QC 'Ashu'
        const qc = await prisma.user.findFirst({
            where: { name: { contains: 'ashu', mode: 'insensitive' } },
            include: { cities: true }
        });
        if (!qc) { console.log("QC Ashu not found"); return; }

        // Assume the first zone in the list is the target zone (usually only 1 is assigned)
        const targetZoneId = qc.cities.flatMap(c => c.zoneIds)[0];
        if (!targetZoneId) { console.log("QC has no zone assigned"); return; }
        console.log(`QC Target Zone ID: ${targetZoneId}`);

        // 2. Get Employee 'Gansh'
        const emp = await prisma.user.findFirst({
            where: { name: { contains: 'gansh', mode: 'insensitive' } }
        });
        if (!emp) { console.log("Employee Gansh not found"); return; }
        console.log(`Employee ID: ${emp.id}`);

        // 3. Find Toilets by Gansh
        const toilets = await prisma.toilet.findMany({
            where: { requestedById: emp.id }
        });
        console.log(`Found ${toilets.length} toilets by Gansh`);

        // 4. Update them to have the Target Zone ID
        const update = await prisma.toilet.updateMany({
            where: {
                id: { in: toilets.map(t => t.id) }
            },
            data: {
                zoneId: targetZoneId
            }
        });

        console.log(`Updated ${update.count} toilets to Zone ${targetZoneId}`);

    } catch (e) { console.error(e); } finally { await prisma.$disconnect(); }
}
main();
