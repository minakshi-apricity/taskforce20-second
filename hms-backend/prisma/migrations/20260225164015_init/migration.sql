-- CreateEnum
CREATE TYPE "Role" AS ENUM ('HMS_SUPER_ADMIN', 'CITY_ADMIN', 'COMMISSIONER', 'ACTION_OFFICER', 'EMPLOYEE', 'QC');

-- CreateEnum
CREATE TYPE "GeoLevel" AS ENUM ('CITY', 'ZONE', 'WARD', 'KOTHI', 'SUB_KOTHI', 'GALI', 'AREA', 'BEAT');

-- CreateEnum
CREATE TYPE "AreaType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'SLUM');

-- CreateEnum
CREATE TYPE "ModuleRecordStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BinCondition" AS ENUM ('GOOD', 'DAMAGED');

-- CreateEnum
CREATE TYPE "TwinbinVisitStatus" AS ENUM ('PENDING_QC', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TwinbinReportStatus" AS ENUM ('SUBMITTED', 'PENDING_QC', 'APPROVED', 'REJECTED', 'ACTION_REQUIRED');

-- CreateEnum
CREATE TYPE "ReportActionStatus" AS ENUM ('APPROVED', 'REJECTED', 'ACTION_REQUIRED', 'ACTION_TAKEN');

-- CreateEnum
CREATE TYPE "TaskforceRequestStatus" AS ENUM ('PENDING_QC', 'APPROVED', 'REJECTED', 'ACTION_REQUIRED');

-- CreateEnum
CREATE TYPE "TaskforceReportStatus" AS ENUM ('SUBMITTED', 'PENDING_QC', 'APPROVED', 'REJECTED', 'ACTION_REQUIRED');

-- CreateEnum
CREATE TYPE "TwinbinBinStatus" AS ENUM ('PENDING_QC', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ToiletType" AS ENUM ('CT', 'PT', 'URINALS');

-- CreateEnum
CREATE TYPE "ToiletGender" AS ENUM ('MALE', 'FEMALE', 'UNISEX', 'DISABLED', 'DIFFERENTLY_ABLED');

-- CreateEnum
CREATE TYPE "ToiletStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'ACTION_REQUIRED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IECStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "HMS" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HMS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" UUID NOT NULL,
    "hmsId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ulbCode" TEXT,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayName" TEXT,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityModule" (
    "id" TEXT NOT NULL,
    "cityId" UUID NOT NULL,
    "moduleId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CityModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCity" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zoneIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "wardIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "UserCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserModuleRole" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "moduleId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "zoneIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "wardIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "UserModuleRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "cityId" UUID NOT NULL,
    "moduleId" TEXT,
    "role" "Role" NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoNode" (
    "id" TEXT NOT NULL,
    "cityId" UUID NOT NULL,
    "parentId" TEXT,
    "level" "GeoLevel" NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "areaType" "AreaType",

    CONSTRAINT "GeoNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskforceCase" (
    "id" TEXT NOT NULL,
    "cityId" UUID NOT NULL,
    "moduleId" TEXT NOT NULL,
    "geoNodeId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assignedTo" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskforceCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskforceActivity" (
    "id" TEXT NOT NULL,
    "cityId" UUID NOT NULL,
    "moduleId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskforceActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IECForm" (
    "id" TEXT NOT NULL,
    "cityId" UUID NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IECStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IECForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SweepingRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cityId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "status" "ModuleRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "payload" JSONB NOT NULL,
    "areaType" "AreaType" NOT NULL,
    "sweepDate" DATE,
    "submittedAt" TIMESTAMP(3),
    "beatId" UUID,
    "segmentId" UUID,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "qcRemark" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SweepingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LitterBinRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cityId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "status" "ModuleRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LitterBinRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LitterBin" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "zoneId" UUID,
    "wardId" UUID,
    "areaName" TEXT NOT NULL,
    "areaType" "AreaType" NOT NULL,
    "locationName" TEXT NOT NULL,
    "roadType" TEXT NOT NULL,
    "isFixedProperly" BOOLEAN NOT NULL,
    "hasLid" BOOLEAN NOT NULL,
    "condition" "BinCondition" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "TwinbinBinStatus" NOT NULL,
    "assignedEmployeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "approvedByQcId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LitterBin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LitterBinVisitReport" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "binId" UUID NOT NULL,
    "submittedById" UUID NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distanceMeters" DOUBLE PRECISION NOT NULL,
    "inspectionAnswers" JSONB NOT NULL,
    "status" "TwinbinVisitStatus" NOT NULL DEFAULT 'PENDING_QC',
    "actionStatus" "ReportActionStatus" NOT NULL DEFAULT 'APPROVED',
    "qcRemark" TEXT,
    "actionTakenById" UUID,
    "actionRemark" TEXT,
    "actionPhotoUrl" TEXT,
    "actionTakenAt" TIMESTAMP(3),
    "reviewedByQcId" UUID,
    "currentOwnerRole" "Role" NOT NULL DEFAULT 'QC',
    "actionOfficerId" UUID,
    "actionOfficerRemark" TEXT,
    "actionOfficerRespondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LitterBinVisitReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LitterBinReport" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "binId" UUID NOT NULL,
    "submittedById" UUID NOT NULL,
    "reviewedByQcId" UUID,
    "status" "TwinbinReportStatus" NOT NULL,
    "currentOwnerRole" "Role" NOT NULL DEFAULT 'QC',
    "actionOfficerId" UUID,
    "actionOfficerRemark" TEXT,
    "actionOfficerRespondedAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distanceMeters" DOUBLE PRECISION NOT NULL,
    "questionnaire" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "LitterBinReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskforceFeederPoint" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "zoneId" UUID,
    "wardId" UUID,
    "zoneName" TEXT DEFAULT '',
    "wardName" TEXT DEFAULT '',
    "areaName" TEXT NOT NULL,
    "areaType" "AreaType" NOT NULL,
    "feederPointName" TEXT NOT NULL,
    "locationDescription" TEXT NOT NULL,
    "populationDensity" TEXT NOT NULL DEFAULT '',
    "accessibilityLevel" TEXT NOT NULL DEFAULT '',
    "householdsCount" INTEGER NOT NULL DEFAULT 0,
    "vehicleType" TEXT NOT NULL DEFAULT '',
    "landmark" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "TaskforceRequestStatus" NOT NULL,
    "assignedEmployeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "approvedByQcId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskforceFeederPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskforceRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cityId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "status" "ModuleRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskforceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskforceFeederReport" (
    "id" UUID NOT NULL,
    "feederPointId" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "submittedById" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distanceMeters" DOUBLE PRECISION NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "TaskforceReportStatus" NOT NULL,
    "currentOwnerRole" "Role" NOT NULL DEFAULT 'QC',
    "actionOfficerId" UUID,
    "actionOfficerRemark" TEXT,
    "actionOfficerRespondedAt" TIMESTAMP(3),
    "reviewedByQcId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskforceFeederReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRegistrationRequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "aadhaar" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "cityId" UUID NOT NULL,
    "zoneId" TEXT,
    "wardId" TEXT,
    "requestedModules" TEXT[],
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedByUserId" UUID,
    "approvedByRole" "Role",
    "approvedAt" TIMESTAMPTZ(6),
    "rejectedByUserId" UUID,
    "rejectedByRole" "Role",
    "rejectedAt" TIMESTAMPTZ(6),
    "rejectReason" TEXT,

    CONSTRAINT "UserRegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Toilet" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "wardId" UUID,
    "zoneId" UUID,
    "name" TEXT NOT NULL,
    "type" "ToiletType" NOT NULL,
    "gender" "ToiletGender" NOT NULL,
    "code" TEXT,
    "operatorName" TEXT,
    "numberOfSeats" INTEGER DEFAULT 0,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "status" "ToiletStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedEmployeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Toilet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToiletInspection" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "toiletId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distanceMeters" DOUBLE PRECISION,
    "answers" JSONB,
    "qcComment" TEXT,
    "actionNote" TEXT,
    "reviewedByQcId" UUID,
    "actionTakenById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToiletInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToiletAssignment" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "toiletId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "category" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToiletAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToiletInspectionQuestion" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'YES_NO',
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirePhoto" BOOLEAN NOT NULL DEFAULT false,
    "forType" "ToiletType",
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToiletInspectionQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityAreaBeat" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "wardId" UUID NOT NULL,
    "areaId" UUID NOT NULL,
    "beatName" TEXT NOT NULL,
    "geometry" JSONB,
    "rawKml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "assignedToId" UUID,

    CONSTRAINT "CityAreaBeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeatSegment" (
    "id" UUID NOT NULL,
    "beatId" UUID NOT NULL,
    "geometry" JSONB NOT NULL,
    "assignedToId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeatSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HMS_name_key" ON "HMS"("name");

-- CreateIndex
CREATE UNIQUE INDEX "City_code_key" ON "City"("code");

-- CreateIndex
CREATE INDEX "City_hmsId_idx" ON "City"("hmsId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_name_key" ON "Module"("name");

-- CreateIndex
CREATE INDEX "CityModule_cityId_moduleId_idx" ON "CityModule"("cityId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "CityModule_cityId_moduleId_key" ON "CityModule"("cityId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserCity_cityId_role_idx" ON "UserCity"("cityId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "UserCity_userId_cityId_role_key" ON "UserCity"("userId", "cityId", "role");

-- CreateIndex
CREATE INDEX "UserModuleRole_cityId_moduleId_role_idx" ON "UserModuleRole"("cityId", "moduleId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "UserModuleRole_userId_cityId_moduleId_role_key" ON "UserModuleRole"("userId", "cityId", "moduleId", "role");

-- CreateIndex
CREATE INDEX "Permission_cityId_moduleId_role_idx" ON "Permission"("cityId", "moduleId", "role");

-- CreateIndex
CREATE INDEX "Permission_cityId_resource_action_idx" ON "Permission"("cityId", "resource", "action");

-- CreateIndex
CREATE INDEX "GeoNode_cityId_level_idx" ON "GeoNode"("cityId", "level");

-- CreateIndex
CREATE INDEX "GeoNode_cityId_path_idx" ON "GeoNode"("cityId", "path");

-- CreateIndex
CREATE INDEX "TaskforceCase_cityId_status_idx" ON "TaskforceCase"("cityId", "status");

-- CreateIndex
CREATE INDEX "TaskforceCase_cityId_geoNodeId_idx" ON "TaskforceCase"("cityId", "geoNodeId");

-- CreateIndex
CREATE INDEX "TaskforceActivity_cityId_caseId_idx" ON "TaskforceActivity"("cityId", "caseId");

-- CreateIndex
CREATE INDEX "IECForm_cityId_status_idx" ON "IECForm"("cityId", "status");

-- CreateIndex
CREATE INDEX "IECForm_cityId_moduleId_idx" ON "IECForm"("cityId", "moduleId");

-- CreateIndex
CREATE INDEX "SweepingRecord_cityId_idx" ON "SweepingRecord"("cityId");

-- CreateIndex
CREATE INDEX "SweepingRecord_status_idx" ON "SweepingRecord"("status");

-- CreateIndex
CREATE INDEX "SweepingRecord_beatId_idx" ON "SweepingRecord"("beatId");

-- CreateIndex
CREATE INDEX "SweepingRecord_segmentId_idx" ON "SweepingRecord"("segmentId");

-- CreateIndex
CREATE INDEX "SweepingRecord_reviewedById_idx" ON "SweepingRecord"("reviewedById");

-- CreateIndex
CREATE INDEX "SweepingRecord_sweepDate_idx" ON "SweepingRecord"("sweepDate");

-- CreateIndex
CREATE INDEX "LitterBinRecord_cityId_idx" ON "LitterBinRecord"("cityId");

-- CreateIndex
CREATE INDEX "LitterBin_cityId_idx" ON "LitterBin"("cityId");

-- CreateIndex
CREATE INDEX "LitterBinVisitReport_cityId_idx" ON "LitterBinVisitReport"("cityId");

-- CreateIndex
CREATE INDEX "LitterBinVisitReport_binId_idx" ON "LitterBinVisitReport"("binId");

-- CreateIndex
CREATE INDEX "LitterBinReport_cityId_idx" ON "LitterBinReport"("cityId");

-- CreateIndex
CREATE INDEX "LitterBinReport_binId_idx" ON "LitterBinReport"("binId");

-- CreateIndex
CREATE INDEX "LitterBinReport_currentOwnerRole_idx" ON "LitterBinReport"("currentOwnerRole");

-- CreateIndex
CREATE INDEX "LitterBinReport_actionOfficerId_idx" ON "LitterBinReport"("actionOfficerId");

-- CreateIndex
CREATE INDEX "TaskforceFeederPoint_cityId_idx" ON "TaskforceFeederPoint"("cityId");

-- CreateIndex
CREATE INDEX "TaskforceRecord_cityId_idx" ON "TaskforceRecord"("cityId");

-- CreateIndex
CREATE INDEX "TaskforceFeederReport_cityId_idx" ON "TaskforceFeederReport"("cityId");

-- CreateIndex
CREATE INDEX "UserRegistrationRequest_cityId_idx" ON "UserRegistrationRequest"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRegistrationRequest_email_cityId_key" ON "UserRegistrationRequest"("email", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "Toilet_code_key" ON "Toilet"("code");

-- CreateIndex
CREATE INDEX "Toilet_cityId_idx" ON "Toilet"("cityId");

-- CreateIndex
CREATE INDEX "ToiletInspection_cityId_idx" ON "ToiletInspection"("cityId");

-- CreateIndex
CREATE INDEX "ToiletInspection_toiletId_idx" ON "ToiletInspection"("toiletId");

-- CreateIndex
CREATE UNIQUE INDEX "ToiletAssignment_toiletId_employeeId_key" ON "ToiletAssignment"("toiletId", "employeeId");

-- CreateIndex
CREATE INDEX "CityAreaBeat_cityId_idx" ON "CityAreaBeat"("cityId");

-- CreateIndex
CREATE INDEX "CityAreaBeat_areaId_idx" ON "CityAreaBeat"("areaId");

-- CreateIndex
CREATE INDEX "CityAreaBeat_beatName_idx" ON "CityAreaBeat"("beatName");

-- CreateIndex
CREATE INDEX "CityAreaBeat_assignedToId_idx" ON "CityAreaBeat"("assignedToId");

-- CreateIndex
CREATE INDEX "BeatSegment_beatId_idx" ON "BeatSegment"("beatId");

-- CreateIndex
CREATE INDEX "BeatSegment_assignedToId_idx" ON "BeatSegment"("assignedToId");

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_hmsId_fkey" FOREIGN KEY ("hmsId") REFERENCES "HMS"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityModule" ADD CONSTRAINT "CityModule_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityModule" ADD CONSTRAINT "CityModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCity" ADD CONSTRAINT "UserCity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCity" ADD CONSTRAINT "UserCity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModuleRole" ADD CONSTRAINT "UserModuleRole_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModuleRole" ADD CONSTRAINT "UserModuleRole_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModuleRole" ADD CONSTRAINT "UserModuleRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoNode" ADD CONSTRAINT "GeoNode_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoNode" ADD CONSTRAINT "GeoNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GeoNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceCase" ADD CONSTRAINT "TaskforceCase_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceCase" ADD CONSTRAINT "TaskforceCase_geoNodeId_fkey" FOREIGN KEY ("geoNodeId") REFERENCES "GeoNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceCase" ADD CONSTRAINT "TaskforceCase_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceActivity" ADD CONSTRAINT "TaskforceActivity_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "TaskforceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceActivity" ADD CONSTRAINT "TaskforceActivity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceActivity" ADD CONSTRAINT "TaskforceActivity_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IECForm" ADD CONSTRAINT "IECForm_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IECForm" ADD CONSTRAINT "IECForm_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SweepingRecord" ADD CONSTRAINT "SweepingRecord_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SweepingRecord" ADD CONSTRAINT "SweepingRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SweepingRecord" ADD CONSTRAINT "SweepingRecord_beatId_fkey" FOREIGN KEY ("beatId") REFERENCES "CityAreaBeat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SweepingRecord" ADD CONSTRAINT "SweepingRecord_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "BeatSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SweepingRecord" ADD CONSTRAINT "SweepingRecord_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitterBinRecord" ADD CONSTRAINT "LitterBinRecord_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "LitterBinRecord" ADD CONSTRAINT "LitterBinRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "LitterBin" ADD CONSTRAINT "LitterBin_approvedByQcId_fkey" FOREIGN KEY ("approvedByQcId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitterBin" ADD CONSTRAINT "LitterBin_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitterBin" ADD CONSTRAINT "LitterBin_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitterBinVisitReport" ADD CONSTRAINT "LitterBinVisitReport_actionTakenById_fkey" FOREIGN KEY ("actionTakenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitterBinVisitReport" ADD CONSTRAINT "LitterBinVisitReport_binId_fkey" FOREIGN KEY ("binId") REFERENCES "LitterBin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitterBinVisitReport" ADD CONSTRAINT "LitterBinVisitReport_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitterBinVisitReport" ADD CONSTRAINT "LitterBinVisitReport_reviewedByQcId_fkey" FOREIGN KEY ("reviewedByQcId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitterBinVisitReport" ADD CONSTRAINT "LitterBinVisitReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitterBinReport" ADD CONSTRAINT "LitterBinReport_binId_fkey" FOREIGN KEY ("binId") REFERENCES "LitterBin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitterBinReport" ADD CONSTRAINT "LitterBinReport_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitterBinReport" ADD CONSTRAINT "LitterBinReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitterBinReport" ADD CONSTRAINT "LitterBinReport_reviewedByQcId_fkey" FOREIGN KEY ("reviewedByQcId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceFeederPoint" ADD CONSTRAINT "TaskforceFeederPoint_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceFeederPoint" ADD CONSTRAINT "TaskforceFeederPoint_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceFeederPoint" ADD CONSTRAINT "TaskforceFeederPoint_approvedByQcId_fkey" FOREIGN KEY ("approvedByQcId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceRecord" ADD CONSTRAINT "TaskforceRecord_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TaskforceRecord" ADD CONSTRAINT "TaskforceRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TaskforceFeederReport" ADD CONSTRAINT "TaskforceFeederReport_feederPointId_fkey" FOREIGN KEY ("feederPointId") REFERENCES "TaskforceFeederPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceFeederReport" ADD CONSTRAINT "TaskforceFeederReport_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceFeederReport" ADD CONSTRAINT "TaskforceFeederReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskforceFeederReport" ADD CONSTRAINT "TaskforceFeederReport_reviewedByQcId_fkey" FOREIGN KEY ("reviewedByQcId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRegistrationRequest" ADD CONSTRAINT "UserRegistrationRequest_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Toilet" ADD CONSTRAINT "Toilet_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Toilet" ADD CONSTRAINT "Toilet_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToiletInspection" ADD CONSTRAINT "ToiletInspection_toiletId_fkey" FOREIGN KEY ("toiletId") REFERENCES "Toilet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToiletInspection" ADD CONSTRAINT "ToiletInspection_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToiletInspection" ADD CONSTRAINT "ToiletInspection_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToiletInspection" ADD CONSTRAINT "ToiletInspection_reviewedByQcId_fkey" FOREIGN KEY ("reviewedByQcId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToiletInspection" ADD CONSTRAINT "ToiletInspection_actionTakenById_fkey" FOREIGN KEY ("actionTakenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToiletAssignment" ADD CONSTRAINT "ToiletAssignment_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToiletAssignment" ADD CONSTRAINT "ToiletAssignment_toiletId_fkey" FOREIGN KEY ("toiletId") REFERENCES "Toilet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToiletAssignment" ADD CONSTRAINT "ToiletAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityAreaBeat" ADD CONSTRAINT "CityAreaBeat_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityAreaBeat" ADD CONSTRAINT "CityAreaBeat_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeatSegment" ADD CONSTRAINT "BeatSegment_beatId_fkey" FOREIGN KEY ("beatId") REFERENCES "CityAreaBeat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeatSegment" ADD CONSTRAINT "BeatSegment_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
