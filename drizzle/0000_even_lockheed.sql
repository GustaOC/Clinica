CREATE TABLE `ai_simulations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`original_photo_id` integer NOT NULL,
	`owner_id` text NOT NULL,
	`professional_id` text NOT NULL,
	`procedures` text NOT NULL,
	`instructions` text NOT NULL,
	`prompt` text NOT NULL,
	`model` text NOT NULL,
	`model_version` text NOT NULL,
	`generated_object_key` text NOT NULL,
	`created_at` text NOT NULL,
	`approved_at` text,
	`approved_by` text,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`original_photo_id`) REFERENCES `patient_photos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ai_simulations_patient` ON `ai_simulations` (`patient_id`);--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`owner_id` text NOT NULL,
	`professional` text NOT NULL,
	`room` text NOT NULL,
	`procedure` text NOT NULL,
	`starts_at` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_appointments_owner_starts` ON `appointments` (`owner_id`,`starts_at`);--> statement-breakpoint
CREATE INDEX `idx_appointments_patient` ON `appointments` (`patient_id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_owner_created` ON `audit_logs` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `clinical_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`appointment_id` integer,
	`owner_id` text NOT NULL,
	`chief_complaint` text,
	`anamnesis` text,
	`assessment` text,
	`procedures_performed` text,
	`products_used` text,
	`product_lot` text,
	`applied_region` text,
	`aftercare` text,
	`complications` text,
	`return_at` text,
	`professional` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_clinical_records_patient` ON `clinical_records` (`patient_id`);--> statement-breakpoint
CREATE TABLE `consents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`owner_id` text NOT NULL,
	`consent_type` text NOT NULL,
	`status` text NOT NULL,
	`signed_at` text,
	`document_object_key` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_consents_patient_type` ON `consents` (`patient_id`,`consent_type`);--> statement-breakpoint
CREATE TABLE `patient_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`appointment_id` integer,
	`owner_id` text NOT NULL,
	`object_key` text NOT NULL,
	`photo_type` text NOT NULL,
	`captured_at` text NOT NULL,
	`created_by` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_patient_photos_patient` ON `patient_photos` (`patient_id`);--> statement-breakpoint
CREATE TABLE `patients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`cpf` text NOT NULL,
	`birth_date` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`address` text,
	`guardian` text,
	`allergies` text,
	`medications` text,
	`clinical_conditions` text,
	`responsible_professional` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_patients_owner_cpf` ON `patients` (`owner_id`,`cpf`);--> statement-breakpoint
CREATE INDEX `idx_patients_owner_name` ON `patients` (`owner_id`,`name`);--> statement-breakpoint
CREATE TABLE `treatment_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`owner_id` text NOT NULL,
	`procedures` text NOT NULL,
	`instructions` text,
	`professional` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_patient` ON `treatment_plans` (`patient_id`);