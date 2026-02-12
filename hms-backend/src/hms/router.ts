import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { authenticate } from "../middleware/auth";
import { requireRoles, requireCityAccess } from "../middleware/rbac";
import { validateBody } from "../utils/validation";
import { Role } from "../../generated/prisma";
import { HttpError } from "../utils/errors";
import { hashPassword } from "../auth/password";
import { syncAllCityModules, syncCityModules } from "../utils/cityModuleSync";

const router = Router();
router.use(authenticate, requireRoles([Role.HMS_SUPER_ADMIN]));

const citySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  ulbCode: z.string().min(1)
});

import { CANONICAL_MODULE_KEYS, isCanonicalModuleKey, normalizeModuleKey } from "../modules/moduleMetadata";

const DEFAULT_MODULES = [...CANONICAL_MODULE_KEYS];

async function ensureModulesExist(): Promise<{ id: string; name: string }[]> {
  const existing = await prisma.module.findMany({ orderBy: { name: "asc" } });
  if (!existing.length) {
    const seeded = await Promise.all(
      DEFAULT_MODULES.map((m) =>
        prisma.module.upsert({
          where: { name: m },
          update: { isActive: true },
          create: { name: m, isActive: true }
        })
      )
    );
    return seeded;
  }

  // Ensure canonical modules are present even if legacy ones exist
  const ensured = await Promise.all(
    DEFAULT_MODULES.map((m) =>
      prisma.module.upsert({
        where: { name: m },
        update: { isActive: true },
        create: { name: m, isActive: true }
      })
    )
  );
  return ensured;
}

router.get("/cities", async (_req, res, next) => {
  try {
    const cities = await prisma.city.findMany({
      include: {
        modules: { include: { module: true } },
        users: { include: { user: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({
      cities: cities.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        ulbCode: c.ulbCode,
        enabled: c.enabled,
        cityAdmin: c.users.find((u) => u.role === Role.CITY_ADMIN)
          ? {
            id: c.users.find((u) => u.role === Role.CITY_ADMIN)?.userId || "",
            name: c.users.find((u) => u.role === Role.CITY_ADMIN)?.user.name || "",
            email: c.users.find((u) => u.role === Role.CITY_ADMIN)?.user.email || ""
          }
          : null,
        modules: c.modules
          .filter((m) => isCanonicalModuleKey((m as any).module.name))
          .map((m) => ({
            id: m.moduleId,
            name: (m as any).module.name,
            enabled: m.enabled
          }))
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.post("/cities", validateBody(citySchema), async (req, res, next) => {
  try {
    const { name, code, ulbCode } = req.body as z.infer<typeof citySchema>;
    const hms = await prisma.hMS.findFirst({ where: { name: "HMS" } });
    if (!hms) throw new HttpError(400, "HMS org missing");
    const activeModules = await ensureModulesExist();
    const existing = await prisma.city.findFirst({ where: { OR: [{ code }, { ulbCode }] } });
    if (existing) throw new HttpError(400, "City code or ULB code already exists");

    const city = await prisma.city.create({
      data: {
        name,
        code,
        ulbCode,
        hmsId: hms.id,
        enabled: true
      } as any
    });

    await syncCityModules(city.id);

    res.json({ city });
  } catch (err) {
    next(err);
  }
});

router.patch("/cities/:cityId", async (req, res, next) => {
  try {
    const cityId = req.params.cityId;
    const { name, code, ulbCode, enabled, adminName, adminEmail } = req.body;

    if (name === undefined && code === undefined && ulbCode === undefined && enabled === undefined && adminName === undefined && adminEmail === undefined) {
      throw new HttpError(400, "No fields to update provided");
    }

    if (code || ulbCode) {
      const existing = await prisma.city.findFirst({
        where: {
          OR: [
            ...(code ? [{ code }] : []),
            ...(ulbCode ? [{ ulbCode }] : [])
          ],
          NOT: { id: cityId }
        }
      });
      if (existing) throw new HttpError(400, "City code or ULB code already exists");
    }

    // Update City Admin if requested
    if (adminName !== undefined || adminEmail !== undefined) {
      const cityAdminLink = await prisma.userCity.findFirst({
        where: { cityId, role: Role.CITY_ADMIN },
        include: { user: true }
      });

      if (!cityAdminLink) {
        throw new HttpError(400, "No City Admin found for this city to update");
      }

      if (adminEmail && adminEmail !== cityAdminLink.user.email) {
        const emailExists = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (emailExists) throw new HttpError(400, "Email already in use by another user");
      }

      await prisma.user.update({
        where: { id: cityAdminLink.userId },
        data: {
          ...(adminName ? { name: adminName } : {}),
          ...(adminEmail ? { email: adminEmail } : {})
        }
      });
    }

    const city = await prisma.city.update({
      where: { id: cityId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(ulbCode !== undefined ? { ulbCode } : {}),
        ...(typeof enabled === "boolean" ? { enabled } : {})
      }
    });
    res.json({ city });
  } catch (err) {
    next(err);
  }
});

router.patch("/cities/:cityId/modules/:moduleId", async (req, res, next) => {
  try {
    const cityId = req.params.cityId as string;
    const moduleId = req.params.moduleId as string;
    const moduleExists = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!moduleExists) throw new HttpError(404, "Module not found");
    const enabled = req.body?.enabled ?? true;
    const cityModule = await prisma.cityModule.upsert({
      where: { cityId_moduleId: { cityId, moduleId } },
      create: { cityId, moduleId, enabled },
      update: { enabled }
    });
    res.json({ cityModule });
  } catch (err) {
    next(err);
  }
});

const adminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1)
});

router.post("/cities/:cityId/admins", validateBody(adminSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body as z.infer<typeof adminSchema>;
    const cityId = req.params.cityId as string;
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw new HttpError(404, "City not found");
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, name }
    });
    await prisma.userCity.create({
      data: {
        userId: user.id,
        cityId,
        role: Role.CITY_ADMIN
      }
    });
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
});

router.get("/modules", async (_req, res, next) => {
  try {
    const modules = await prisma.module.findMany({
      where: { name: { in: DEFAULT_MODULES } },
      orderBy: { name: "asc" }
    });
    res.json({ modules });
  } catch (err) {
    next(err);
  }
});

const moduleCreateSchema = z.object({
  name: z.string().min(1)
});

router.post("/modules", validateBody(moduleCreateSchema), async (req, res, next) => {
  try {
    const { name } = req.body as z.infer<typeof moduleCreateSchema>;
    const normalized = name.trim().toUpperCase();
    const module = await prisma.module.upsert({
      where: { name: normalized },
      update: { isActive: true },
      create: { name: normalized, isActive: true }
    });

    await syncAllCityModules();

    res.json({ module });
  } catch (err) {
    next(err);
  }
});

export default router;