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
  }> {
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

    return {
      activeProjects: activeProjectsResult?.count || 0,
      totalDonated: parseFloat(totalDonatedResult?.total || '0'),
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
}