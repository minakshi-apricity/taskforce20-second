import { PrismaClient, Role, GeoLevel, AreaType, ModuleRecordStatus } from "../generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // ===== 1. HMS =====
  const hms = await prisma.hMS.create({
    data: { name: "Rajasthan HMS" }
  });

  // ===== 2. Jaipur City =====
  const jaipur = await prisma.city.create({
    data: {
      name: "Jaipur",
      code: "JPR",
      hmsId: hms.id
    }
  });

  // ===== 3. Modules =====
  const sweepingModule = await prisma.module.create({
    data: { name: "SWEEPING", displayName: "Sweeping Module" }
  });

  await prisma.cityModule.create({
    data: {
      cityId: jaipur.id,
      moduleId: sweepingModule.id
    }
  });

  // ===== 4. Users =====
  const hashedPassword = await bcrypt.hash("Password@123", 10);

  const cityAdmin = await prisma.user.create({
    data: {
      name: "Jaipur City Admin",
      email: "admin@jaipur.com",
      password: hashedPassword
    }
  });

  const qcUser = await prisma.user.create({
    data: {
      name: "Jaipur QC Officer",
      email: "qc@jaipur.com",
      password: hashedPassword
    }
  });

  await prisma.userCity.createMany({
    data: [
      {
        userId: cityAdmin.id,
        cityId: jaipur.id,
        role: Role.CITY_ADMIN
      },
      {
        userId: qcUser.id,
        cityId: jaipur.id,
        role: Role.QC
      }
    ]
  });

  // ===== 5. Zones & Wards =====
  const zones = [];
  for (let i = 1; i <= 3; i++) {
    const zone = await prisma.geoNode.create({
      data: {
        name: `Zone ${i}`,
        level: GeoLevel.ZONE,
        path: `zone-${i}`,
        cityId: jaipur.id
      }
    });
    zones.push(zone);

    for (let w = 1; w <= 3; w++) {
      await prisma.geoNode.create({
        data: {
          name: `Zone ${i} - Ward ${w}`,
          level: GeoLevel.WARD,
          path: `zone-${i}/ward-${w}`,
          parentId: zone.id,
          cityId: jaipur.id
        }
      });
    }
  }

  // ===== 6. Beats =====
  const beats = [];

  for (let i = 1; i <= 5; i++) {
    const beat = await prisma.cityAreaBeat.create({
      data: {
        cityId: jaipur.id,
        zoneId: zones[0].id,
        wardId: zones[0].id,
        areaId: zones[0].id,
        beatName: `Beat ${i}`
      }
    });
    beats.push(beat);
  }

  // ===== 7. Sample Sweeping Records =====
  for (let i = 0; i < 50; i++) {
    await prisma.sweepingRecord.create({
      data: {
        cityId: jaipur.id,
        createdBy: cityAdmin.id,
        areaType: AreaType.RESIDENTIAL,
        status: i % 3 === 0
          ? ModuleRecordStatus.APPROVED
          : i % 3 === 1
          ? ModuleRecordStatus.SUBMITTED
          : ModuleRecordStatus.REJECTED,
        payload: { roadLength: Math.floor(Math.random() * 500) },
        sweepDate: new Date(),
        submittedAt: new Date(),
        beatId: beats[i % beats.length].id,
        reviewedById: qcUser.id,
        reviewedAt: new Date(),
        qcRemark: "Checked"
      }
    });
  }

  console.log("✅ Jaipur seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });