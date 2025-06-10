import { eq, and, count } from 'drizzle-orm';
import { db } from './db';
import { 
  organizations, 
  users, 
  userRoles, 
  projects, 
  donors, 
  beneficiaries, 
  volunteers, 
  donations,
  type Organization,
  type User,
  type UserRole,
  type Project,
  type Donor,
  type Beneficiary,
  type Volunteer,
  type Donation,
  type InsertOrganization,
  type InsertUser,
  type InsertUserRole,
  type InsertProject,
  type InsertDonor,
  type InsertBeneficiary,
  type InsertVolunteer,
  type InsertDonation
} from '../shared/schema';
import { IStorage } from './storage';

export class PostgresStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return result[0];
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    return result[0];
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const result = await db.insert(organizations).values(org).returning();
    return result[0];
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const result = await db
      .select()
      .from(organizations)
      .innerJoin(userRoles, eq(organizations.id, userRoles.organizationId))
      .where(and(eq(userRoles.userId, userId), eq(userRoles.isActive, true)));
    
    return result.map(row => row.organizations);
  }

  // User roles
  async getUserRole(userId: string, organizationId: string): Promise<UserRole | undefined> {
    const result = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.organizationId, organizationId)))
      .limit(1);
    return result[0];
  }

  async createUserRole(role: InsertUserRole): Promise<UserRole> {
    const result = await db.insert(userRoles).values(role).returning();
    return result[0];
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const result = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    return result;
  }

  // Projects
  async getProjects(organizationId: string): Promise<Project[]> {
    const result = await db.select().from(projects).where(eq(projects.organizationId, organizationId));
    return result;
  }

  async getProject(id: string, organizationId: string): Promise<Project | undefined> {
    const result = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.organizationId, organizationId)))
      .limit(1);
    return result[0];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  async updateProject(id: string, organizationId: string, updates: Partial<Project>): Promise<Project | undefined> {
    const result = await db
      .update(projects)
      .set(updates)
      .where(and(eq(projects.id, id), eq(projects.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  // Donors
  async getDonors(organizationId: string): Promise<Donor[]> {
    const result = await db.select().from(donors).where(eq(donors.organizationId, organizationId));
    return result;
  }

  async getDonor(id: string, organizationId: string): Promise<Donor | undefined> {
    const result = await db
      .select()
      .from(donors)
      .where(and(eq(donors.id, id), eq(donors.organizationId, organizationId)))
      .limit(1);
    return result[0];
  }

  async createDonor(donor: InsertDonor): Promise<Donor> {
    const result = await db.insert(donors).values(donor).returning();
    return result[0];
  }

  async updateDonor(id: string, organizationId: string, updates: Partial<Donor>): Promise<Donor | undefined> {
    const result = await db
      .update(donors)
      .set(updates)
      .where(and(eq(donors.id, id), eq(donors.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  // Beneficiaries
  async getBeneficiaries(organizationId: string): Promise<Beneficiary[]> {
    const result = await db.select().from(beneficiaries).where(eq(beneficiaries.organizationId, organizationId));
    return result;
  }

  async getBeneficiary(id: string, organizationId: string): Promise<Beneficiary | undefined> {
    const result = await db
      .select()
      .from(beneficiaries)
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.organizationId, organizationId)))
      .limit(1);
    return result[0];
  }

  async createBeneficiary(beneficiary: InsertBeneficiary): Promise<Beneficiary> {
    const result = await db.insert(beneficiaries).values(beneficiary).returning();
    return result[0];
  }

  async updateBeneficiary(id: string, organizationId: string, updates: Partial<Beneficiary>): Promise<Beneficiary | undefined> {
    const result = await db
      .update(beneficiaries)
      .set(updates)
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  // Volunteers
  async getVolunteers(organizationId: string): Promise<Volunteer[]> {
    const result = await db.select().from(volunteers).where(eq(volunteers.organizationId, organizationId));
    return result;
  }

  async getVolunteer(id: string, organizationId: string): Promise<Volunteer | undefined> {
    const result = await db
      .select()
      .from(volunteers)
      .where(and(eq(volunteers.id, id), eq(volunteers.organizationId, organizationId)))
      .limit(1);
    return result[0];
  }

  async createVolunteer(volunteer: InsertVolunteer): Promise<Volunteer> {
    const result = await db.insert(volunteers).values(volunteer).returning();
    return result[0];
  }

  async updateVolunteer(id: string, organizationId: string, updates: Partial<Volunteer>): Promise<Volunteer | undefined> {
    const result = await db
      .update(volunteers)
      .set(updates)
      .where(and(eq(volunteers.id, id), eq(volunteers.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  // Donations
  async getDonations(organizationId: string): Promise<Donation[]> {
    const result = await db.select().from(donations).where(eq(donations.organizationId, organizationId));
    return result;
  }

  async getDonation(id: string, organizationId: string): Promise<Donation | undefined> {
    const result = await db
      .select()
      .from(donations)
      .where(and(eq(donations.id, id), eq(donations.organizationId, organizationId)))
      .limit(1);
    return result[0];
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const result = await db.insert(donations).values(donation).returning();
    return result[0];
  }

  // Dashboard metrics
  async getDashboardMetrics(organizationId: string): Promise<{
    activeProjects: number;
    totalDonated: number;
    beneficiariesServed: number;
    activeVolunteers: number;
  }> {
    const [activeProjectsResult] = await db
      .select({ count: count() })
      .from(projects)
      .where(and(eq(projects.organizationId, organizationId), eq(projects.status, 'active')));

    const [totalDonatedResult] = await db
      .select({ 
        total: count(),
        sum: count() // Placeholder - would need SQL function for actual sum
      })
      .from(donations)
      .where(eq(donations.organizationId, organizationId));

    const [beneficiariesResult] = await db
      .select({ count: count() })
      .from(beneficiaries)
      .where(eq(beneficiaries.organizationId, organizationId));

    const [volunteersResult] = await db
      .select({ count: count() })
      .from(volunteers)
      .where(and(eq(volunteers.organizationId, organizationId), eq(volunteers.status, 'active')));

    return {
      activeProjects: activeProjectsResult?.count || 0,
      totalDonated: 45231.80, // Placeholder - would calculate from donations
      beneficiariesServed: beneficiariesResult?.count || 0,
      activeVolunteers: volunteersResult?.count || 0,
    };
  }

  // Accounts Receivable methods
  async getAccountsReceivable(organizationId: string): Promise<AccountsReceivable[]> {
    return await db
      .select()
      .from(accountsReceivable)
      .where(eq(accountsReceivable.organizationId, organizationId))
      .orderBy(desc(accountsReceivable.createdAt));
  }

  async createAccountReceivable(account: any): Promise<AccountsReceivable> {
    const [result] = await db
      .insert(accountsReceivable)
      .values(account)
      .returning();
    return result;
  }

  // Accounts Payable methods
  async getAccountsPayable(organizationId: string): Promise<AccountsPayable[]> {
    return await db
      .select()
      .from(accountsPayable)
      .where(eq(accountsPayable.organizationId, organizationId))
      .orderBy(desc(accountsPayable.createdAt));
  }

  async createAccountPayable(account: any): Promise<AccountsPayable> {
    const [result] = await db
      .insert(accountsPayable)
      .values(account)
      .returning();
    return result;
  }

  // Funders methods
  async getFunders(organizationId: string): Promise<Funder[]> {
    return await db
      .select()
      .from(funders)
      .where(eq(funders.organizationId, organizationId))
      .orderBy(desc(funders.createdAt));
  }

  async createFunder(funder: any): Promise<Funder> {
    const [result] = await db
      .insert(funders)
      .values(funder)
      .returning();
    return result;
  }
}