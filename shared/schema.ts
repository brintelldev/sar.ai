import { pgTable, text, uuid, timestamp, integer, decimal, boolean, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations table - multi-tenant base
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  cnpj: text("cnpj").unique(),
  legalRepresentativeName: text("legal_representative_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  address: jsonb("address"),
  subscriptionPlan: text("subscription_plan").default("free"), // 'free', 'basic', 'premium'
  subscriptionStatus: text("subscription_status").default("active"), // 'active', 'suspended', 'cancelled'
  dataRetentionPolicy: integer("data_retention_policy").default(730), // days
  privacySettings: jsonb("privacy_settings"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Users table with multi-tenant support
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  position: text("position"),
  isGlobalAdmin: boolean("is_global_admin").default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// User roles and permissions per organization
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  role: text("role").notNull(), // 'admin', 'manager', 'volunteer', 'beneficiary'
  permissions: jsonb("permissions"), // granular permissions
  grantedBy: uuid("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true)
});

// Projects
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  spentAmount: decimal("spent_amount", { precision: 12, scale: 2 }).default("0"),
  status: text("status").notNull(), // 'planning', 'active', 'paused', 'completed', 'cancelled'
  goals: jsonb("goals"), // structured goals
  milestones: jsonb("milestones"), // project milestones
  managerId: uuid("manager_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Donors
export const donors = pgTable("donors", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  type: text("type").notNull(), // 'individual', 'corporate'
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  document: text("document"), // CPF ou CNPJ
  address: jsonb("address"),
  donationPreferences: jsonb("donation_preferences"),
  communicationConsent: boolean("communication_consent").default(false),
  totalDonated: decimal("total_donated", { precision: 12, scale: 2 }).default("0"),
  firstDonationDate: date("first_donation_date"),
  lastDonationDate: date("last_donation_date"),
  donorSince: date("donor_since").defaultNow(),
  status: text("status").default("active"), // 'active', 'inactive', 'opted_out'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Beneficiaries with LGPD compliance
export const beneficiaries = pgTable("beneficiaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  userId: uuid("user_id").references(() => users.id), // linked user account for course access
  registrationNumber: text("registration_number").unique().notNull(),
  name: text("name").notNull(),
  email: text("email"), // email for account creation
  birthDate: date("birth_date"),
  document: text("document"),
  contactInfo: text("contact_info"), // encrypted contact information
  address: text("address"), // encrypted address information
  emergencyContact: text("emergency_contact"), // encrypted emergency contact
  status: text("status").notNull().default("active"), // 'active', 'inactive', 'completed'
  needs: text("needs"), // types of support needed
  servicesReceived: text("services_received"), // history of services
  socialVulnerabilityData: jsonb("social_vulnerability_data"), // encrypted
  consentRecords: jsonb("consent_records"), // granular consents
  dataRetentionUntil: date("data_retention_until"),
  anonymizationDate: date("anonymization_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Volunteers
export const volunteers = pgTable("volunteers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  volunteerNumber: text("volunteer_number").unique().notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  skills: jsonb("skills"), // skills and competencies
  availability: jsonb("availability"), // schedule availability
  backgroundCheckStatus: text("background_check_status"),
  emergencyContact: jsonb("emergency_contact"),
  totalHours: decimal("total_hours", { precision: 8, scale: 2 }).default("0"),
  participationScore: integer("participation_score").default(0),
  status: text("status").default("pending"), // 'pending', 'active', 'inactive', 'suspended'
  joinedDate: date("joined_date").defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Donations
export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  donorId: uuid("donor_id").references(() => donors.id),
  projectId: uuid("project_id").references(() => projects.id), // directed donation
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("BRL"),
  paymentMethod: text("payment_method"), // 'pix', 'credit_card', 'bank_transfer', 'cash'
  paymentStatus: text("payment_status"), // 'pending', 'completed', 'failed', 'refunded'
  transactionId: text("transaction_id"), // payment gateway ID
  campaignSource: text("campaign_source"),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"), // 'monthly', 'quarterly', 'annually'
  receiptIssued: boolean("receipt_issued").default(false),
  notes: text("notes"), // additional notes about the donation
  donationDate: timestamp("donation_date", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Accounts Receivable
export const accountsReceivable = pgTable("accounts_receivable", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  donorId: uuid("donor_id").references(() => donors.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").default("pending"), // 'pending', 'overdue', 'received', 'cancelled'
  invoiceNumber: text("invoice_number"),
  projectId: uuid("project_id").references(() => projects.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Accounts Payable
export const accountsPayable = pgTable("accounts_payable", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  supplierName: text("supplier_name").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").default("pending"), // 'pending', 'approved', 'paid', 'overdue', 'cancelled'
  category: text("category"), // 'administrative', 'project', 'operational'
  projectId: uuid("project_id").references(() => projects.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  paidDate: date("paid_date"),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Funders
export const funders = pgTable("funders", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  type: text("type"), // 'government', 'foundation', 'corporate', 'international'
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: jsonb("address"),
  fundingFocus: jsonb("funding_focus"), // areas of interest
  relationshipStatus: text("relationship_status"), // 'prospect', 'active', 'inactive', 'lost'
  totalFunded: decimal("total_funded", { precision: 12, scale: 2 }).default("0"),
  reportingRequirements: jsonb("reporting_requirements"),
  nextReportDue: date("next_report_due"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Project Funding relationship
export const projectFunding = pgTable("project_funding", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  funderId: uuid("funder_id").references(() => funders.id).notNull(),
  amountFunded: decimal("amount_funded", { precision: 12, scale: 2 }).notNull(),
  fundingStartDate: date("funding_start_date"),
  fundingEndDate: date("funding_end_date"),
  reportingFrequency: text("reporting_frequency"), // 'monthly', 'quarterly', 'biannual', 'annual'
  contractNumber: text("contract_number"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  grantedAt: true
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true
});

export const insertDonorSchema = createInsertSchema(donors).omit({
  id: true,
  donorSince: true,
  createdAt: true,
  updatedAt: true
});

export const insertBeneficiarySchema = createInsertSchema(beneficiaries).omit({
  id: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true
}).extend({
  birthDate: z.string().nullable().optional().transform(val => {
    if (!val || val === '') return null;
    return val;
  }),
  dataRetentionUntil: z.string().nullable().optional().transform(val => {
    if (!val || val === '') return null;
    return val;
  }),
  anonymizationDate: z.string().nullable().optional().transform(val => {
    if (!val || val === '') return null;
    return val;
  })
});

export const insertVolunteerSchema = createInsertSchema(volunteers).omit({
  id: true,
  joinedDate: true,
  createdAt: true,
  updatedAt: true
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  createdAt: true
}).extend({
  donationDate: z.string().optional().transform((val) => val ? new Date(val) : new Date())
});

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Donor = typeof donors.$inferSelect;
export type InsertDonor = z.infer<typeof insertDonorSchema>;

export type Beneficiary = typeof beneficiaries.$inferSelect;
export type InsertBeneficiary = z.infer<typeof insertBeneficiarySchema>;

export type Volunteer = typeof volunteers.$inferSelect;
export type InsertVolunteer = z.infer<typeof insertVolunteerSchema>;

export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;

export type AccountsReceivable = typeof accountsReceivable.$inferSelect;
export type AccountsPayable = typeof accountsPayable.$inferSelect;
export type Funder = typeof funders.$inferSelect;
export type ProjectFunding = typeof projectFunding.$inferSelect;

// Training Courses
export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'tecnologia', 'empreendedorismo', 'direitos', 'saude'
  level: text("level").notNull(), // 'iniciante', 'intermediario', 'avancado'
  courseType: text("course_type").default("online"), // 'online', 'in_person', 'hybrid'
  duration: integer("duration"), // em horas
  coverImage: text("cover_image"),
  status: text("status").default("draft"), // 'draft', 'published', 'archived'
  requirements: jsonb("requirements"), // pré-requisitos
  learningObjectives: jsonb("learning_objectives"), // objetivos de aprendizagem
  tags: jsonb("tags"), // tags para busca
  passScore: integer("pass_score").default(70), // pontuação mínima para aprovação
  certificateEnabled: boolean("certificate_enabled").default(true),
  certificateTemplate: text("certificate_template"), // template personalizado do certificado
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Course Modules
export const courseModules = pgTable("course_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  content: jsonb("content"), // conteúdo do módulo
  videoUrl: text("video_url"), // URL do vídeo (YouTube, Vimeo)
  materials: jsonb("materials"), // PDFs, links, arquivos
  duration: integer("duration"), // duração em minutos
  isRequired: boolean("is_required").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// User Course Progress
export const userCourseProgress = pgTable("user_course_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  status: text("status").default("not_started"), // 'not_started', 'in_progress', 'completed', 'failed'
  progress: integer("progress").default(0), // porcentagem de conclusão
  completedModules: jsonb("completed_modules").default("[]"), // array de IDs dos módulos concluídos
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  timeSpent: integer("time_spent").default(0), // tempo total em minutos
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Course Assessments
export const courseAssessments = pgTable("course_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  questions: jsonb("questions").notNull(), // array de perguntas
  passingScore: integer("passing_score").default(70),
  timeLimit: integer("time_limit"), // tempo limite em minutos
  maxAttempts: integer("max_attempts").default(3),
  isRequired: boolean("is_required").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// User Module Form Submissions (respostas de formulários dos módulos)
export const userModuleFormSubmissions = pgTable("user_module_form_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  moduleId: uuid("module_id").references(() => courseModules.id).notNull(),
  formId: text("form_id").notNull(), // ID do formulário dentro do módulo
  answers: jsonb("answers").notNull(), // respostas do usuário
  score: integer("score"), // pontuação obtida (0-100)
  maxScore: integer("max_score"), // pontuação máxima possível
  passed: boolean("passed"), // se passou na nota mínima
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// User Assessment Attempts
export const userAssessmentAttempts = pgTable("user_assessment_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  assessmentId: uuid("assessment_id").references(() => courseAssessments.id).notNull(),
  answers: jsonb("answers").notNull(), // respostas do usuário
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  timeSpent: integer("time_spent"), // tempo gasto em minutos
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Certificates
export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  certificateNumber: text("certificate_number").unique().notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  verificationCode: text("verification_code").unique().notNull(),
  pdfPath: text("pdf_path"), // caminho do arquivo PDF
  metadata: jsonb("metadata"), // dados adicionais do certificado
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Course Instructors (voluntários que ministram cursos)
export const courseInstructors = pgTable("course_instructors", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  volunteerId: uuid("volunteer_id").references(() => volunteers.id).notNull(),
  role: text("role").default("instructor"), // 'instructor', 'assistant', 'coordinator'
  assignedBy: uuid("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow(),
  status: text("status").default("active"), // 'active', 'inactive'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Course Enrollments (inscrições de beneficiários em cursos)
export const courseEnrollments = pgTable("course_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  beneficiaryId: uuid("beneficiary_id").references(() => beneficiaries.id).notNull(),
  status: text("status").default("enrolled"), // 'enrolled', 'active', 'completed', 'dropped', 'suspended'
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  finalScore: integer("final_score"),
  certificateIssued: boolean("certificate_issued").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Course Attendance (frequência para cursos presenciais)
export const courseAttendance = pgTable("course_attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  sessionDate: date("session_date").notNull(),
  sessionTitle: text("session_title"),
  attendanceStatus: text("attendance_status").notNull(), // 'present', 'absent', 'late', 'excused'
  arrivalTime: text("arrival_time"),
  departureTime: text("departure_time"),
  notes: text("notes"),
  markedBy: uuid("marked_by").references(() => users.id),
  markedAt: timestamp("marked_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// User Module Progress (progresso individual por módulo)
export const userModuleProgress = pgTable("user_module_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").references(() => courseEnrollments.id).notNull(),
  moduleId: uuid("module_id").references(() => courseModules.id).notNull(),
  status: text("status").default("not_started"), // 'not_started', 'in_progress', 'completed'
  progress: integer("progress").default(0), // porcentagem de conclusão
  timeSpent: integer("time_spent").default(0), // tempo em minutos
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Volunteer Course Applications (candidaturas de voluntários para ministrar cursos)
export const volunteerCourseApplications = pgTable("volunteer_course_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  volunteerId: uuid("volunteer_id").references(() => volunteers.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  applicationMessage: text("application_message"), // motivação/experiência
  qualifications: jsonb("qualifications"), // qualificações relevantes
  status: text("status").default("pending"), // 'pending', 'approved', 'rejected', 'withdrawn'
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNotes: text("review_notes"),
  appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});



// Sistema de Notificações Abrangente
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'course_enrollment', 'project_assignment', 'info_update', 'system_change', 'achievement', 'reminder'
  category: text("category").notNull(), // 'course', 'project', 'user', 'system', 'achievement'
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"), // URL para ação relacionada
  metadata: jsonb("metadata"), // dados extras (ex: courseId, projectId, etc.)
  createdBy: uuid("created_by").references(() => users.id), // quem criou a notificação
  expiresAt: timestamp("expires_at", { withTimezone: true }), // notificações temporárias
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Activity logs table for real-time dashboard activities
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  type: text("type").notNull(), // 'user_created', 'project_created', 'donation_received', 'beneficiary_added', 'volunteer_registered', 'course_completed', 'site_updated'
  title: text("title").notNull(),
  description: text("description").notNull(),
  entityType: text("entity_type"), // 'user', 'project', 'donation', 'beneficiary', 'volunteer', 'course', 'site'
  entityId: uuid("entity_id"), // ID of the related entity
  metadata: jsonb("metadata"), // Additional data like amounts, names, etc.
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Enhanced user course enrollments with role-based access
export const userCourseRoles = pgTable("user_course_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  role: text("role").notNull(), // 'student', 'instructor', 'assistant', 'observer'
  permissions: jsonb("permissions"), // permissões específicas
  assignedBy: uuid("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow(),
  isActive: boolean("is_active").default(true),
  notes: text("notes") // observações sobre a atribuição
});

// User Grades (notas finais de 1-10 para módulos e cursos)
export const userGrades = pgTable("user_grades", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  moduleId: uuid("module_id").references(() => courseModules.id), // null = nota final do curso
  gradeType: text("grade_type").notNull(), // 'module', 'course', 'final'
  scoreRaw: integer("score_raw"), // pontuação bruta (ex: 15/20)
  scoreMax: integer("score_max"), // pontuação máxima possível
  gradeScale: decimal("grade_scale", { precision: 3, scale: 1 }).notNull(), // nota de 1.0 a 10.0
  passed: boolean("passed").notNull().default(false),
  feedback: text("feedback"), // comentários sobre a nota
  gradedBy: uuid("graded_by").references(() => users.id), // quem atribuiu a nota
  gradedAt: timestamp("graded_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Insert schemas for training module
export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true
});

export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});



export const insertCourseAssessmentSchema = createInsertSchema(courseAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserCourseProgressSchema = createInsertSchema(userCourseProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserModuleFormSubmissionSchema = createInsertSchema(userModuleFormSubmissions).omit({
  id: true,
  createdAt: true
});

export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({
  id: true,
  enrolledAt: true
});

export const insertCourseInstructorSchema = createInsertSchema(courseInstructors).omit({
  id: true,
  assignedAt: true
});

export const insertCourseAttendanceSchema = createInsertSchema(courseAttendance).omit({
  id: true,
  markedAt: true
});

export const insertUserModuleProgressSchema = createInsertSchema(userModuleProgress).omit({
  id: true
});

// Types for training module
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;



export type UserCourseProgress = typeof userCourseProgress.$inferSelect;
export type InsertUserCourseProgress = z.infer<typeof insertUserCourseProgressSchema>;

export type UserModuleFormSubmission = typeof userModuleFormSubmissions.$inferSelect;
export type InsertUserModuleFormSubmission = z.infer<typeof insertUserModuleFormSubmissionSchema>;

export type CourseAssessment = typeof courseAssessments.$inferSelect;
export type InsertCourseAssessment = z.infer<typeof insertCourseAssessmentSchema>;

export type UserAssessmentAttempt = typeof userAssessmentAttempts.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type TrainingNotification = typeof notifications.$inferSelect;

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;

export type CourseInstructor = typeof courseInstructors.$inferSelect;
export type InsertCourseInstructor = z.infer<typeof insertCourseInstructorSchema>;

export type CourseAttendance = typeof courseAttendance.$inferSelect;
export type InsertCourseAttendance = z.infer<typeof insertCourseAttendanceSchema>;

export type UserModuleProgress = typeof userModuleProgress.$inferSelect;
export type InsertUserModuleProgress = z.infer<typeof insertUserModuleProgressSchema>;

export const insertUserCourseRoleSchema = createInsertSchema(userCourseRoles).omit({
  id: true,
  assignedAt: true
});

export const insertUserGradeSchema = createInsertSchema(userGrades).omit({
  id: true,
  gradedAt: true,
  createdAt: true,
  updatedAt: true
});

export type UserCourseRole = typeof userCourseRoles.$inferSelect;
export type InsertUserCourseRole = z.infer<typeof insertUserCourseRoleSchema>;

export type UserGrade = typeof userGrades.$inferSelect;
export type InsertUserGrade = z.infer<typeof insertUserGradeSchema>;

// Site Whitelabel tables
export const whitelabelSites = pgTable("whitelabel_sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  subdomain: text("subdomain").unique().notNull(), // ex: nomeong.plataforma.org
  customDomain: text("custom_domain").unique(), // ex: nomeong.org
  isActive: boolean("is_active").default(true),
  theme: jsonb("theme"), // cores, fontes, layout
  content: jsonb("content"), // conteúdo das seções
  seoSettings: jsonb("seo_settings"), // meta tags, descrições
  analyticsCode: text("analytics_code"), // Google Analytics, etc
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const whitelabelTemplates = pgTable("whitelabel_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'institutional', 'projects', 'donations', 'team', 'contact'
  templateData: jsonb("template_data").notNull(), // HTML, CSS, componentes
  preview: text("preview"), // URL da imagem de preview
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

export const whitelabelPages = pgTable("whitelabel_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id").references(() => whitelabelSites.id).notNull(),
  slug: text("slug").notNull(), // ex: 'sobre', 'projetos', 'contato'
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // conteúdo estruturado da página
  templateId: uuid("template_id").references(() => whitelabelTemplates.id),
  isPublished: boolean("is_published").default(false),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const whitelabelMenus = pgTable("whitelabel_menus", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id").references(() => whitelabelSites.id).notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(), // 'internal', 'external', 'page'
  parentId: uuid("parent_id"),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

export const whitelabelForms = pgTable("whitelabel_forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id").references(() => whitelabelSites.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'contact', 'donation', 'volunteer', 'newsletter'
  fields: jsonb("fields").notNull(), // configuração dos campos
  settings: jsonb("settings"), // configurações de envio, validação
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const whitelabelFormSubmissions = pgTable("whitelabel_form_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id").references(() => whitelabelForms.id).notNull(),
  data: jsonb("data").notNull(), // dados submetidos
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Insert schemas for whitelabel module
export const insertWhitelabelSiteSchema = createInsertSchema(whitelabelSites).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWhitelabelTemplateSchema = createInsertSchema(whitelabelTemplates).omit({
  id: true,
  createdAt: true
});

export const insertWhitelabelPageSchema = createInsertSchema(whitelabelPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWhitelabelMenuSchema = createInsertSchema(whitelabelMenus).omit({
  id: true,
  createdAt: true
});

export const insertWhitelabelFormSchema = createInsertSchema(whitelabelForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types for whitelabel module
export type WhitelabelSite = typeof whitelabelSites.$inferSelect;
export type InsertWhitelabelSite = z.infer<typeof insertWhitelabelSiteSchema>;

export type WhitelabelTemplate = typeof whitelabelTemplates.$inferSelect;
export type InsertWhitelabelTemplate = z.infer<typeof insertWhitelabelTemplateSchema>;

export type WhitelabelPage = typeof whitelabelPages.$inferSelect;
export type InsertWhitelabelPage = z.infer<typeof insertWhitelabelPageSchema>;

export type WhitelabelMenu = typeof whitelabelMenus.$inferSelect;
export type InsertWhitelabelMenu = z.infer<typeof insertWhitelabelMenuSchema>;

export type WhitelabelForm = typeof whitelabelForms.$inferSelect;
export type InsertWhitelabelForm = z.infer<typeof insertWhitelabelFormSchema>;

export type WhitelabelFormSubmission = typeof whitelabelFormSubmissions.$inferSelect;

// Activity logs schemas and types
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Subscription plans table for SaaS management
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("BRL"),
  billingCycle: text("billing_cycle").notNull(), // 'monthly', 'yearly'
  features: jsonb("features").notNull(), // Array of features
  limits: jsonb("limits").notNull(), // Usage limits (users, projects, storage, etc.)
  isActive: boolean("is_active").default(true),
  isPopular: boolean("is_popular").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Subscriptions table to track organization subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  planId: uuid("plan_id").references(() => subscriptionPlans.id).notNull(),
  status: text("status").notNull(), // 'active', 'canceled', 'past_due', 'paused'
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  trialStart: timestamp("trial_start", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Platform analytics and metrics
export const platformMetrics = pgTable("platform_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull(),
  totalOrganizations: integer("total_organizations").notNull(),
  activeOrganizations: integer("active_organizations").notNull(),
  newOrganizations: integer("new_organizations").notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull(),
  monthlyRecurringRevenue: decimal("monthly_recurring_revenue", { precision: 12, scale: 2 }).notNull(),
  churnRate: decimal("churn_rate", { precision: 5, scale: 2 }),
  totalUsers: integer("total_users").notNull(),
  activeUsers: integer("active_users").notNull(),
  storageUsed: integer("storage_used"), // in bytes
  apiCalls: integer("api_calls").notNull(),
  supportTickets: integer("support_tickets").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// System announcements for organizations
export const systemAnnouncements = pgTable("system_announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'info', 'warning', 'maintenance', 'feature'
  priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
  targetAudience: text("target_audience").default("all"), // 'all', 'premium', 'trial', 'free'
  isActive: boolean("is_active").default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Schema and types for super admin features
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPlatformMetricsSchema = createInsertSchema(platformMetrics).omit({
  id: true,
  createdAt: true
});

export const insertSystemAnnouncementSchema = createInsertSchema(systemAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type PlatformMetrics = typeof platformMetrics.$inferSelect;
export type InsertPlatformMetrics = z.infer<typeof insertPlatformMetricsSchema>;

export type SystemAnnouncement = typeof systemAnnouncements.$inferSelect;
export type InsertSystemAnnouncement = z.infer<typeof insertSystemAnnouncementSchema>;

// Permission Templates and Access Control
export const permissionTemplates = pgTable("permission_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(), // "Admin Completo", "Gestor de Projetos", etc.
  description: text("description"),
  role: text("role").notNull(), // 'admin', 'manager', 'volunteer', 'beneficiary'
  permissions: jsonb("permissions").notNull(), // detailed permissions object
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const accessControlSettings = pgTable("access_control_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull().unique(),
  modulePermissions: jsonb("module_permissions").notNull(), // permissions per module
  roleHierarchy: jsonb("role_hierarchy").notNull(), // role inheritance rules
  restrictionSettings: jsonb("restriction_settings"), // additional restrictions
  auditSettings: jsonb("audit_settings"), // audit log settings
  lastModifiedBy: uuid("last_modified_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Insert schemas for permission system
export const insertPermissionTemplateSchema = createInsertSchema(permissionTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAccessControlSettingsSchema = createInsertSchema(accessControlSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type PermissionTemplate = typeof permissionTemplates.$inferSelect;
export type InsertPermissionTemplate = z.infer<typeof insertPermissionTemplateSchema>;

export type AccessControlSettings = typeof accessControlSettings.$inferSelect;
export type InsertAccessControlSettings = z.infer<typeof insertAccessControlSettingsSchema>;

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
