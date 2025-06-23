import { eq, and, count, desc, sql, asc } from 'drizzle-orm';
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
  accountsReceivable,
  accountsPayable,
  funders,
  courses,
  courseModules,
  userCourseProgress,
  courseAssessments,
  certificates,
  whitelabelSites,
  whitelabelTemplates,
  whitelabelPages,
  whitelabelMenus,
  whitelabelForms,
  whitelabelFormSubmissions,
  activityLogs,
  subscriptionPlans,
  subscriptions,
  platformMetrics,
  systemAnnouncements,
  type Organization,
  type User,
  type UserRole,
  type Project,
  type Donor,
  type Beneficiary,
  type Volunteer,
  type Donation,
  type AccountsReceivable,
  type AccountsPayable,
  type Funder,
  type Course,
  type CourseModule,
  type UserCourseProgress,
  type CourseAssessment,
  type Certificate,
  type WhitelabelSite,
  type WhitelabelTemplate,
  type WhitelabelPage,
  type WhitelabelMenu,
  type WhitelabelForm,
  type WhitelabelFormSubmission,
  type ActivityLog,
  type InsertActivityLog,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Subscription,
  type InsertSubscription,
  type PlatformMetrics,
  type InsertPlatformMetrics,
  type SystemAnnouncement,
  type InsertSystemAnnouncement,
  type InsertWhitelabelSite,
  type InsertWhitelabelTemplate,
  type InsertWhitelabelPage,
  type InsertWhitelabelMenu,
  type InsertWhitelabelForm,
  type InsertOrganization,
  type InsertUser,
  type InsertUserRole,
  type InsertProject,
  type InsertDonor,
  type InsertBeneficiary,
  type InsertVolunteer,
  type InsertDonation,
  type InsertCourse,
  type InsertCourseModule,
  type InsertCourseAssessment
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

  async updateDonation(id: string, organizationId: string, updates: Partial<Donation>): Promise<Donation | undefined> {
    const result = await db
      .update(donations)
      .set(updates)
      .where(and(eq(donations.id, id), eq(donations.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  // Dashboard metrics
  async getDashboardMetrics(organizationId: string): Promise<{
    activeProjects: number;
    totalDonated: number;
    beneficiariesServed: number;
    activeVolunteers: number;
    projectsChange: string;
    donationsChange: string;
    beneficiariesChange: string;
    volunteersChange: string;
  }> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current metrics
    const [activeProjectsResult] = await db
      .select({ count: count() })
      .from(projects)
      .where(and(eq(projects.organizationId, organizationId), eq(projects.status, 'active')));

    const [totalDonatedResult] = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(CAST(${donations.amount} AS DECIMAL)), 0)`
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

    // Previous month metrics for comparison
    const [lastMonthProjectsResult] = await db
      .select({ count: count() })
      .from(projects)
      .where(and(
        eq(projects.organizationId, organizationId), 
        eq(projects.status, 'active'),
        sql`${projects.createdAt} < ${currentMonthStart}`
      ));

    const [lastMonthDonationsResult] = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(CAST(${donations.amount} AS DECIMAL)), 0)`
      })
      .from(donations)
      .where(and(
        eq(donations.organizationId, organizationId),
        sql`${donations.createdAt} >= ${lastMonthStart}`,
        sql`${donations.createdAt} <= ${lastMonthEnd}`
      ));

    const [thisMonthDonationsResult] = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(CAST(${donations.amount} AS DECIMAL)), 0)`
      })
      .from(donations)
      .where(and(
        eq(donations.organizationId, organizationId),
        sql`${donations.createdAt} >= ${currentMonthStart}`
      ));

    const [lastMonthBeneficiariesResult] = await db
      .select({ count: count() })
      .from(beneficiaries)
      .where(and(
        eq(beneficiaries.organizationId, organizationId),
        sql`${beneficiaries.createdAt} < ${currentMonthStart}`
      ));

    const [lastMonthVolunteersResult] = await db
      .select({ count: count() })
      .from(volunteers)
      .where(and(
        eq(volunteers.organizationId, organizationId),
        eq(volunteers.status, 'active'),
        sql`${volunteers.createdAt} < ${currentMonthStart}`
      ));

    // Calculate changes
    const currentProjects = activeProjectsResult?.count || 0;
    const lastProjects = lastMonthProjectsResult?.count || 0;
    const projectsDiff = currentProjects - lastProjects;

    const thisMonthDonations = parseFloat(thisMonthDonationsResult?.total || '0');
    const lastMonthDonations = parseFloat(lastMonthDonationsResult?.total || '0');
    const donationsPercent = lastMonthDonations > 0 ? 
      ((thisMonthDonations - lastMonthDonations) / lastMonthDonations * 100) : 0;

    const currentBeneficiaries = beneficiariesResult?.count || 0;
    const lastBeneficiaries = lastMonthBeneficiariesResult?.count || 0;
    const beneficiariesDiff = currentBeneficiaries - lastBeneficiaries;

    const currentVolunteers = volunteersResult?.count || 0;
    const lastVolunteers = lastMonthVolunteersResult?.count || 0;
    const volunteersDiff = currentVolunteers - lastVolunteers;

    return {
      activeProjects: currentProjects,
      totalDonated: parseFloat(totalDonatedResult?.total || '0'),
      beneficiariesServed: currentBeneficiaries,
      activeVolunteers: currentVolunteers,
      projectsChange: projectsDiff > 0 ? `+${projectsDiff} este mês` : 
                    projectsDiff < 0 ? `${projectsDiff} este mês` : 'Sem alteração',
      donationsChange: donationsPercent > 0 ? `+${donationsPercent.toFixed(1)}% este mês` :
                      donationsPercent < 0 ? `${donationsPercent.toFixed(1)}% este mês` : 'Sem alteração',
      beneficiariesChange: beneficiariesDiff > 0 ? `+${beneficiariesDiff} este mês` :
                          beneficiariesDiff < 0 ? `${beneficiariesDiff} este mês` : 'Sem alteração',
      volunteersChange: volunteersDiff > 0 ? `${volunteersDiff} novos este mês` :
                       volunteersDiff < 0 ? `${Math.abs(volunteersDiff)} menos este mês` : 'Sem alteração'
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

  // Training Courses
  async getCourses(organizationId: string): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.organizationId, organizationId))
      .orderBy(desc(courses.createdAt));
  }

  async getCourse(id: string, organizationId: string): Promise<Course | undefined> {
    const [result] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), eq(courses.organizationId, organizationId)))
      .limit(1);
    return result;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [result] = await db
      .insert(courses)
      .values(course)
      .returning();
    return result;
  }

  async updateCourse(id: string, organizationId: string, updates: Partial<Course>): Promise<Course | undefined> {
    const [result] = await db
      .update(courses)
      .set(updates)
      .where(and(eq(courses.id, id), eq(courses.organizationId, organizationId)))
      .returning();
    return result;
  }

  async deleteCourse(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(courses)
      .where(and(eq(courses.id, id), eq(courses.organizationId, organizationId)));
    return result.rowCount! > 0;
  }

  // Course Modules
  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    return await db
      .select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(asc(courseModules.orderIndex));
  }

  async createCourseModule(module: InsertCourseModule): Promise<CourseModule> {
    const [result] = await db
      .insert(courseModules)
      .values(module)
      .returning();
    return result;
  }

  async updateCourseModule(id: string, updates: Partial<CourseModule>): Promise<CourseModule | undefined> {
    const [result] = await db
      .update(courseModules)
      .set(updates)
      .where(eq(courseModules.id, id))
      .returning();
    return result;
  }

  async deleteCourseModule(id: string): Promise<boolean> {
    const result = await db
      .delete(courseModules)
      .where(eq(courseModules.id, id));
    return result.rowCount! > 0;
  }

  // User Course Progress
  async getUserCourseProgress(userId: string, courseId: string): Promise<UserCourseProgress | undefined> {
    const [result] = await db
      .select()
      .from(userCourseProgress)
      .where(and(eq(userCourseProgress.userId, userId), eq(userCourseProgress.courseId, courseId)))
      .limit(1);
    return result;
  }

  async updateUserCourseProgress(userId: string, courseId: string, updates: Partial<UserCourseProgress>): Promise<UserCourseProgress> {
    const existing = await this.getUserCourseProgress(userId, courseId);
    
    if (existing) {
      const [result] = await db
        .update(userCourseProgress)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(and(eq(userCourseProgress.userId, userId), eq(userCourseProgress.courseId, courseId)))
        .returning();
      return result;
    } else {
      // Create new progress record with proper types
      const newProgress = {
        userId,
        courseId,
        status: updates.status || "not_started",
        progress: updates.progress || 0,
        completedModules: updates.completedModules || [],
        startedAt: updates.startedAt || new Date(),
        timeSpent: updates.timeSpent || 0,
        lastAccessedAt: updates.lastAccessedAt || new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [result] = await db
        .insert(userCourseProgress)
        .values(newProgress)
        .returning();
      return result;
    }
  }

  async getUserCourseProgressList(userId: string): Promise<UserCourseProgress[]> {
    return await db
      .select()
      .from(userCourseProgress)
      .where(eq(userCourseProgress.userId, userId));
  }

  // Course Assessments
  async getCourseAssessments(courseId: string): Promise<CourseAssessment[]> {
    return await db
      .select()
      .from(courseAssessments)
      .where(eq(courseAssessments.courseId, courseId));
  }

  async createCourseAssessment(assessment: InsertCourseAssessment): Promise<CourseAssessment> {
    const [result] = await db
      .insert(courseAssessments)
      .values(assessment)
      .returning();
    return result;
  }

  // User Certificates
  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return await db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issuedAt));
  }

  async createCertificate(certificate: any): Promise<Certificate> {
    const [result] = await db
      .insert(certificates)
      .values(certificate)
      .returning();
    return result;
  }

  // Whitelabel Sites
  async getWhitelabelSite(organizationId: string): Promise<WhitelabelSite | undefined> {
    const [result] = await db
      .select()
      .from(whitelabelSites)
      .where(eq(whitelabelSites.organizationId, organizationId));
    return result;
  }

  async createWhitelabelSite(site: InsertWhitelabelSite): Promise<WhitelabelSite> {
    const [result] = await db
      .insert(whitelabelSites)
      .values(site)
      .returning();
    return result;
  }

  async updateWhitelabelSite(organizationId: string, updates: Partial<WhitelabelSite>): Promise<WhitelabelSite | undefined> {
    // Remove any timestamp fields from updates to avoid conflicts
    const { createdAt, updatedAt, ...cleanUpdates } = updates;
    
    const [result] = await db
      .update(whitelabelSites)
      .set({ ...cleanUpdates, updatedAt: new Date() })
      .where(eq(whitelabelSites.organizationId, organizationId))
      .returning();
    return result;
  }

  // Whitelabel Templates
  async getWhitelabelTemplates(): Promise<WhitelabelTemplate[]> {
    return await db
      .select()
      .from(whitelabelTemplates)
      .where(eq(whitelabelTemplates.isActive, true))
      .orderBy(whitelabelTemplates.category, whitelabelTemplates.name);
  }

  async getWhitelabelTemplate(id: string): Promise<WhitelabelTemplate | undefined> {
    const [result] = await db
      .select()
      .from(whitelabelTemplates)
      .where(eq(whitelabelTemplates.id, id));
    return result;
  }

  async createWhitelabelTemplate(template: InsertWhitelabelTemplate): Promise<WhitelabelTemplate> {
    const [result] = await db
      .insert(whitelabelTemplates)
      .values(template)
      .returning();
    return result;
  }

  // Whitelabel Pages
  async getSitePages(siteId: string): Promise<WhitelabelPage[]> {
    return await db
      .select()
      .from(whitelabelPages)
      .where(eq(whitelabelPages.siteId, siteId))
      .orderBy(whitelabelPages.order, whitelabelPages.title);
  }

  async getPage(id: string, siteId: string): Promise<WhitelabelPage | undefined> {
    const [result] = await db
      .select()
      .from(whitelabelPages)
      .where(and(
        eq(whitelabelPages.id, id),
        eq(whitelabelPages.siteId, siteId)
      ));
    return result;
  }

  async getPageBySlug(slug: string, siteId: string): Promise<WhitelabelPage | undefined> {
    const [result] = await db
      .select()
      .from(whitelabelPages)
      .where(and(
        eq(whitelabelPages.slug, slug),
        eq(whitelabelPages.siteId, siteId)
      ));
    return result;
  }

  async createPage(page: InsertWhitelabelPage): Promise<WhitelabelPage> {
    const [result] = await db
      .insert(whitelabelPages)
      .values(page)
      .returning();
    return result;
  }

  async updatePage(id: string, siteId: string, updates: Partial<WhitelabelPage>): Promise<WhitelabelPage | undefined> {
    const [result] = await db
      .update(whitelabelPages)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(whitelabelPages.id, id),
        eq(whitelabelPages.siteId, siteId)
      ))
      .returning();
    return result;
  }

  async deletePage(id: string, siteId: string): Promise<boolean> {
    const result = await db
      .delete(whitelabelPages)
      .where(and(
        eq(whitelabelPages.id, id),
        eq(whitelabelPages.siteId, siteId)
      ));
    return result.rowCount! > 0;
  }

  // Whitelabel Menus
  async getSiteMenus(siteId: string): Promise<WhitelabelMenu[]> {
    return await db
      .select()
      .from(whitelabelMenus)
      .where(and(
        eq(whitelabelMenus.siteId, siteId),
        eq(whitelabelMenus.isActive, true)
      ))
      .orderBy(whitelabelMenus.order);
  }

  async createMenu(menu: InsertWhitelabelMenu): Promise<WhitelabelMenu> {
    const [result] = await db
      .insert(whitelabelMenus)
      .values(menu)
      .returning();
    return result;
  }

  async updateMenu(id: string, updates: Partial<WhitelabelMenu>): Promise<WhitelabelMenu | undefined> {
    const [result] = await db
      .update(whitelabelMenus)
      .set(updates)
      .where(eq(whitelabelMenus.id, id))
      .returning();
    return result;
  }

  async deleteMenu(id: string): Promise<boolean> {
    const result = await db
      .delete(whitelabelMenus)
      .where(eq(whitelabelMenus.id, id));
    return result.rowCount! > 0;
  }

  // Whitelabel Forms
  async getSiteForms(siteId: string): Promise<WhitelabelForm[]> {
    return await db
      .select()
      .from(whitelabelForms)
      .where(and(
        eq(whitelabelForms.siteId, siteId),
        eq(whitelabelForms.isActive, true)
      ))
      .orderBy(whitelabelForms.name);
  }

  async getForm(id: string, siteId: string): Promise<WhitelabelForm | undefined> {
    const [result] = await db
      .select()
      .from(whitelabelForms)
      .where(and(
        eq(whitelabelForms.id, id),
        eq(whitelabelForms.siteId, siteId)
      ));
    return result;
  }

  async createForm(form: InsertWhitelabelForm): Promise<WhitelabelForm> {
    const [result] = await db
      .insert(whitelabelForms)
      .values(form)
      .returning();
    return result;
  }

  async updateForm(id: string, siteId: string, updates: Partial<WhitelabelForm>): Promise<WhitelabelForm | undefined> {
    const [result] = await db
      .update(whitelabelForms)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(whitelabelForms.id, id),
        eq(whitelabelForms.siteId, siteId)
      ))
      .returning();
    return result;
  }

  async deleteForm(id: string, siteId: string): Promise<boolean> {
    const result = await db
      .delete(whitelabelForms)
      .where(and(
        eq(whitelabelForms.id, id),
        eq(whitelabelForms.siteId, siteId)
      ));
    return result.rowCount! > 0;
  }

  // Form Submissions
  async getFormSubmissions(formId: string): Promise<WhitelabelFormSubmission[]> {
    return await db
      .select()
      .from(whitelabelFormSubmissions)
      .where(eq(whitelabelFormSubmissions.formId, formId))
      .orderBy(desc(whitelabelFormSubmissions.createdAt));
  }

  async createFormSubmission(submission: Omit<WhitelabelFormSubmission, 'id' | 'createdAt'>): Promise<WhitelabelFormSubmission> {
    const [result] = await db
      .insert(whitelabelFormSubmissions)
      .values(submission)
      .returning();
    return result;
  }

  // Activity logs methods
  async getActivityLogs(organizationId: string, limit: number = 10): Promise<ActivityLog[]> {
    return await db
      .select({
        id: activityLogs.id,
        organizationId: activityLogs.organizationId,
        userId: activityLogs.userId,
        type: activityLogs.type,
        title: activityLogs.title,
        description: activityLogs.description,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
        userName: users.name
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.organizationId, organizationId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async createActivityLog(activity: InsertActivityLog): Promise<ActivityLog> {
    const [result] = await db.insert(activityLogs).values(activity).returning();
    return result;
  }

  // Super Admin methods
  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async getPlatformOverview(): Promise<{
    totalOrganizations: number;
    activeOrganizations: number;
    totalUsers: number;
    totalRevenue: number;
    monthlyRecurringRevenue: number;
  }> {
    const [orgStats] = await db.select({
      total: count(),
      active: sql<number>`count(case when subscription_status = 'active' then 1 end)`
    }).from(organizations);

    const [userCount] = await db.select({ count: count() }).from(users);
    
    const [revenueStats] = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN sp.billing_cycle = 'yearly' THEN sp.price ELSE sp.price * 12 END), 0)`,
      mrr: sql<number>`COALESCE(SUM(CASE WHEN sp.billing_cycle = 'monthly' THEN sp.price ELSE sp.price / 12 END), 0)`
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(eq(subscriptions.status, 'active'));

    return {
      totalOrganizations: orgStats.total,
      activeOrganizations: orgStats.active,
      totalUsers: userCount.count,
      totalRevenue: revenueStats.totalRevenue || 0,
      monthlyRecurringRevenue: revenueStats.mrr || 0
    };
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).orderBy(asc(subscriptionPlans.sortOrder));
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [result] = await db.insert(subscriptionPlans).values(plan).returning();
    return result;
  }

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [result] = await db
      .update(subscriptionPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return result;
  }

  async deleteSubscriptionPlan(id: string): Promise<boolean> {
    const result = await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return result.rowCount > 0;
  }

  async getOrganizationSubscriptions(): Promise<(Subscription & { organizationName: string; planName: string })[]> {
    return await db
      .select({
        id: subscriptions.id,
        organizationId: subscriptions.organizationId,
        planId: subscriptions.planId,
        status: subscriptions.status,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        canceledAt: subscriptions.canceledAt,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        trialStart: subscriptions.trialStart,
        trialEnd: subscriptions.trialEnd,
        metadata: subscriptions.metadata,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        organizationName: organizations.name,
        planName: subscriptionPlans.name
      })
      .from(subscriptions)
      .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .orderBy(desc(subscriptions.createdAt));
  }

  async getSystemAnnouncements(): Promise<SystemAnnouncement[]> {
    return await db.select().from(systemAnnouncements).orderBy(desc(systemAnnouncements.createdAt));
  }

  async createSystemAnnouncement(announcement: InsertSystemAnnouncement): Promise<SystemAnnouncement> {
    const [result] = await db.insert(systemAnnouncements).values(announcement).returning();
    return result;
  }

  async updateSystemAnnouncement(id: string, updates: Partial<SystemAnnouncement>): Promise<SystemAnnouncement | undefined> {
    const [result] = await db
      .update(systemAnnouncements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systemAnnouncements.id, id))
      .returning();
    return result;
  }

  async deleteSystemAnnouncement(id: string): Promise<boolean> {
    const result = await db.delete(systemAnnouncements).where(eq(systemAnnouncements.id, id));
    return result.rowCount > 0;
  }

  async getPlatformMetrics(startDate?: Date, endDate?: Date): Promise<PlatformMetrics[]> {
    let query = db.select().from(platformMetrics);
    
    if (startDate && endDate) {
      query = query.where(and(
        gte(platformMetrics.date, startDate.toISOString().split('T')[0]),
        lte(platformMetrics.date, endDate.toISOString().split('T')[0])
      ));
    }
    
    return await query.orderBy(desc(platformMetrics.date));
  }

  async createPlatformMetrics(metrics: InsertPlatformMetrics): Promise<PlatformMetrics> {
    const [result] = await db.insert(platformMetrics).values(metrics).returning();
    return result;
  }
}