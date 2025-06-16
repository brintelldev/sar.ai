import { 
  users, organizations, userRoles, projects, donors, beneficiaries, 
  volunteers, donations, accountsReceivable, accountsPayable, funders,
  courses, courseModules, userCourseProgress, courseAssessments, certificates,
  type User, type InsertUser, type Organization, type InsertOrganization,
  type UserRole, type InsertUserRole, type Project, type InsertProject,
  type Donor, type InsertDonor, type Beneficiary, type InsertBeneficiary,
  type Volunteer, type InsertVolunteer, type Donation, type InsertDonation,
  type AccountsReceivable, type AccountsPayable, type Funder,
  type Course, type InsertCourse, type CourseModule, type InsertCourseModule,
  type UserCourseProgress, type InsertUserCourseProgress,
  type CourseAssessment, type InsertCourseAssessment, type Certificate
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Organization operations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getUserOrganizations(userId: string): Promise<Organization[]>;

  // User roles
  getUserRole(userId: string, organizationId: string): Promise<UserRole | undefined>;
  createUserRole(role: InsertUserRole): Promise<UserRole>;
  getUserRoles(userId: string): Promise<UserRole[]>;

  // Projects
  getProjects(organizationId: string): Promise<Project[]>;
  getProject(id: string, organizationId: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, organizationId: string, updates: Partial<Project>): Promise<Project | undefined>;

  // Donors
  getDonors(organizationId: string): Promise<Donor[]>;
  getDonor(id: string, organizationId: string): Promise<Donor | undefined>;
  createDonor(donor: InsertDonor): Promise<Donor>;
  updateDonor(id: string, organizationId: string, updates: Partial<Donor>): Promise<Donor | undefined>;

  // Beneficiaries
  getBeneficiaries(organizationId: string): Promise<Beneficiary[]>;
  getBeneficiary(id: string, organizationId: string): Promise<Beneficiary | undefined>;
  createBeneficiary(beneficiary: InsertBeneficiary): Promise<Beneficiary>;
  updateBeneficiary(id: string, organizationId: string, updates: Partial<Beneficiary>): Promise<Beneficiary | undefined>;

  // Volunteers
  getVolunteers(organizationId: string): Promise<Volunteer[]>;
  getVolunteer(id: string, organizationId: string): Promise<Volunteer | undefined>;
  createVolunteer(volunteer: InsertVolunteer): Promise<Volunteer>;
  updateVolunteer(id: string, organizationId: string, updates: Partial<Volunteer>): Promise<Volunteer | undefined>;

  // Donations
  getDonations(organizationId: string): Promise<Donation[]>;
  getDonation(id: string, organizationId: string): Promise<Donation | undefined>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  updateDonation(id: string, organizationId: string, updates: Partial<Donation>): Promise<Donation | undefined>;

  // Dashboard metrics
  getDashboardMetrics(organizationId: string): Promise<{
    activeProjects: number;
    totalDonated: number;
    beneficiariesServed: number;
    activeVolunteers: number;
  }>;

  // Accounts Receivable
  getAccountsReceivable(organizationId: string): Promise<AccountsReceivable[]>;
  createAccountReceivable(account: any): Promise<AccountsReceivable>;

  // Accounts Payable
  getAccountsPayable(organizationId: string): Promise<AccountsPayable[]>;
  createAccountPayable(account: any): Promise<AccountsPayable>;

  // Funders
  getFunders(organizationId: string): Promise<Funder[]>;
  createFunder(funder: any): Promise<Funder>;

  // Training Courses
  getCourses(organizationId: string): Promise<Course[]>;
  getCourse(id: string, organizationId: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, organizationId: string, updates: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: string, organizationId: string): Promise<boolean>;

  // Course Modules
  getCourseModules(courseId: string): Promise<CourseModule[]>;
  createCourseModule(module: InsertCourseModule): Promise<CourseModule>;
  updateCourseModule(id: string, updates: Partial<CourseModule>): Promise<CourseModule | undefined>;
  deleteCourseModule(id: string): Promise<boolean>;

  // User Course Progress
  getUserCourseProgress(userId: string, courseId: string): Promise<UserCourseProgress | undefined>;
  updateUserCourseProgress(userId: string, courseId: string, updates: Partial<UserCourseProgress>): Promise<UserCourseProgress>;
  getUserCourseProgressList(userId: string): Promise<UserCourseProgress[]>;

  // Course Assessments
  getCourseAssessments(courseId: string): Promise<CourseAssessment[]>;
  createCourseAssessment(assessment: InsertCourseAssessment): Promise<CourseAssessment>;

  // User Certificates
  getUserCertificates(userId: string): Promise<Certificate[]>;
  createCertificate(certificate: any): Promise<Certificate>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private userRoles: Map<string, UserRole> = new Map();
  private projects: Map<string, Project> = new Map();
  private donors: Map<string, Donor> = new Map();
  private beneficiaries: Map<string, Beneficiary> = new Map();
  private volunteers: Map<string, Volunteer> = new Map();
  private donations: Map<string, Donation> = new Map();

  private generateId(): string {
    return crypto.randomUUID();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.generateId();
    const user: User = {
      ...insertUser,
      id,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(org => org.slug === slug);
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = this.generateId();
    const organization: Organization = {
      ...insertOrg,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.organizations.set(id, organization);
    return organization;
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    console.log(`[DEBUG] Getting organizations for user: ${userId}`);

    const userRolesList = Array.from(this.userRoles.values())
      .filter(role => role.userId === userId && role.isActive);
    console.log(`[DEBUG] Found ${userRolesList.length} active user roles:`, userRolesList);

    const organizationIds = userRolesList.map(role => role.organizationId);
    console.log(`[DEBUG] Organization IDs:`, organizationIds);

    const organizations = Array.from(this.organizations.values())
      .filter(org => organizationIds.includes(org.id));
    console.log(`[DEBUG] Found ${organizations.length} organizations:`, organizations);

    return organizations;
  }

  // User roles
  async getUserRole(userId: string, organizationId: string): Promise<UserRole | undefined> {
    return Array.from(this.userRoles.values())
      .find(role => role.userId === userId && role.organizationId === organizationId && role.isActive);
  }

  async createUserRole(insertRole: InsertUserRole): Promise<UserRole> {
    const id = this.generateId();
    const role: UserRole = {
      ...insertRole,
      id,
      grantedAt: new Date(),
      expiresAt: insertRole.expiresAt || null,
      isActive: insertRole.isActive ?? true,
      permissions: insertRole.permissions || [],
      grantedBy: insertRole.grantedBy || null
    };
    this.userRoles.set(id, role);
    return role;
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return Array.from(this.userRoles.values())
      .filter(role => role.userId === userId && role.isActive);
  }

  // Projects
  async getProjects(organizationId: string): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter(project => project.organizationId === organizationId);
  }

  async getProject(id: string, organizationId: string): Promise<Project | undefined> {
    const project = this.projects.get(id);
    return project && project.organizationId === organizationId ? project : undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.generateId();
    const project: Project = {
      ...insertProject,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, organizationId: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project || project.organizationId !== organizationId) return undefined;

    const updatedProject = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Donors
  async getDonors(organizationId: string): Promise<Donor[]> {
    return Array.from(this.donors.values())
      .filter(donor => donor.organizationId === organizationId);
  }

  async getDonor(id: string, organizationId: string): Promise<Donor | undefined> {
    const donor = this.donors.get(id);
    return donor && donor.organizationId === organizationId ? donor : undefined;
  }

  async createDonor(insertDonor: InsertDonor): Promise<Donor> {
    const id = this.generateId();
    const donor: Donor = {
      ...insertDonor,
      id,
      donorSince: insertDonor.donorSince || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.donors.set(id, donor);
    return donor;
  }

  async updateDonor(id: string, organizationId: string, updates: Partial<Donor>): Promise<Donor | undefined> {
    const donor = this.donors.get(id);
    if (!donor || donor.organizationId !== organizationId) return undefined;

    const updatedDonor = { ...donor, ...updates, updatedAt: new Date() };
    this.donors.set(id, updatedDonor);
    return updatedDonor;
  }

  // Beneficiaries
  async getBeneficiaries(organizationId: string): Promise<Beneficiary[]> {
    return Array.from(this.beneficiaries.values())
      .filter(beneficiary => beneficiary.organizationId === organizationId);
  }

  async getBeneficiary(id: string, organizationId: string): Promise<Beneficiary | undefined> {
    const beneficiary = this.beneficiaries.get(id);
    return beneficiary && beneficiary.organizationId === organizationId ? beneficiary : undefined;
  }

  async createBeneficiary(insertBeneficiary: InsertBeneficiary): Promise<Beneficiary> {
    const id = this.generateId();
    const beneficiary: Beneficiary = {
      ...insertBeneficiary,
      id,
      status: insertBeneficiary.status || 'active',
      needs: insertBeneficiary.needs || null,
      servicesReceived: insertBeneficiary.servicesReceived || null,
      address: insertBeneficiary.address || null,
      contactInfo: insertBeneficiary.contactInfo || null,
      emergencyContact: insertBeneficiary.emergencyContact || null,
      document: insertBeneficiary.document || null,
      birthDate: insertBeneficiary.birthDate || null,
      socialVulnerabilityData: null,
      consentRecords: null,
      dataRetentionUntil: null,
      anonymizationDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.beneficiaries.set(id, beneficiary);
    return beneficiary;
  }

  async updateBeneficiary(id: string, organizationId: string, updates: Partial<Beneficiary>): Promise<Beneficiary | undefined> {
    const beneficiary = this.beneficiaries.get(id);
    if (!beneficiary || beneficiary.organizationId !== organizationId) return undefined;

    const updatedBeneficiary = { ...beneficiary, ...updates, updatedAt: new Date() };
    this.beneficiaries.set(id, updatedBeneficiary);
    return updatedBeneficiary;
  }

  // Volunteers
  async getVolunteers(organizationId: string): Promise<Volunteer[]> {
    return Array.from(this.volunteers.values())
      .filter(volunteer => volunteer.organizationId === organizationId);
  }

  async getVolunteer(id: string, organizationId: string): Promise<Volunteer | undefined> {
    const volunteer = this.volunteers.get(id);
    return volunteer && volunteer.organizationId === organizationId ? volunteer : undefined;
  }

  async createVolunteer(insertVolunteer: InsertVolunteer): Promise<Volunteer> {
    const id = this.generateId();
    const volunteer: Volunteer = {
      ...insertVolunteer,
      id,
      joinedDate: insertVolunteer.joinedDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.volunteers.set(id, volunteer);
    return volunteer;
  }

  async updateVolunteer(id: string, organizationId: string, updates: Partial<Volunteer>): Promise<Volunteer | undefined> {
    const volunteer = this.volunteers.get(id);
    if (!volunteer || volunteer.organizationId !== organizationId) return undefined;

    const updatedVolunteer = { ...volunteer, ...updates, updatedAt: new Date() };
    this.volunteers.set(id, updatedVolunteer);
    return updatedVolunteer;
  }

  // Donations
  async getDonations(organizationId: string): Promise<Donation[]> {
    return Array.from(this.donations.values())
      .filter(donation => donation.organizationId === organizationId);
  }

  async getDonation(id: string, organizationId: string): Promise<Donation | undefined> {
    const donation = this.donations.get(id);
    return donation && donation.organizationId === organizationId ? donation : undefined;
  }

  async createDonation(insertDonation: InsertDonation): Promise<Donation> {
    const id = this.generateId();
    const donation: Donation = {
      ...insertDonation,
      id,
      donationDate: insertDonation.donationDate || new Date(),
      createdAt: new Date()
    };
    this.donations.set(id, donation);
    return donation;
  }

  async updateDonation(id: string, organizationId: string, updates: Partial<Donation>): Promise<Donation | undefined> {
    const donation = this.donations.get(id);
    if (!donation || donation.organizationId !== organizationId) {
      return undefined;
    }

    const updatedDonation = { ...donation, ...updates };
    this.donations.set(id, updatedDonation);
    return updatedDonation;
  }

  // Dashboard metrics
  async getDashboardMetrics(organizationId: string): Promise<{
    activeProjects: number;
    totalDonated: number;
    beneficiariesServed: number;
    activeVolunteers: number;
  }> {
    const projects = await this.getProjects(organizationId);
    const donations = await this.getDonations(organizationId);
    const beneficiaries = await this.getBeneficiaries(organizationId);
    const volunteers = await this.getVolunteers(organizationId);

    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalDonated = donations
      .filter(d => d.paymentStatus === 'completed')
      .reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const beneficiariesServed = beneficiaries.length;
    const activeVolunteers = volunteers.filter(v => v.status === 'active').length;

    return {
      activeProjects,
      totalDonated,
      beneficiariesServed,
      activeVolunteers
    };
  }
}

import { PostgresStorage } from './postgres-storage';
import { eq, and } from 'drizzle-orm';

export class PostgresStorage implements IStorage {
  constructor(private db: any) {}

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await this.db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await this.db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [organization] = await this.db.select().from(organizations).where(eq(organizations.slug, slug));
    return organization;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [newOrg] = await this.db.insert(organizations).values(org).returning();
    return newOrg;
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const roles = await this.db.select().from(userRoles).where(eq(userRoles.userId, userId));
    const organizationIds = roles.map(role => role.organizationId);
    return this.db.select().from(organizations).where(inArray(organizations.id, organizationIds));
  }

  // User roles
  async getUserRole(userId: string, organizationId: string): Promise<UserRole | undefined> {
    const [role] = await this.db.select().from(userRoles).where(
      and(eq(userRoles.userId, userId), eq(userRoles.organizationId, organizationId))
    );
    return role;
  }

  async createUserRole(role: InsertUserRole): Promise<UserRole> {
    const [newRole] = await this.db.insert(userRoles).values(role).returning();
    return newRole;
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.db.select().from(userRoles).where(eq(userRoles.userId, userId));
  }

  // Projects
  async getProjects(organizationId: string): Promise<Project[]> {
    return this.db.select().from(projects).where(eq(projects.organizationId, organizationId));
  }

  async getProject(id: string, organizationId: string): Promise<Project | undefined> {
    const [project] = await this.db.select().from(projects).where(
      and(eq(projects.id, id), eq(projects.organizationId, organizationId))
    );
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await this.db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, organizationId: string, updates: Partial<Project>): Promise<Project | undefined> {
    const [updatedProject] = await this.db.update(projects)
      .set(updates)
      .where(and(eq(projects.id, id), eq(projects.organizationId, organizationId)))
      .returning();
    return updatedProject;
  }

  // Donors
  async getDonors(organizationId: string): Promise<Donor[]> {
    return this.db.select().from(donors).where(eq(donors.organizationId, organizationId));
  }

  async getDonor(id: string, organizationId: string): Promise<Donor | undefined> {
    const [donor] = await this.db.select().from(donors).where(
      and(eq(donors.id, id), eq(donors.organizationId, organizationId))
    );
    return donor;
  }

  async createDonor(donor: InsertDonor): Promise<Donor> {
    const [newDonor] = await this.db.insert(donors).values(donor).returning();
    return newDonor;
  }

  async updateDonor(id: string, organizationId: string, updates: Partial<Donor>): Promise<Donor | undefined> {
    const [updatedDonor] = await this.db.update(donors)
      .set(updates)
      .where(and(eq(donors.id, id), eq(donors.organizationId, organizationId)))
      .returning();
    return updatedDonor;
  }

  // Beneficiaries
  async getBeneficiaries(organizationId: string): Promise<Beneficiary[]> {
    return this.db.select().from(beneficiaries).where(eq(beneficiaries.organizationId, organizationId));
  }

  async getBeneficiary(id: string, organizationId: string): Promise<Beneficiary | undefined> {
    const [beneficiary] = await this.db.select().from(beneficiaries).where(
      and(eq(beneficiaries.id, id), eq(beneficiaries.organizationId, organizationId))
    );
    return beneficiary;
  }

  async createBeneficiary(beneficiary: InsertBeneficiary): Promise<Beneficiary> {
    const [newBeneficiary] = await this.db.insert(beneficiaries).values(beneficiary).returning();
    return newBeneficiary;
  }

  async updateBeneficiary(id: string, organizationId: string, updates: Partial<Beneficiary>): Promise<Beneficiary | undefined> {
    const [updatedBeneficiary] = await this.db.update(beneficiaries)
      .set(updates)
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.organizationId, organizationId)))
      .returning();
    return updatedBeneficiary;
  }

  // Volunteers
  async getVolunteers(organizationId: string): Promise<Volunteer[]> {
    return this.db.select().from(volunteers).where(eq(volunteers.organizationId, organizationId));
  }

  async getVolunteer(id: string, organizationId: string): Promise<Volunteer | undefined> {
    const [volunteer] = await this.db.select().from(volunteers).where(
      and(eq(volunteers.id, id), eq(volunteers.organizationId, organizationId))
    );
    return volunteer;
  }

  async createVolunteer(volunteer: InsertVolunteer): Promise<Volunteer> {
    const [newVolunteer] = await this.db.insert(volunteers).values(volunteer).returning();
    return newVolunteer;
  }

  async updateVolunteer(id: string, organizationId: string, updates: Partial<Volunteer>): Promise<Volunteer | undefined> {
    const [updatedVolunteer] = await this.db.update(volunteers)
      .set(updates)
      .where(and(eq(volunteers.id, id), eq(volunteers.organizationId, organizationId)))
      .returning();
    return updatedVolunteer;
  }

  // Donations
  async getDonations(organizationId: string): Promise<Donation[]> {
    return this.db.select().from(donations).where(eq(donations.organizationId, organizationId));
  }

  async getDonation(id: string, organizationId: string): Promise<Donation | undefined> {
    const [donation] = await this.db.select().from(donations).where(
      and(eq(donations.id, id), eq(donations.organizationId, organizationId))
    );
    return donation;
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [newDonation] = await this.db.insert(donations).values(donation).returning();
    return newDonation;
  }

  async updateDonation(id: string, organizationId: string, updates: Partial<Donation>): Promise<Donation | undefined> {
    const [updatedDonation] = await this.db.update(donations)
      .set(updates)
      .where(and(eq(donations.id, id), eq(donations.organizationId, organizationId)))
      .returning();
    return updatedDonation;
  }

  // Dashboard metrics
  async getDashboardMetrics(organizationId: string): Promise<{
    activeProjects: number;
    totalDonated: number;
    beneficiariesServed: number;
    activeVolunteers: number;
  }> {
    const projects = await this.getProjects(organizationId);
    const donations = await this.getDonations(organizationId);
    const beneficiaries = await this.getBeneficiaries(organizationId);
    const volunteers = await this.getVolunteers(organizationId);

    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalDonated = donations
      .filter(d => d.paymentStatus === 'completed')
      .reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const beneficiariesServed = beneficiaries.length;
    const activeVolunteers = volunteers.filter(v => v.status === 'active').length;

    return {
      activeProjects,
      totalDonated,
      beneficiariesServed,
      activeVolunteers
    };
  }

  // Training methods
  async getCourses(organizationId: string) {
    return this.db.select().from(courses).where(eq(courses.organizationId, organizationId));
  }

  async createCourse(data: any) {
    const [course] = await this.db.insert(courses).values(data).returning();
    return course;
  }

  async getCourse(id: string, organizationId: string) {
    const [course] = await this.db.select().from(courses).where(
      and(eq(courses.id, id), eq(courses.organizationId, organizationId))
    );
    return course || null;
  }

  async updateCourse(id: string, organizationId: string, data: any) {
    const [course] = await this.db.update(courses)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(courses.id, id), eq(courses.organizationId, organizationId)))
      .returning();
    return course || null;
  }

  async deleteCourse(id: string, organizationId: string) {
    const result = await this.db.delete(courses)
      .where(and(eq(courses.id, id), eq(courses.organizationId, organizationId)));
    return result.rowCount > 0;
  }

  async getCourseModules(courseId: string) {
    return this.db.select().from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(courseModules.order);
  }

  async createCourseModule(data: any) {
    const [module] = await this.db.insert(courseModules).values(data).returning();
    return module;
  }

  async updateCourseModule(moduleId: string, data: any) {
    const [module] = await this.db.update(courseModules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courseModules.id, moduleId))
      .returning();
    return module || null;
  }

  async deleteCourseModule(moduleId: string) {
    const result = await this.db.delete(courseModules)
      .where(eq(courseModules.id, moduleId));
    return result.rowCount > 0;
  }
}

import { inArray } from 'drizzle-orm';

export const storage = new PostgresStorage();