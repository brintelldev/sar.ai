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
  registrationNumber: text("registration_number").unique().notNull(),
  name: text("name").notNull(),
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
  userId: uuid("user_id").references(() => users.id).notNull(),
  volunteerNumber: text("volunteer_number").unique().notNull(),
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
  createdAt: true,
  updatedAt: true
});

export const insertVolunteerSchema = createInsertSchema(volunteers).omit({
  id: true,
  joinedDate: true,
  createdAt: true,
  updatedAt: true
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  donationDate: true,
  createdAt: true
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
