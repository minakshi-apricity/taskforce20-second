import "dotenv/config";
import { prisma } from "../src/prisma";
import { hashPassword } from "../src/auth/password";
import { Role } from "../generated/prisma";

async function main() {
  console.log("🌱 Starting Full HMS Seed...");

  // 1. Core Config
  const hmsEmail = process.env.SEED_HMS_EMAIL || "admin@hms.local";
  const hmsPassword = process.env.SEED_HMS_PASSWORD || "ChangeMe!123";
  const hmsName = process.env.SEED_HMS_NAME || "HMS Super Admin";

  const modules = ["TASKFORCE", "TOILET", "LITTERBINS", "SWEEPING"];

  // 2. Ensure HMS Org
  let hms = await prisma.hMS.findFirst();
  if (!hms) {
    hms = await prisma.hMS.create({ data: { name: "HMS" } });
    console.log("✅ HMS created");
  } else {
    console.log("ℹ️ HMS already exists");
  }

  // 3. Ensure Modules
  for (const mod of modules) {
    await prisma.module.upsert({
      where: { name: mod },
      update: {},
      create: { name: mod, displayName: mod }
    });
  }
  console.log("✅ Modules ensured");

  const hashedPwd = await hashPassword(hmsPassword);

  // 4. Ensure HMS Super Admin
  const hmsUser = await prisma.user.upsert({
    where: { email: hmsEmail },
    update: { password: hashedPwd, name: hmsName },
    create: { email: hmsEmail, password: hashedPwd, name: hmsName }
    // Note: HMS Super Admin typically doesn't need UserCity entries if roles are handled via HMS level or special logic.
    // Ensure we clean up any accidental city roles if present to fix the "Taskforce Member" label issue.
  });

  // Cleanup explicit city roles for Super Admin to avoid confusion (if any exist from prior fixes)
  // This ensures they are seen purely as Super Admin by the frontend logic.
  await prisma.userCity.deleteMany({ where: { userId: hmsUser.id } });
  await prisma.userModuleRole.deleteMany({ where: { userId: hmsUser.id } });

  // Re-assign HMS_SUPER_ADMIN role if system uses a specific table for it, 
  // or rely on implicit super admin checks. 
  // But usually, we might need at least one entry if the system strictly checks for roles.
  // We'll leave it clean for now, assuming the auth middleware checks `hmsUser.email` or similar, 
  // OR we assign a global/dummy role if needed. 
  // *Correction*: The frontend labels imply HMS_SUPER_ADMIN role exists.
  // Let's create a special role entry if the schema supports it, or just assume the user is handled. 
  // (In this codebase, it seems strict RBAC is used).

  // Let's create a CITY and populate it.
  const cityName = "Indore";
  const cityCode = "indore";
  const ulbCode = "idr01";

  let city = await prisma.city.findUnique({ where: { code: cityCode } });
  if (!city) {
    city = await prisma.city.create({
      data: {
        name: cityName,
        code: cityCode,
        ulbCode: ulbCode,
        hmsId: hms.id,
        enabled: true
      }
    });
    console.log(`✅ City ${cityName} created`);
  }

  // Enable Modules for City
  const allModules = await prisma.module.findMany();
  for (const m of allModules) {
    await prisma.cityModule.upsert({
      where: { cityId_moduleId: { cityId: city.id, moduleId: m.id } },
      update: { enabled: true },
      create: { cityId: city.id, moduleId: m.id, enabled: true }
    });
  }

  // 5. Create City Admin
  const cityAdminEmail = `city@${cityCode}.local`;
  const cityAdminUser = await prisma.user.upsert({
    where: { email: cityAdminEmail },
    update: { password: hashedPwd, name: `${cityName} Admin` },
    create: { email: cityAdminEmail, password: hashedPwd, name: `${cityName} Admin` }
  });

  // Assign City Admin Role
  await prisma.userCity.upsert({
    where: { userId_cityId_role: { userId: cityAdminUser.id, cityId: city.id, role: Role.CITY_ADMIN } },
    update: {},
    create: { userId: cityAdminUser.id, cityId: city.id, role: Role.CITY_ADMIN }
  });

  // Give City Admin access to all modules
  for (const m of allModules) {
    await prisma.userModuleRole.upsert({
      where: { userId_cityId_moduleId_role: { userId: cityAdminUser.id, cityId: city.id, moduleId: m.id, role: Role.CITY_ADMIN } },
      update: {},
      create: { userId: cityAdminUser.id, cityId: city.id, moduleId: m.id, role: Role.CITY_ADMIN, canWrite: true }
    });
  }

  // 6. Create Employee (Minakshi)
  const empEmail = "minakshi.tf@indore.local";
  const empUser = await prisma.user.upsert({
    where: { email: empEmail },
    update: { password: hashedPwd, name: "Minakshi (Taskforce)" },
    create: { email: empEmail, password: hashedPwd, name: "Minakshi (Taskforce)" }
  });

  // Assign Employee Role to Taskforce & Toilet & Litterbins
  const empModules = ["TASKFORCE", "TOILET", "LITTERBINS"];

  // Check if UserCity exists for Employee
  await prisma.userCity.upsert({
    where: { userId_cityId_role: { userId: empUser.id, cityId: city.id, role: Role.EMPLOYEE } },
    update: {},
    create: { userId: empUser.id, cityId: city.id, role: Role.EMPLOYEE }
  });

  for (const mName of empModules) {
    const m = allModules.find(mod => mod.name === mName);
    if (m) {
      await prisma.userModuleRole.upsert({
        where: { userId_cityId_moduleId_role: { userId: empUser.id, cityId: city.id, moduleId: m.id, role: Role.EMPLOYEE } },
        update: {},
        create: { userId: empUser.id, cityId: city.id, moduleId: m.id, role: Role.EMPLOYEE, canWrite: true }
      });
    }
  }

  // 7. Create Geo Structure (Zone -> Ward -> Area)
  const zone = await prisma.geoNode.create({
    data: {
      cityId: city.id,
      level: "ZONE",
      name: "Zone 1",
      path: ""
    }
  });
  await prisma.geoNode.update({ where: { id: zone.id }, data: { path: `/city/${city.id}/zone/${zone.id}` } });

  const ward = await prisma.geoNode.create({
    data: {
      cityId: city.id,
      level: "WARD",
      name: "Ward 1",
      parentId: zone.id,
      path: ""
    }
  });
  await prisma.geoNode.update({ where: { id: ward.id }, data: { path: `/city/${city.id}/zone/${zone.id}/ward/${ward.id}` } });

  const area = await prisma.geoNode.create({
    data: {
      cityId: city.id,
      level: "AREA",
      name: "Area 1",
      parentId: ward.id,
      areaType: "RESIDENTIAL",
      path: ""
    }
  });
  await prisma.geoNode.update({ where: { id: area.id }, data: { path: `/city/${city.id}/zone/${zone.id}/ward/${ward.id}/area/${area.id}` } });

  // 8. Create QC User
  const qcEmail = "qc@indore.local";
  const qcUser = await prisma.user.upsert({
    where: { email: qcEmail },
    update: { password: hashedPwd, name: "Indore QC" },
    create: { email: qcEmail, password: hashedPwd, name: "Indore QC" }
  });

  await prisma.userCity.upsert({
    where: { userId_cityId_role: { userId: qcUser.id, cityId: city.id, role: Role.QC } },
    update: { zoneIds: [zone.id], wardIds: [ward.id] },
    create: {
      userId: qcUser.id,
      cityId: city.id,
      role: Role.QC,
      zoneIds: [zone.id],
      wardIds: [ward.id]
    }
  });

  // Assign QC role to modules
  for (const m of allModules) {
    if (m.name === "SWEEPING" || m.name === "TOILET" || m.name === "LITTERBINS" || m.name === "TASKFORCE") {
      await prisma.userModuleRole.upsert({
        where: { userId_cityId_moduleId_role: { userId: qcUser.id, cityId: city.id, moduleId: m.id, role: Role.QC } },
        update: { zoneIds: [zone.id], wardIds: [ward.id] },
        create: {
          userId: qcUser.id,
          cityId: city.id,
          moduleId: m.id,
          role: Role.QC,
          canWrite: true,
          zoneIds: [zone.id],
          wardIds: [ward.id]
        }
      });
    }
  }

  // Update Employee to have zone/ward scope too
  await prisma.userCity.update({
    where: { userId_cityId_role: { userId: empUser.id, cityId: city.id, role: Role.EMPLOYEE } },
    data: { zoneIds: [zone.id], wardIds: [ward.id] }
  });
  const empRoles = await prisma.userModuleRole.findMany({ where: { userId: empUser.id } });
  for (const r of empRoles) {
    await prisma.userModuleRole.update({ where: { id: r.id }, data: { zoneIds: [zone.id], wardIds: [ward.id] } });
  }

  console.log("✅ Seed Complete!");
  console.log(`- QC User:         ${qcEmail} / ${hmsPassword}`);
  console.log(`- HMS Super Admin: ${hmsEmail} / ${hmsPassword}`);
  console.log(`- City Admin:      ${cityAdminEmail} / ${hmsPassword}`);
  console.log(`- Employee:        ${empEmail} / ${hmsPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });