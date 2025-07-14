import { 
  users, organizations, userRoles, projects, donors, beneficiaries, 
  volunteers, donations, accountsReceivable, accountsPayable, funders,
  courses, courseModules, userCourseProgress, courseAssessments, certificates,
  userModuleFormSubmissions, userGrades,
  whitelabelSites, whitelabelTemplates, whitelabelPages, whitelabelMenus, 
  whitelabelForms, whitelabelFormSubmissions, permissionTemplates, accessControlSettings,
  type User, type InsertUser, type Organization, type InsertOrganization,
  type UserRole, type InsertUserRole, type Project, type InsertProject,
  type Donor, type InsertDonor, type Beneficiary, type InsertBeneficiary,
  type Volunteer, type InsertVolunteer, type Donation, type InsertDonation,
  type AccountsReceivable, type AccountsPayable, type Funder,
  type Course, type InsertCourse, type CourseModule, type InsertCourseModule,
  type UserCourseProgress, type InsertUserCourseProgress,
  type UserModuleFormSubmission, type InsertUserModuleFormSubmission,
  type CourseAssessment, type InsertCourseAssessment, type Certificate,
  type UserGrade, type InsertUserGrade,
  type WhitelabelSite, type InsertWhitelabelSite, type WhitelabelTemplate,
  type InsertWhitelabelTemplate, type WhitelabelPage, type InsertWhitelabelPage,
  type WhitelabelMenu, type InsertWhitelabelMenu, type WhitelabelForm,
  type InsertWhitelabelForm, type WhitelabelFormSubmission,
  type PermissionTemplate, type InsertPermissionTemplate,
  type AccessControlSettings, type InsertAccessControlSettings,
  type PasswordResetToken, type InsertPasswordResetToken
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getOrganizationUsers(organizationId: string): Promise<Array<User & { userRole: string }>>;

  // Organization operations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;
  getUserOrganizations(userId: string): Promise<Organization[]>;

  // Notifications operations
  getNotifications(userId: string, organizationId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string, organizationId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<void>;
  clearAllNotifications(userId: string, organizationId: string): Promise<void>;

  // User roles
  getUserRole(userId: string, organizationId: string): Promise<UserRole | undefined>;
  createUserRole(role: InsertUserRole): Promise<UserRole>;
  getUserRoles(userId: string): Promise<UserRole[]>;
  updateUserRole(userId: string, organizationId: string, newRole: string): Promise<void>;
  getUsersByRole(organizationId: string, role: string): Promise<User[]>;

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
  getBeneficiariesAsUsers(organizationId: string): Promise<User[]>;

  // Volunteers
  getVolunteers(organizationId: string): Promise<Volunteer[]>;
  getVolunteer(id: string, organizationId: string): Promise<Volunteer | undefined>;
  createVolunteer(volunteer: InsertVolunteer): Promise<Volunteer>;
  updateVolunteer(id: string, organizationId: string, updates: Partial<Volunteer>): Promise<Volunteer | undefined>;
  getVolunteersAsUsers(organizationId: string): Promise<User[]>;

  // Donations
  getDonations(organizationId: string): Promise<Donation[]>;
  getDonation(id: string, organizationId: string): Promise<Donation | undefined>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  updateDonation(id: string, organizationId: string, updates: Partial<Donation>): Promise<Donation | undefined>;

  // Dashboard
  getDashboardMetrics(organizationId: string): Promise<{
    activeProjects: number;
    totalDonated: number;
    beneficiariesServed: number;
    activeVolunteers: number;
  }>;

  // Project Indicators
  getProjectIndicators(organizationId: string): Promise<{
    projectsInPlanning: number;
    projectsInProgress: number;
    projectDetails: Array<{
      id: string;
      name: string;
      status: string;
      budget: number;
      spent: number;
      progress: number;
      milestones?: any;
    }>;
  }>;

  // Accounts Receivable
  getAccountsReceivable(organizationId: string): Promise<AccountsReceivable[]>;
  getAccountReceivable(id: string): Promise<AccountsReceivable | undefined>;
  createAccountReceivable(account: any): Promise<AccountsReceivable>;
  updateAccountReceivable(id: string, updates: Partial<AccountsReceivable>): Promise<AccountsReceivable | undefined>;

  // Accounts Payable
  getAccountsPayable(organizationId: string): Promise<AccountsPayable[]>;
  createAccountPayable(account: any): Promise<AccountsPayable>;
  updateAccountPayable(id: string, updates: any): Promise<AccountsPayable | undefined>;

  // Funders
  getFunders(organizationId: string): Promise<Funder[]>;
  createFunder(funder: any): Promise<Funder>;

  // Training Courses
  getCourses(organizationId: string): Promise<Course[]>;
  getCourse(id: string, organizationId: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, organizationId: string, updates: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: string, organizationId: string): Promise<boolean>;
  getCourseCategories(organizationId: string): Promise<string[]>;

  // Course Modules
  getCourseModules(courseId: string): Promise<CourseModule[]>;
  createCourseModule(module: InsertCourseModule): Promise<CourseModule>;
  updateCourseModule(id: string, updates: Partial<CourseModule>): Promise<CourseModule | undefined>;
  deleteCourseModule(id: string, courseId?: string): Promise<boolean>;

  // User Course Progress
  getUserCourseProgress(userId: string, courseId: string): Promise<UserCourseProgress | undefined>;
  updateUserCourseProgress(userId: string, courseId: string, updates: Partial<UserCourseProgress>): Promise<UserCourseProgress>;
  getUserCourseProgressList(userId: string): Promise<UserCourseProgress[]>;

  // Course Role Management
  getUserCourseRole(userId: string, courseId: string): Promise<any>;
  assignUserCourseRole(roleData: any): Promise<any>;
  updateUserCourseRole(userId: string, courseId: string, updates: any): Promise<any>;
  removeUserFromCourse(userId: string, courseId: string): Promise<boolean>;
  getCourseEnrollments(courseId: string): Promise<any[]>;
  syncCourseEnrollments(courseId: string): Promise<void>;
  getCourseStudents(courseId: string): Promise<any[]>;
  getCourseInstructors(courseId: string): Promise<any[]>;
  getUserCourses(userId: string): Promise<any[]>;
  getUserCourseRoles(userId: string): Promise<any[]>;

  // Course Assessments
  getCourseAssessments(courseId: string): Promise<CourseAssessment[]>;
  createCourseAssessment(assessment: InsertCourseAssessment): Promise<CourseAssessment>;

  // Module Form Submissions
  getUserModuleFormSubmission(userId: string, moduleId: string): Promise<UserModuleFormSubmission | undefined>;
  createUserModuleFormSubmission(submission: InsertUserModuleFormSubmission): Promise<UserModuleFormSubmission>;
  getModuleFormSubmissions(moduleId: string): Promise<UserModuleFormSubmission[]>;

  // User Certificates
  getUserCertificates(userId: string): Promise<Certificate[]>;
  createCertificate(certificate: any): Promise<Certificate>;
  getUserCertificate(userId: string, courseId: string): Promise<Certificate | undefined>;
  isCourseEligibleForCertificate(userId: string, courseId: string): Promise<{ eligible: boolean; reason?: string; courseCompletion?: any }>;

  // Whitelabel Sites
  getWhitelabelSite(organizationId: string): Promise<WhitelabelSite | undefined>;
  createWhitelabelSite(site: InsertWhitelabelSite): Promise<WhitelabelSite>;
  updateWhitelabelSite(organizationId: string, updates: Partial<WhitelabelSite>): Promise<WhitelabelSite | undefined>;

  // Whitelabel Templates
  getWhitelabelTemplates(): Promise<WhitelabelTemplate[]>;
  getWhitelabelTemplate(id: string): Promise<WhitelabelTemplate | undefined>;
  createWhitelabelTemplate(template: InsertWhitelabelTemplate): Promise<WhitelabelTemplate>;

  // Whitelabel Pages
  getSitePages(siteId: string): Promise<WhitelabelPage[]>;
  getPage(id: string, siteId: string): Promise<WhitelabelPage | undefined>;
  getPageBySlug(slug: string, siteId: string): Promise<WhitelabelPage | undefined>;
  createPage(page: InsertWhitelabelPage): Promise<WhitelabelPage>;
  updatePage(id: string, siteId: string, updates: Partial<WhitelabelPage>): Promise<WhitelabelPage | undefined>;
  deletePage(id: string, siteId: string): Promise<boolean>;

  // Whitelabel Menus
  getSiteMenus(siteId: string): Promise<WhitelabelMenu[]>;
  createMenu(menu: InsertWhitelabelMenu): Promise<WhitelabelMenu>;
  updateMenu(id: string, updates: Partial<WhitelabelMenu>): Promise<WhitelabelMenu | undefined>;
  deleteMenu(id: string): Promise<boolean>;

  // Whitelabel Forms
  getSiteForms(siteId: string): Promise<WhitelabelForm[]>;
  getForm(id: string, siteId: string): Promise<WhitelabelForm | undefined>;
  createForm(form: InsertWhitelabelForm): Promise<WhitelabelForm>;
  updateForm(id: string, siteId: string, updates: Partial<WhitelabelForm>): Promise<WhitelabelForm | undefined>;
  deleteForm(id: string, siteId: string): Promise<boolean>;

  // Form Submissions
  getFormSubmissions(formId: string): Promise<WhitelabelFormSubmission[]>;
  createFormSubmission(submission: Omit<WhitelabelFormSubmission, 'id' | 'createdAt'>): Promise<WhitelabelFormSubmission>;

  // Permission Management
  getAccessControlSettings(organizationId: string): Promise<AccessControlSettings | undefined>;
  createAccessControlSettings(settings: InsertAccessControlSettings): Promise<AccessControlSettings>;
  updateAccessControlSettings(organizationId: string, updates: Partial<AccessControlSettings>): Promise<AccessControlSettings | undefined>;
  
  getPermissionTemplates(organizationId: string): Promise<PermissionTemplate[]>;
  getPermissionTemplate(id: string, organizationId: string): Promise<PermissionTemplate | undefined>;
  createPermissionTemplate(template: InsertPermissionTemplate): Promise<PermissionTemplate>;
  updatePermissionTemplate(id: string, organizationId: string, updates: Partial<PermissionTemplate>): Promise<PermissionTemplate | undefined>;
  deletePermissionTemplate(id: string, organizationId: string): Promise<boolean>;

  // User Grades
  getUserModuleGrade(userId: string, moduleId: string): Promise<any | undefined>;
  createUserGrade(grade: any): Promise<any>;
  updateUserGrade(id: string, updates: any): Promise<any | undefined>;
  getUserCourseGrades(userId: string, courseId: string): Promise<any[]>;
  getUserGrades(courseId: string): Promise<any[]>;

  // Course Management
  getCourseEnrollments(courseId: string): Promise<any[]>;
  getUserCourseRoles(courseId: string): Promise<any[]>;
  getBeneficiaryByUserId(userId: string): Promise<any | undefined>;

  // Attendance Management
  getCourseAttendance(courseId: string, date: string): Promise<any[]>;
  markAttendance(attendance: any): Promise<any>;
  getCourseAttendanceSummary(courseId: string): Promise<any[]>;
  getUserAttendanceRecords(userId: string, courseId: string): Promise<any[]>;

  // User Account Sync
  syncUsersForVolunteersAndBeneficiaries(organizationId: string): Promise<void>;

  // Password Reset Tokens
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
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
    return Math.random().toString(36).substr(2, 9);
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
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null
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
    const userRolesList = Array.from(this.userRoles.values())
      .filter(role => role.userId === userId && role.isActive);

    const organizationIds = userRolesList.map(role => role.organizationId);

    const organizations = Array.from(this.organizations.values())
      .filter(org => organizationIds.includes(org.id));

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
      createdAt: new Date()
    };
    this.userRoles.set(id, role);
    return role;
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return Array.from(this.userRoles.values())
      .filter(role => role.userId === userId);
  }

  // Stub implementations for all other methods
  async getProjects(organizationId: string): Promise<Project[]> { return []; }
  async getProject(id: string, organizationId: string): Promise<Project | undefined> { return undefined; }
  async createProject(project: InsertProject): Promise<Project> { throw new Error("Not implemented in MemStorage"); }
  async updateProject(id: string, organizationId: string, updates: Partial<Project>): Promise<Project | undefined> { return undefined; }

  async getDonors(organizationId: string): Promise<Donor[]> { return []; }
  async getDonor(id: string, organizationId: string): Promise<Donor | undefined> { return undefined; }
  async createDonor(donor: InsertDonor): Promise<Donor> { throw new Error("Not implemented in MemStorage"); }
  async updateDonor(id: string, organizationId: string, updates: Partial<Donor>): Promise<Donor | undefined> { return undefined; }

  async getBeneficiaries(organizationId: string): Promise<Beneficiary[]> { return []; }
  async getBeneficiary(id: string, organizationId: string): Promise<Beneficiary | undefined> { return undefined; }
  async createBeneficiary(beneficiary: InsertBeneficiary): Promise<Beneficiary> { throw new Error("Not implemented in MemStorage"); }
  async updateBeneficiary(id: string, organizationId: string, updates: Partial<Beneficiary>): Promise<Beneficiary | undefined> { return undefined; }
  async getBeneficiariesAsUsers(organizationId: string): Promise<User[]> { return []; }

  async getVolunteers(organizationId: string): Promise<Volunteer[]> { return []; }
  async getVolunteer(id: string, organizationId: string): Promise<Volunteer | undefined> { return undefined; }
  async createVolunteer(volunteer: InsertVolunteer): Promise<Volunteer> { throw new Error("Not implemented in MemStorage"); }
  async updateVolunteer(id: string, organizationId: string, updates: Partial<Volunteer>): Promise<Volunteer | undefined> { return undefined; }
  async getVolunteersAsUsers(organizationId: string): Promise<User[]> { return []; }

  async getDonations(organizationId: string): Promise<Donation[]> { return []; }
  async getDonation(id: string, organizationId: string): Promise<Donation | undefined> { return undefined; }
  async createDonation(donation: InsertDonation): Promise<Donation> { throw new Error("Not implemented in MemStorage"); }
  async updateDonation(id: string, organizationId: string, updates: Partial<Donation>): Promise<Donation | undefined> { return undefined; }

  async getDashboardMetrics(organizationId: string): Promise<{ activeProjects: number; totalDonated: number; beneficiariesServed: number; activeVolunteers: number; }> {
    return { activeProjects: 0, totalDonated: 0, beneficiariesServed: 0, activeVolunteers: 0 };
  }

  async getProjectIndicators(organizationId: string): Promise<{
    projectsInPlanning: number;
    projectsInProgress: number;
    projectDetails: Array<{
      id: string;
      name: string;
      status: string;
      budget: number;
      spent: number;
      progress: number;
      milestones?: any;
    }>;
  }> {
    return { projectsInPlanning: 0, projectsInProgress: 0, projectDetails: [] };
  }

  async getAccountsReceivable(organizationId: string): Promise<AccountsReceivable[]> { return []; }
  async getAccountReceivable(id: string): Promise<AccountsReceivable | undefined> { return undefined; }
  async createAccountReceivable(account: any): Promise<AccountsReceivable> { throw new Error("Not implemented in MemStorage"); }
  async updateAccountReceivable(id: string, updates: Partial<AccountsReceivable>): Promise<AccountsReceivable | undefined> { throw new Error("Not implemented in MemStorage"); }

  async getAccountsPayable(organizationId: string): Promise<AccountsPayable[]> { return []; }
  async createAccountPayable(account: any): Promise<AccountsPayable> { throw new Error("Not implemented in MemStorage"); }
  async updateAccountPayable(id: string, updates: any): Promise<AccountsPayable | undefined> { throw new Error("Not implemented in MemStorage"); }

  async getFunders(organizationId: string): Promise<Funder[]> { return []; }
  async createFunder(funder: any): Promise<Funder> { throw new Error("Not implemented in MemStorage"); }

  async getCourses(organizationId: string): Promise<Course[]> { return []; }
  async getCourse(id: string, organizationId: string): Promise<Course | undefined> { return undefined; }
  async createCourse(course: InsertCourse): Promise<Course> { throw new Error("Not implemented in MemStorage"); }
  async updateCourse(id: string, organizationId: string, updates: Partial<Course>): Promise<Course | undefined> { return undefined; }
  async deleteCourse(id: string, organizationId: string): Promise<boolean> { return false; }

  async getCourseModules(courseId: string): Promise<CourseModule[]> { return []; }
  async createCourseModule(module: InsertCourseModule): Promise<CourseModule> { throw new Error("Not implemented in MemStorage"); }
  async updateCourseModule(id: string, updates: Partial<CourseModule>): Promise<CourseModule | undefined> { return undefined; }
  async deleteCourseModule(id: string, courseId?: string): Promise<boolean> { return false; }

  async getUserCourseProgress(userId: string, courseId: string): Promise<UserCourseProgress | undefined> { return undefined; }
  async updateUserCourseProgress(userId: string, courseId: string, updates: Partial<UserCourseProgress>): Promise<UserCourseProgress> { throw new Error("Not implemented in MemStorage"); }
  async getUserCourseProgressList(userId: string): Promise<UserCourseProgress[]> { return []; }
  async getUserCourses(userId: string): Promise<any[]> { return []; }
  async getUserCourseRoles(userId: string): Promise<any[]> { return []; }
  
  // Course Role Management  
  async getUserCourseRole(userId: string, courseId: string): Promise<any> { return undefined; }
  async assignUserCourseRole(roleData: any): Promise<any> { throw new Error("Not implemented in MemStorage"); }
  async updateUserCourseRole(userId: string, courseId: string, updates: any): Promise<any> { return undefined; }
  async removeUserFromCourse(userId: string, courseId: string): Promise<boolean> { return false; }
  async getCourseEnrollments(courseId: string): Promise<any[]> { return []; }
  async syncCourseEnrollments(courseId: string): Promise<void> { /* No-op in MemStorage */ }

  async getCourseAssessments(courseId: string): Promise<CourseAssessment[]> { return []; }
  async createCourseAssessment(assessment: InsertCourseAssessment): Promise<CourseAssessment> { throw new Error("Not implemented in MemStorage"); }

  async getUserModuleFormSubmission(userId: string, moduleId: string): Promise<UserModuleFormSubmission | undefined> { return undefined; }
  async createUserModuleFormSubmission(submission: InsertUserModuleFormSubmission): Promise<UserModuleFormSubmission> { throw new Error("Not implemented in MemStorage"); }
  async getModuleFormSubmissions(moduleId: string): Promise<UserModuleFormSubmission[]> { return []; }

  async getUserCertificates(userId: string): Promise<Certificate[]> { return []; }
  async createCertificate(certificate: any): Promise<Certificate> { throw new Error("Not implemented in MemStorage"); }
  async getUserCertificate(userId: string, courseId: string): Promise<Certificate | undefined> { return undefined; }
  async isCourseEligibleForCertificate(userId: string, courseId: string): Promise<{ eligible: boolean; reason?: string; courseCompletion?: any }> { 
    return { eligible: false, reason: "Not implemented in MemStorage" }; 
  }

  // User Grades methods
  async getUserModuleGrade(userId: string, moduleId: string): Promise<any | undefined> { return undefined; }
  async createUserGrade(grade: any): Promise<any> { throw new Error("Not implemented in MemStorage"); }
  async updateUserGrade(id: string, updates: any): Promise<any | undefined> { throw new Error("Not implemented in MemStorage"); }
  async getUserCourseGrades(userId: string, courseId: string): Promise<any[]> { return []; }

  // Attendance methods
  async getCourseAttendance(courseId: string, date: string): Promise<any[]> { return []; }
  async markAttendance(attendance: any): Promise<any> { throw new Error("Not implemented in MemStorage"); }
  async getCourseAttendanceSummary(courseId: string, userId?: string): Promise<any[]> { return []; }
  async getUserAttendanceRecords(userId: string, courseId: string): Promise<any[]> { return []; }
}

// Export a configured storage instance
import { PostgresStorage } from './postgres-storage';

export const storage: IStorage = new PostgresStorage();