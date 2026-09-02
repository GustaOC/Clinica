import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const patients = sqliteTable('patients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: text('owner_id').notNull(),
  name: text('name').notNull(),
  cpf: text('cpf').notNull(),
  birthDate: text('birth_date').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  guardian: text('guardian'),
  allergies: text('allergies'),
  medications: text('medications'),
  clinicalConditions: text('clinical_conditions'),
  responsibleProfessional: text('responsible_professional').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [uniqueIndex('idx_patients_owner_cpf').on(table.ownerId, table.cpf), index('idx_patients_owner_name').on(table.ownerId, table.name)]);

export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  ownerId: text('owner_id').notNull(),
  professional: text('professional').notNull(),
  room: text('room').notNull(),
  procedure: text('procedure').notNull(),
  startsAt: text('starts_at').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_appointments_owner_starts').on(table.ownerId, table.startsAt), index('idx_appointments_patient').on(table.patientId)]);

export const clinicalRecords = sqliteTable('clinical_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  appointmentId: integer('appointment_id').references(() => appointments.id),
  ownerId: text('owner_id').notNull(),
  chiefComplaint: text('chief_complaint'),
  anamnesis: text('anamnesis'),
  assessment: text('assessment'),
  proceduresPerformed: text('procedures_performed'),
  productsUsed: text('products_used'),
  productLot: text('product_lot'),
  appliedRegion: text('applied_region'),
  aftercare: text('aftercare'),
  complications: text('complications'),
  returnAt: text('return_at'),
  professional: text('professional').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_clinical_records_patient').on(table.patientId)]);

export const treatmentPlans = sqliteTable('treatment_plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  ownerId: text('owner_id').notNull(),
  procedures: text('procedures').notNull(),
  instructions: text('instructions'),
  professional: text('professional').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_treatment_plans_patient').on(table.patientId)]);

export const patientPhotos = sqliteTable('patient_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  appointmentId: integer('appointment_id').references(() => appointments.id),
  ownerId: text('owner_id').notNull(),
  objectKey: text('object_key').notNull(),
  photoType: text('photo_type').notNull(),
  capturedAt: text('captured_at').notNull(),
  createdBy: text('created_by').notNull(),
}, (table) => [index('idx_patient_photos_patient').on(table.patientId)]);

export const aiSimulations = sqliteTable('ai_simulations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  originalPhotoId: integer('original_photo_id').notNull().references(() => patientPhotos.id),
  ownerId: text('owner_id').notNull(),
  professionalId: text('professional_id').notNull(),
  procedures: text('procedures').notNull(),
  instructions: text('instructions').notNull(),
  prompt: text('prompt').notNull(),
  model: text('model').notNull(),
  modelVersion: text('model_version').notNull(),
  generatedObjectKey: text('generated_object_key').notNull(),
  createdAt: text('created_at').notNull(),
  approvedAt: text('approved_at'),
  approvedBy: text('approved_by'),
}, (table) => [index('idx_ai_simulations_patient').on(table.patientId)]);

export const consents = sqliteTable('consents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  ownerId: text('owner_id').notNull(),
  consentType: text('consent_type').notNull(),
  status: text('status').notNull(),
  signedAt: text('signed_at'),
  documentObjectKey: text('document_object_key'),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_consents_patient_type').on(table.patientId, table.consentType)]);

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: text('owner_id').notNull(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_audit_logs_owner_created').on(table.ownerId, table.createdAt)]);
