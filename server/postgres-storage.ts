import { eq, and, or, count, desc, sql, asc, gte, lte, isNotNull, isNull, inArray, gt } from 'drizzle-orm';
import { db } from './db';
import bcrypt from 'bcrypt';
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
  userModuleFormSubmissions,
  userGrades,
  courseAssessments,
  certificates,
  whitelabelSites,
  whitelabelTemplates,
  whitelabelPages,
  whitelabelMenus,
  whitelabelForms,
  whitelabelFormSubmissions,
  activityLogs,
  notifications,
  subscriptionPlans,
  subscriptions,
  platformMetrics,
  systemAnnouncements,
  permissionTemplates,
  accessControlSettings,
  passwordResetTokens,
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
  type UserModuleFormSubmission,
  type InsertUserModuleFormSubmission,
  type CourseAssessment,
  type Certificate,
  type UserCourseRole,
  type InsertUserCourseRole,
  userCourseRoles,
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
  type InsertCourseAssessment,
  type PermissionTemplate,
  type InsertPermissionTemplate,
  type AccessControlSettings,
  type InsertAccessControlSettings,
  type Notification,
  type InsertNotification,
  type PasswordResetToken,
  type InsertPasswordResetToken
} from '../shared/schema';
import { 
  volunteerCourseApplications,
  courseEnrollments,
  courseAttendance,
  userModuleProgress,
  courseInstructors
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
    // Primeiro, atualiza o usuário
    const result = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    const updatedUser = result[0];
    
    // Se o usuário foi atualizado e há mudanças de nome, email ou telefone, sincroniza com beneficiários e voluntários
    if (updatedUser && (updates.name || updates.email || updates.phone)) {
      
      // Sincroniza com tabela de beneficiários
      if (updates.name || updates.email) {
        const beneficiaryUpdates: Partial<Beneficiary> = {};
        if (updates.name) beneficiaryUpdates.name = updates.name;
        if (updates.email) beneficiaryUpdates.email = updates.email;
        
        if (Object.keys(beneficiaryUpdates).length > 0) {
          beneficiaryUpdates.updatedAt = new Date();
          await db
            .update(beneficiaries)
            .set(beneficiaryUpdates)
            .where(eq(beneficiaries.userId, id));
        }
      }
      
      // Sincroniza com tabela de voluntários
      if (updates.name || updates.email || updates.phone) {
        const volunteerUpdates: Partial<Volunteer> = {};
        if (updates.name) volunteerUpdates.name = updates.name;
        if (updates.email) volunteerUpdates.email = updates.email;
        if (updates.phone) volunteerUpdates.phone = updates.phone;
        
        if (Object.keys(volunteerUpdates).length > 0) {
          volunteerUpdates.updatedAt = new Date();
          await db
            .update(volunteers)
            .set(volunteerUpdates)
            .where(eq(volunteers.userId, id));
        }
      }
    }
    
    return updatedUser;
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

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const result = await db
      .update(organizations)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, id))
      .returning();
    
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

  async getUsersByRole(organizationId: string, role: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        position: users.position,
        passwordHash: users.passwordHash,
        isGlobalAdmin: users.isGlobalAdmin,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .where(
        and(
          eq(userRoles.organizationId, organizationId),
          eq(userRoles.role, role),
          eq(userRoles.isActive, true)
        )
      );
    
    return result;
  }

  // Notifications operations
  async getNotifications(userId: string, organizationId: string): Promise<Notification[]> {
    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.organizationId, organizationId),
          or(
            isNull(notifications.expiresAt),
            gt(notifications.expiresAt, new Date())
          )
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    
    return result;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsAsRead(userId: string, organizationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.organizationId, organizationId),
          eq(notifications.isRead, false)
        )
      );
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async clearAllNotifications(userId: string, organizationId: string): Promise<void> {
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.organizationId, organizationId)
        )
      );
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
    // Get all projects
    const projectList = await db.select().from(projects).where(eq(projects.organizationId, organizationId));
    
    // Calculate actual spent amounts based on donations and other expenses
    const enrichedProjects = await Promise.all(
      projectList.map(async (project) => {
        try {
          // Calculate total donations for this project
          const [donationsSum] = await db
            .select({ 
              total: sql<string>`COALESCE(SUM(CAST(${donations.amount} AS DECIMAL)), 0)`
            })
            .from(donations)
            .where(and(
              eq(donations.organizationId, organizationId),
              eq(donations.projectId, project.id)
            ));

          // Use donations as spent amount for budget tracking
          const calculatedSpentAmount = donationsSum?.total || '0.00';
          
          return {
            ...project,
            spentAmount: calculatedSpentAmount,
            // Add calculated completion rate based on milestones
            calculatedCompletionRate: this.calculateMilestoneProgress(project.milestones)
          };
        } catch (error) {
          console.error('Error calculating project financials for project', project.id, ':', error);
          // Return original project data if calculation fails
          return {
            ...project,
            calculatedCompletionRate: this.calculateMilestoneProgress(project.milestones)
          };
        }
      })
    );
    
    return enrichedProjects;
  }

  private calculateMilestoneProgress(milestones: any): number {
    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
      return 0;
    }
    const completedMilestones = milestones.filter((m: any) => m.completed === true).length;
    return Math.round((completedMilestones / milestones.length) * 100);
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

  async deleteProject(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.organizationId, organizationId)));
    return result.rowCount > 0;
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
    console.log('🗃️ PostgresStorage: Buscando beneficiários para org:', organizationId);
    const result = await db
      .select({
        id: beneficiaries.id,
        organizationId: beneficiaries.organizationId,
        userId: beneficiaries.userId,
        registrationNumber: beneficiaries.registrationNumber,
        name: beneficiaries.name,
        email: beneficiaries.email,
        document: beneficiaries.document,
        birthDate: beneficiaries.birthDate,
        contactInfo: beneficiaries.contactInfo,
        address: beneficiaries.address,
        emergencyContact: beneficiaries.emergencyContact,
        emergencyContactName: sql<string>`COALESCE(emergency_contact_name, '')`,
        emergencyContactPhone: sql<string>`COALESCE(emergency_contact_phone, '')`,
        needs: beneficiaries.needs,
        servicesReceived: beneficiaries.servicesReceived,
        status: beneficiaries.status,
        createdAt: beneficiaries.createdAt,
        updatedAt: beneficiaries.updatedAt
      })
      .from(beneficiaries)
      .where(eq(beneficiaries.organizationId, organizationId));
    console.log('🗃️ PostgresStorage: Resultado da query beneficiários:', result.length);
    return result as Beneficiary[];
  }

  // Get all users in organization with their roles
  async getOrganizationUsers(organizationId: string): Promise<Array<User & { userRole: string }>> {
    console.log('🗃️ PostgresStorage: Buscando todos os usuários da organização:', organizationId);
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        position: users.position,
        passwordHash: users.passwordHash,
        isGlobalAdmin: users.isGlobalAdmin,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        userRole: userRoles.role
      })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .where(eq(userRoles.organizationId, organizationId))
      .orderBy(users.name);
    
    console.log('🗃️ PostgresStorage: Usuários encontrados:', result.length);
    return result as Array<User & { userRole: string }>;
  }

  // Method to get beneficiaries as User format for course assignments
  async getBeneficiariesAsUsers(organizationId: string): Promise<User[]> {
    console.log('🗃️ PostgresStorage: Buscando beneficiários como usuários para org:', organizationId);
    const result = await db
      .select({
        id: beneficiaries.userId,
        name: beneficiaries.name,
        email: beneficiaries.email,
        phone: sql<string>`''`,
        position: sql<string>`'Beneficiário'`,
        createdAt: beneficiaries.createdAt
      })
      .from(beneficiaries)
      .where(and(
        eq(beneficiaries.organizationId, organizationId),
        isNotNull(beneficiaries.userId)
      ));
    
    console.log('🗃️ PostgresStorage: Beneficiários como usuários:', result.length);
    return result as User[];
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
    // Create user account if email is provided and userId is not set
    let userId = beneficiary.userId;
    
    if (beneficiary.email && !userId) {
      try {
        // Check if user already exists with this email
        const existingUser = await this.getUserByEmail(beneficiary.email);
        
        if (existingUser) {
          // Link existing user to this beneficiary
          userId = existingUser.id;
          
          // Create user role as beneficiary if not exists
          const existingRole = await this.getUserRole(existingUser.id, beneficiary.organizationId);
          if (!existingRole) {
            await this.createUserRole({
              userId: existingUser.id,
              organizationId: beneficiary.organizationId,
              role: 'beneficiary',
              grantedBy: null // system-generated
            });
          }
          
          console.log(`✅ Vinculada beneficiária à conta existente: ${beneficiary.email}`);
        } else {
          // Generate temporary password (first 4 chars of name + last 4 chars of registration number)
          const namePrefix = beneficiary.name.substring(0, 4).toLowerCase().replace(/\s/g, '');
          const numberSuffix = beneficiary.registrationNumber.slice(-4);
          const tempPassword = namePrefix + numberSuffix;
          
          // Create new user account
          const newUser = await this.createUser({
            email: beneficiary.email,
            passwordHash: await bcrypt.hash(tempPassword, 10),
            name: beneficiary.name,
            phone: beneficiary.contactInfo || undefined,
            position: 'Beneficiária'
          });

          // Create user role as beneficiary
          await this.createUserRole({
            userId: newUser.id,
            organizationId: beneficiary.organizationId,
            role: 'beneficiary',
            grantedBy: null // system-generated
          });

          userId = newUser.id;
          
          console.log(`✅ Conta criada para beneficiária: ${beneficiary.email} | Senha temporária: ${tempPassword}`);
        }
      } catch (error) {
        console.error('❌ Erro ao criar conta para beneficiária:', error);
        // Continue without user account if creation fails
      }
    }

    const result = await db.insert(beneficiaries).values({
      ...beneficiary,
      userId
    }).returning();
    return result[0];
  }

  async updateBeneficiary(id: string, organizationId: string, updates: Partial<Beneficiary>): Promise<Beneficiary | undefined> {
    // Primeiro, atualiza o beneficiário
    const result = await db
      .update(beneficiaries)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.organizationId, organizationId)))
      .returning();
    
    const updatedBeneficiary = result[0];
    
    // Se o beneficiário tem um userId associado, sincroniza os dados com a tabela users
    if (updatedBeneficiary?.userId && (updates.name || updates.email)) {
      const userUpdates: Partial<User> = {};
      
      if (updates.name) userUpdates.name = updates.name;
      if (updates.email) userUpdates.email = updates.email;
      
      if (Object.keys(userUpdates).length > 0) {
        userUpdates.updatedAt = new Date();
        await db
          .update(users)
          .set(userUpdates)
          .where(eq(users.id, updatedBeneficiary.userId));
      }
    }
    
    return updatedBeneficiary;
  }

  // Volunteers
  async getVolunteers(organizationId: string): Promise<Volunteer[]> {
    console.log('🗃️ PostgresStorage: Buscando voluntários para org:', organizationId);
    const result = await db
      .select({
        id: volunteers.id,
        organizationId: volunteers.organizationId,
        userId: volunteers.userId,
        volunteerNumber: volunteers.volunteerNumber,
        name: volunteers.name,
        email: volunteers.email,
        phone: volunteers.phone,
        skills: volunteers.skills,
        availability: volunteers.availability,
        backgroundCheckStatus: volunteers.backgroundCheckStatus,
        emergencyContact: volunteers.emergencyContact,
        totalHours: volunteers.totalHours,
        participationScore: volunteers.participationScore,
        status: volunteers.status,
        joinedDate: volunteers.joinedDate,
        createdAt: volunteers.createdAt,
        updatedAt: volunteers.updatedAt
      })
      .from(volunteers)
      .where(eq(volunteers.organizationId, organizationId));
    console.log('🗃️ PostgresStorage: Resultado da query voluntários:', result.length);
    console.log('🗃️ PostgresStorage: Dados dos voluntários:', result.map(v => ({ id: v.id, name: v.name, volunteerNumber: v.volunteerNumber })));
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

  // Method to get volunteers as User format for course assignments
  async getVolunteersAsUsers(organizationId: string): Promise<User[]> {
    console.log('🗃️ PostgresStorage: Buscando voluntários como usuários para org:', organizationId);
    const result = await db
      .select({
        id: volunteers.userId,
        name: volunteers.name,
        email: volunteers.email,
        phone: volunteers.phone,
        position: sql<string>`'Voluntário'`,
        createdAt: volunteers.createdAt
      })
      .from(volunteers)
      .where(and(
        eq(volunteers.organizationId, organizationId),
        isNotNull(volunteers.userId)
      ));
    
    console.log('🗃️ PostgresStorage: Voluntários como usuários:', result.length);
    return result as User[];
  }

  async createVolunteer(volunteer: InsertVolunteer): Promise<Volunteer> {
    // Create user account if email is provided and userId is not set
    let userId = volunteer.userId;
    
    if (volunteer.email && !userId) {
      try {
        // Check if user already exists with this email
        const existingUser = await this.getUserByEmail(volunteer.email);
        
        if (existingUser) {
          // Link existing user to this volunteer
          userId = existingUser.id;
          
          // Create user role as volunteer if not exists
          const existingRole = await this.getUserRole(existingUser.id, volunteer.organizationId);
          if (!existingRole) {
            await this.createUserRole({
              userId: existingUser.id,
              organizationId: volunteer.organizationId,
              role: 'volunteer',
              grantedBy: null // system-generated
            });
          }
          
          console.log(`✅ Vinculado voluntário à conta existente: ${volunteer.email}`);
        } else {
          // Generate temporary password (first 4 chars of name + VOL + last 3 chars of volunteer number)
          const namePrefix = volunteer.name.substring(0, 4).toLowerCase().replace(/\s/g, '');
          const numberSuffix = volunteer.volunteerNumber?.slice(-3) || '123';
          const tempPassword = namePrefix + 'vol' + numberSuffix;
          
          // Create new user account
          const newUser = await this.createUser({
            email: volunteer.email,
            passwordHash: await bcrypt.hash(tempPassword, 10),
            name: volunteer.name,
            phone: volunteer.phone || undefined,
            position: 'Voluntário'
          });

          // Create user role as volunteer
          await this.createUserRole({
            userId: newUser.id,
            organizationId: volunteer.organizationId,
            role: 'volunteer',
            grantedBy: null // system-generated
          });

          userId = newUser.id;
          
          console.log(`✅ Conta criada para voluntário: ${volunteer.email} | Senha temporária: ${tempPassword}`);
        }
      } catch (error) {
        console.error('❌ Erro ao criar conta para voluntário:', error);
        // Continue without user account if creation fails
      }
    }

    const result = await db.insert(volunteers).values({
      ...volunteer,
      userId
    }).returning();
    return result[0];
  }

  async updateVolunteer(id: string, organizationId: string, updates: Partial<Volunteer>): Promise<Volunteer | undefined> {
    // Primeiro, atualiza o voluntário
    const result = await db
      .update(volunteers)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(eq(volunteers.id, id), eq(volunteers.organizationId, organizationId)))
      .returning();
    
    const updatedVolunteer = result[0];
    
    // Se o voluntário tem um userId associado, sincroniza os dados com a tabela users
    if (updatedVolunteer?.userId && (updates.name || updates.email || updates.phone)) {
      const userUpdates: Partial<User> = {};
      
      if (updates.name) userUpdates.name = updates.name;
      if (updates.email) userUpdates.email = updates.email;
      if (updates.phone) userUpdates.phone = updates.phone;
      
      if (Object.keys(userUpdates).length > 0) {
        userUpdates.updatedAt = new Date();
        await db
          .update(users)
          .set(userUpdates)
          .where(eq(users.id, updatedVolunteer.userId));
      }
    }
    
    return updatedVolunteer;
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

  // Project Indicators for dashboard
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
    // Count projects by status
    const [planningResult] = await db
      .select({ count: count() })
      .from(projects)
      .where(and(eq(projects.organizationId, organizationId), eq(projects.status, 'planning')));

    const [progressResult] = await db
      .select({ count: count() })
      .from(projects)
      .where(and(eq(projects.organizationId, organizationId), eq(projects.status, 'active')));

    // Get all projects with their financial data
    const projectsData = await db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        budget: projects.budget,
        spentAmount: projects.spentAmount,
        milestones: projects.milestones,
        startDate: projects.startDate,
        endDate: projects.endDate
      })
      .from(projects)
      .where(eq(projects.organizationId, organizationId))
      .orderBy(projects.name);

    // Calculate actual spent amount from accounts payable for each project
    const projectDetails = await Promise.all(
      projectsData.map(async (project) => {
        // Get total spent from accounts payable for this project
        const [spentResult] = await db
          .select({ 
            total: sql<string>`COALESCE(SUM(CAST(${accountsPayable.amount} AS DECIMAL)), 0)`
          })
          .from(accountsPayable)
          .where(and(
            eq(accountsPayable.organizationId, organizationId),
            eq(accountsPayable.projectId, project.id),
            eq(accountsPayable.status, 'paid')
          ));

        const actualSpent = parseFloat(spentResult?.total || '0');
        const budget = parseFloat(project.budget || '0');
        
        // Calculate progress based on time elapsed (if dates available) or budget spent
        let progress = 0;
        if (project.startDate && project.endDate) {
          const start = new Date(project.startDate);
          const end = new Date(project.endDate);
          const now = new Date();
          
          if (now >= start && now <= end) {
            const totalDuration = end.getTime() - start.getTime();
            const elapsed = now.getTime() - start.getTime();
            progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
          } else if (now > end) {
            progress = 100;
          }
        } else if (budget > 0) {
          // Use budget spent as progress indicator
          progress = Math.min(100, (actualSpent / budget) * 100);
        }

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          budget: budget,
          spent: actualSpent,
          progress: Math.round(progress),
          milestones: project.milestones
        };
      })
    );

    return {
      projectsInPlanning: planningResult?.count || 0,
      projectsInProgress: progressResult?.count || 0,
      projectDetails
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

  async getAccountReceivable(id: string): Promise<AccountsReceivable | undefined> {
    const [result] = await db
      .select()
      .from(accountsReceivable)
      .where(eq(accountsReceivable.id, id));
    return result;
  }

  async updateAccountReceivable(id: string, updates: Partial<AccountsReceivable>): Promise<AccountsReceivable | undefined> {
    const [result] = await db
      .update(accountsReceivable)
      .set(updates)
      .where(eq(accountsReceivable.id, id))
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

  async updateAccountPayable(id: string, updates: any): Promise<AccountsPayable | undefined> {
    const [result] = await db
      .update(accountsPayable)
      .set(updates)
      .where(eq(accountsPayable.id, id))
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
    try {
      // Verificar se o curso existe na organização
      const courseCheck = await db.execute(sql`
        SELECT id FROM courses WHERE id = ${id} AND organization_id = ${organizationId}
      `);
      
      if (courseCheck.rows.length === 0) {
        return false;
      }

      // Deletar todos os dados relacionados em sequência (sem transação devido ao neon-http driver)
      // 1. Deletar progress do usuário no curso
      await db.execute(sql`DELETE FROM user_course_progress WHERE course_id = ${id}`);

      // 2. Deletar roles de usuário no curso
      await db.execute(sql`DELETE FROM user_course_roles WHERE course_id = ${id}`);

      // 3. Deletar submissões de formulários de módulos (se a tabela existir)
      // Nota: A tabela user_module_form_submissions não existe no banco atual
      // Esta linha foi removida para evitar erro de "relation does not exist"

      // 4. Deletar submissões de formulários dos módulos
      await db.execute(sql`
        DELETE FROM user_module_form_submissions 
        WHERE module_id IN (
          SELECT id FROM course_modules WHERE course_id = ${id}
        )
      `);

      // 5. Deletar progress de módulos
      await db.execute(sql`
        DELETE FROM user_module_progress 
        WHERE module_id IN (
          SELECT id FROM course_modules WHERE course_id = ${id}
        )
      `);

      // 6. Deletar certificados do curso
      await db.execute(sql`DELETE FROM certificates WHERE course_id = ${id}`);

      // 6. Deletar registros de frequência
      await db.execute(sql`
        DELETE FROM course_attendance 
        WHERE enrollment_id IN (
          SELECT id FROM course_enrollments WHERE course_id = ${id}
        )
      `);

      // 7. Deletar inscrições
      await db.execute(sql`DELETE FROM course_enrollments WHERE course_id = ${id}`);

      // 8. Deletar instrutores
      await db.execute(sql`DELETE FROM course_instructors WHERE course_id = ${id}`);

      // 9. Deletar avaliações
      await db.execute(sql`DELETE FROM course_assessments WHERE course_id = ${id}`);

      // 10. Deletar notas dos usuários nos módulos do curso
      await db.execute(sql`
        DELETE FROM user_grades 
        WHERE module_id IN (
          SELECT id FROM course_modules WHERE course_id = ${id}
        )
      `);

      // 11. Deletar módulos
      await db.execute(sql`DELETE FROM course_modules WHERE course_id = ${id}`);

      // 12. Finalmente deletar o curso
      await db.execute(sql`
        DELETE FROM courses WHERE id = ${id} AND organization_id = ${organizationId}
      `);

      return true;
    } catch (error) {
      console.error('Delete course error:', error);
      throw error;
    }
  }

  async getCourseCategories(organizationId: string): Promise<string[]> {
    const result = await db
      .selectDistinct({ category: courses.category })
      .from(courses)
      .where(and(
        eq(courses.organizationId, organizationId),
        isNotNull(courses.category)
      ))
      .orderBy(asc(courses.category));
    
    const categories = result.map(row => row.category).filter(Boolean);
    
    // Adicionar categorias padrão caso não existam outras
    const defaultCategories = [
      'Tecnologia',
      'Empreendedorismo', 
      'Direitos',
      'Saúde',
      'Comunicação'
    ];
    
    // Combinar e remover duplicatas
    const allCategories = categories.concat(defaultCategories);
    const uniqueCategories = allCategories.filter((item, index) => allCategories.indexOf(item) === index);
    
    return uniqueCategories.sort();
  }

  // Course Modules
  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    console.log("📚 PostgresStorage: Buscando módulos para curso:", courseId);
    
    const result = await db
      .select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(asc(courseModules.orderIndex));
    
    console.log("📚 PostgresStorage: Resultado da query módulos:", result.length);
    if (result.length > 0) {
      console.log("📚 PostgresStorage: Primeiro módulo encontrado:", JSON.stringify(result[0], null, 2));
    }
    
    return result;
  }

  async createCourseModule(module: InsertCourseModule): Promise<CourseModule> {
    // Garantir que campos numéricos tenham valores válidos
    const moduleData = {
      ...module,
      duration: module.duration && !isNaN(Number(module.duration)) ? Number(module.duration) : 30,
      orderIndex: module.orderIndex && !isNaN(Number(module.orderIndex)) ? Number(module.orderIndex) : undefined
    };

    // Se não foi fornecido order_index, calcular o próximo valor
    if (!moduleData.orderIndex) {
      const maxOrder = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(order_index), 0)` })
        .from(courseModules)
        .where(eq(courseModules.courseId, moduleData.courseId));
      
      moduleData.orderIndex = (maxOrder[0]?.maxOrder || 0) + 1;
    }

    const [result] = await db
      .insert(courseModules)
      .values(moduleData)
      .returning();
    return result;
  }

  async updateCourseModule(id: string, updates: Partial<CourseModule>): Promise<CourseModule | undefined> {
    // Remove campos que não devem ser atualizados
    const { id: _id, createdAt, updatedAt, ...updateData } = updates;
    
    // Adiciona updatedAt atual
    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date()
    };

    const [result] = await db
      .update(courseModules)
      .set(dataToUpdate)
      .where(eq(courseModules.id, id))
      .returning();
    return result;
  }

  async deleteCourseModule(id: string, courseId?: string): Promise<boolean> {
    // Se courseId foi fornecido, adicionar verificação de segurança
    if (courseId) {
      const result = await db
        .delete(courseModules)
        .where(and(
          eq(courseModules.id, id),
          eq(courseModules.courseId, courseId)
        ));
      return result.rowCount! > 0;
    }
    
    // Caso padrão sem validação de curso
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

  // Module Form Submissions
  async getUserModuleFormSubmission(userId: string, moduleId: string): Promise<UserModuleFormSubmission | undefined> {
    const [result] = await db
      .select()
      .from(userModuleFormSubmissions)
      .where(and(
        eq(userModuleFormSubmissions.userId, userId),
        eq(userModuleFormSubmissions.moduleId, moduleId)
      ));
    return result;
  }

  async createUserModuleFormSubmission(submission: any): Promise<UserModuleFormSubmission> {
    const [result] = await db
      .insert(userModuleFormSubmissions)
      .values(submission)
      .returning();
    return result;
  }

  async getModuleFormSubmissions(moduleId: string): Promise<UserModuleFormSubmission[]> {
    return await db
      .select()
      .from(userModuleFormSubmissions)
      .where(eq(userModuleFormSubmissions.moduleId, moduleId));
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

  async getUserCertificate(userId: string, courseId: string): Promise<Certificate | undefined> {
    const [result] = await db
      .select()
      .from(certificates)
      .where(and(
        eq(certificates.userId, userId),
        eq(certificates.courseId, courseId)
      ));
    return result;
  }

  async isCourseEligibleForCertificate(userId: string, courseId: string): Promise<{ eligible: boolean; reason?: string; courseCompletion?: any }> {
    try {
      // 1. Verificar se o curso existe e possui certificação habilitada
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId));
      
      if (!course) {
        return { eligible: false, reason: "Curso não encontrado" };
      }

      if (!course.certificateEnabled) {
        return { eligible: false, reason: "Certificação não habilitada para este curso" };
      }

      // 2. Verificar se já possui certificado para este curso
      const existingCertificate = await this.getUserCertificate(userId, courseId);
      if (existingCertificate) {
        return { eligible: false, reason: "Certificado já emitido para este curso" };
      }

      const passScore = course.passScore || 70;

      // 3. CURSOS PRESENCIAIS: Verificar nota final lançada pelo instrutor
      if (course.courseType === 'in_person' || course.courseType === 'presencial') {
        const finalGrades = await this.getUserCourseGrades(userId, courseId);
        
        // Buscar por qualquer nota final do curso
        const finalGrade = finalGrades.length > 0 ? finalGrades[0] : null;
        
        if (!finalGrade) {
          return { 
            eligible: false, 
            reason: "Aguardando avaliação final do instrutor" 
          };
        }

        if (!finalGrade.passed) {
          return { 
            eligible: false, 
            reason: `Nota insuficiente: ${Number(finalGrade.gradeScale).toFixed(1)} (mínimo: ${passScore/10})` 
          };
        }

        // Curso presencial elegível para certificação
        return { 
          eligible: true, 
          courseCompletion: {
            courseTitle: course.title,
            courseType: course.courseType,
            finalGrade: Number(finalGrade.gradeScale),
            passed: finalGrade.passed,
            gradedAt: finalGrade.gradedAt,
            feedback: finalGrade.feedback
          }
        };
      }

      // 4. CURSOS ONLINE: Lógica original baseada em módulos e formulários
      const courseModules = await this.getCourseModules(courseId);
      if (courseModules.length === 0) {
        return { eligible: false, reason: "Curso não possui módulos" };
      }

      const moduleIds = courseModules.map(m => m.id);
      const submissions = await db
        .select()
        .from(userModuleFormSubmissions)
        .where(and(
          eq(userModuleFormSubmissions.userId, userId),
          inArray(userModuleFormSubmissions.moduleId, moduleIds)
        ));

      // 5. Identificar módulos que possuem formulários
      const modulesWithForms = courseModules.filter(module => {
        if (!module.content || typeof module.content !== 'object') return false;
        const content = module.content as any;
        return content.blocks && Array.isArray(content.blocks) && 
               content.blocks.some((block: any) => block.type === 'form');
      });

      if (modulesWithForms.length === 0) {
        return { eligible: false, reason: "Curso não possui módulos com formulários para avaliação" };
      }

      // 6. Verificar se todos os módulos com formulários foram respondidos
      const submittedModuleIds = submissions.map(s => s.moduleId);
      const missingSubmissions = modulesWithForms.filter(module => 
        !submittedModuleIds.includes(module.id)
      );

      if (missingSubmissions.length > 0) {
        return { 
          eligible: false, 
          reason: `Módulos não completados: ${missingSubmissions.map(m => m.title).join(', ')}` 
        };
      }

      // 7. Calcular nota geral e verificar se atinge a nota mínima
      const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      const totalMaxScore = submissions.reduce((sum, sub) => sum + (sub.maxScore || 0), 0);
      const overallPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

      if (overallPercentage < passScore) {
        return { 
          eligible: false, 
          reason: `Nota insuficiente: ${overallPercentage.toFixed(1)}% (mínimo: ${passScore}%)` 
        };
      }

      // 8. Curso online elegível para certificação
      return { 
        eligible: true, 
        courseCompletion: {
          courseTitle: course.title,
          courseType: 'online',
          completedModules: modulesWithForms.length,
          totalModules: courseModules.length,
          overallScore: totalScore,
          overallMaxScore: totalMaxScore,
          overallPercentage: Math.round(overallPercentage),
          passScore,
          submissions
        }
      };

    } catch (error) {
      console.error('Error checking certificate eligibility:', error);
      return { eligible: false, reason: "Erro interno ao verificar elegibilidade" };
    }
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
    
    // Calculate revenue - using subquery to avoid alias issues
    const revenueQuery = db.select({
      totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN subscription_plans.billing_cycle = 'yearly' THEN subscription_plans.price ELSE subscription_plans.price * 12 END), 0)`,
      mrr: sql<number>`COALESCE(SUM(CASE WHEN subscription_plans.billing_cycle = 'monthly' THEN subscription_plans.price ELSE subscription_plans.price / 12 END), 0)`
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(eq(subscriptions.status, 'active'));

    const [revenueStats] = await revenueQuery;

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

  // Permission Management Methods
  async getAccessControlSettings(organizationId: string): Promise<AccessControlSettings | undefined> {
    const [result] = await db
      .select()
      .from(accessControlSettings)
      .where(eq(accessControlSettings.organizationId, organizationId));
    return result;
  }

  async createAccessControlSettings(settings: InsertAccessControlSettings): Promise<AccessControlSettings> {
    const [result] = await db
      .insert(accessControlSettings)
      .values(settings)
      .returning();
    return result;
  }

  async updateAccessControlSettings(organizationId: string, updates: Partial<AccessControlSettings>): Promise<AccessControlSettings | undefined> {
    const { createdAt, updatedAt, ...cleanUpdates } = updates;
    const [result] = await db
      .update(accessControlSettings)
      .set({ ...cleanUpdates, updatedAt: new Date() })
      .where(eq(accessControlSettings.organizationId, organizationId))
      .returning();
    return result;
  }

  async getPermissionTemplates(organizationId: string): Promise<PermissionTemplate[]> {
    return await db
      .select()
      .from(permissionTemplates)
      .where(and(
        eq(permissionTemplates.organizationId, organizationId),
        eq(permissionTemplates.isActive, true)
      ))
      .orderBy(permissionTemplates.role, permissionTemplates.name);
  }

  async getPermissionTemplate(id: string, organizationId: string): Promise<PermissionTemplate | undefined> {
    const [result] = await db
      .select()
      .from(permissionTemplates)
      .where(and(
        eq(permissionTemplates.id, id),
        eq(permissionTemplates.organizationId, organizationId)
      ));
    return result;
  }

  async createPermissionTemplate(template: InsertPermissionTemplate): Promise<PermissionTemplate> {
    const [result] = await db
      .insert(permissionTemplates)
      .values(template)
      .returning();
    return result;
  }

  async updatePermissionTemplate(id: string, organizationId: string, updates: Partial<PermissionTemplate>): Promise<PermissionTemplate | undefined> {
    const { createdAt, updatedAt, ...cleanUpdates } = updates;
    const [result] = await db
      .update(permissionTemplates)
      .set({ ...cleanUpdates, updatedAt: new Date() })
      .where(and(
        eq(permissionTemplates.id, id),
        eq(permissionTemplates.organizationId, organizationId)
      ))
      .returning();
    return result;
  }

  async deletePermissionTemplate(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .update(permissionTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(permissionTemplates.id, id),
        eq(permissionTemplates.organizationId, organizationId)
      ));
    return result.rowCount > 0;
  }

  // Course Enrollment and Role Management Methods

  async getUserCourseRole(userId: string, courseId: string): Promise<UserCourseRole | undefined> {
    const [role] = await db
      .select()
      .from(userCourseRoles)
      .where(and(
        eq(userCourseRoles.userId, userId),
        eq(userCourseRoles.courseId, courseId),
        eq(userCourseRoles.isActive, true)
      ));
    return role;
  }

  async assignUserCourseRole(roleData: InsertUserCourseRole): Promise<UserCourseRole> {
    // Create new role
    const [newRole] = await db
      .insert(userCourseRoles)
      .values(roleData)
      .returning();
    return newRole;
  }

  async updateUserCourseRole(userId: string, courseId: string, updates: Partial<UserCourseRole>): Promise<UserCourseRole | undefined> {
    const [updatedRole] = await db
      .update(userCourseRoles)
      .set({
        ...updates,
        assignedAt: new Date()
      })
      .where(and(
        eq(userCourseRoles.userId, userId),
        eq(userCourseRoles.courseId, courseId),
        eq(userCourseRoles.isActive, true)
      ))
      .returning();
    return updatedRole;
  }

  async getCourseEnrollments(courseId: string): Promise<Array<UserCourseRole & { user: User }>> {
    // First, sync user_course_progress with user_course_roles to ensure consistency
    await this.syncCourseEnrollments(courseId);
    
    const enrollments = await db
      .select({
        id: userCourseRoles.id,
        userId: userCourseRoles.userId,
        courseId: userCourseRoles.courseId,
        role: userCourseRoles.role,
        permissions: userCourseRoles.permissions,
        assignedBy: userCourseRoles.assignedBy,
        assignedAt: userCourseRoles.assignedAt,
        isActive: userCourseRoles.isActive,
        notes: userCourseRoles.notes,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          position: users.position,
          createdAt: users.createdAt
        }
      })
      .from(userCourseRoles)
      .innerJoin(users, eq(userCourseRoles.userId, users.id))
      .where(and(
        eq(userCourseRoles.courseId, courseId),
        eq(userCourseRoles.isActive, true)
      ))
      .orderBy(userCourseRoles.assignedAt);

    return enrollments as Array<UserCourseRole & { user: User }>;
  }

  // Sync method to ensure user_course_progress and user_course_roles are consistent
  async syncCourseEnrollments(courseId: string): Promise<void> {
    // 1. Find users in user_course_progress who are not in user_course_roles
    const missingRoles = await db
      .select({
        userId: userCourseProgress.userId,
        courseId: userCourseProgress.courseId,
        createdAt: userCourseProgress.createdAt
      })
      .from(userCourseProgress)
      .leftJoin(userCourseRoles, and(
        eq(userCourseProgress.userId, userCourseRoles.userId),
        eq(userCourseProgress.courseId, userCourseRoles.courseId)
      ))
      .where(and(
        eq(userCourseProgress.courseId, courseId),
        isNull(userCourseRoles.id)
      ));

    // Insert missing roles
    if (missingRoles.length > 0) {
      await db.insert(userCourseRoles).values(
        missingRoles.map(missing => ({
          userId: missing.userId,
          courseId: missing.courseId,
          role: 'student',
          isActive: true,
          assignedAt: missing.createdAt || new Date(),
          notes: 'Auto-inscrito'
        }))
      );
    }

    // 2. Find users in user_course_roles (students) who are not in user_course_progress
    const missingProgress = await db
      .select({
        userId: userCourseRoles.userId,
        courseId: userCourseRoles.courseId,
        assignedAt: userCourseRoles.assignedAt
      })
      .from(userCourseRoles)
      .leftJoin(userCourseProgress, and(
        eq(userCourseRoles.userId, userCourseProgress.userId),
        eq(userCourseRoles.courseId, userCourseProgress.courseId)
      ))
      .where(and(
        eq(userCourseRoles.courseId, courseId),
        eq(userCourseRoles.role, 'student'),
        eq(userCourseRoles.isActive, true),
        isNull(userCourseProgress.id)
      ));

    // Insert missing progress records
    if (missingProgress.length > 0) {
      await db.insert(userCourseProgress).values(
        missingProgress.map(missing => ({
          userId: missing.userId,
          courseId: missing.courseId,
          progress: 0,
          status: 'in_progress',
          startedAt: missing.assignedAt || new Date(),
          lastAccessedAt: new Date(),
          completedModules: [],
          timeSpent: 0
        }))
      );
    }
  }

  async getCourseStudents(courseId: string): Promise<Array<UserCourseRole & { user: User & { registrationNumber?: string } }>> {
    const students = await db
      .select({
        id: userCourseRoles.id,
        userId: userCourseRoles.userId,
        courseId: userCourseRoles.courseId,
        role: userCourseRoles.role,
        permissions: userCourseRoles.permissions,
        assignedBy: userCourseRoles.assignedBy,
        assignedAt: userCourseRoles.assignedAt,
        isActive: userCourseRoles.isActive,
        notes: userCourseRoles.notes,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          position: users.position,
          createdAt: users.createdAt
        },
        beneficiary: {
          registrationNumber: beneficiaries.registrationNumber
        }
      })
      .from(userCourseRoles)
      .innerJoin(users, eq(userCourseRoles.userId, users.id))
      .leftJoin(beneficiaries, eq(users.id, beneficiaries.userId))
      .where(and(
        eq(userCourseRoles.courseId, courseId),
        eq(userCourseRoles.role, 'student'),
        eq(userCourseRoles.isActive, true)
      ))
      .orderBy(userCourseRoles.assignedAt);

    // Add registrationNumber to user object
    const formattedStudents = students.map(student => ({
      ...student,
      user: {
        ...student.user,
        registrationNumber: student.beneficiary?.registrationNumber || 'N/A'
      }
    }));

    return formattedStudents as Array<UserCourseRole & { user: User & { registrationNumber: string } }>;
  }

  async getCourseInstructors(courseId: string): Promise<Array<UserCourseRole & { user: User }>> {
    const instructors = await db
      .select({
        id: userCourseRoles.id,
        userId: userCourseRoles.userId,
        courseId: userCourseRoles.courseId,
        role: userCourseRoles.role,
        permissions: userCourseRoles.permissions,
        assignedBy: userCourseRoles.assignedBy,
        assignedAt: userCourseRoles.assignedAt,
        isActive: userCourseRoles.isActive,
        notes: userCourseRoles.notes,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          position: users.position,
          createdAt: users.createdAt
        }
      })
      .from(userCourseRoles)
      .innerJoin(users, eq(userCourseRoles.userId, users.id))
      .where(and(
        eq(userCourseRoles.courseId, courseId),
        eq(userCourseRoles.role, 'instructor'),
        eq(userCourseRoles.isActive, true)
      ))
      .orderBy(userCourseRoles.assignedAt);

    return instructors as Array<UserCourseRole & { user: User }>;
  }

  async getUserCourses(userId: string): Promise<Array<UserCourseRole & { course: Course }>> {
    const userCourses = await db
      .select({
        id: userCourseRoles.id,
        userId: userCourseRoles.userId,
        courseId: userCourseRoles.courseId,
        role: userCourseRoles.role,
        permissions: userCourseRoles.permissions,
        assignedBy: userCourseRoles.assignedBy,
        assignedAt: userCourseRoles.assignedAt,
        isActive: userCourseRoles.isActive,
        notes: userCourseRoles.notes,
        course: {
          id: courses.id,
          organizationId: courses.organizationId,
          title: courses.title,
          description: courses.description,
          category: courses.category,
          level: courses.level,
          duration: courses.duration,
          coverImage: courses.coverImage,
          status: courses.status,
          requirements: courses.requirements,
          learningObjectives: courses.learningObjectives,
          tags: courses.tags,
          passScore: courses.passScore,
          certificateEnabled: courses.certificateEnabled,
          createdBy: courses.createdBy,
          createdAt: courses.createdAt,
          updatedAt: courses.updatedAt
        }
      })
      .from(userCourseRoles)
      .innerJoin(courses, eq(userCourseRoles.courseId, courses.id))
      .where(and(
        eq(userCourseRoles.userId, userId),
        eq(userCourseRoles.isActive, true)
      ))
      .orderBy(userCourseRoles.assignedAt);

    return userCourses as Array<UserCourseRole & { course: Course }>;
  }

  async getUserCourseRoles(userId: string): Promise<UserCourseRole[]> {
    const roles = await db
      .select()
      .from(userCourseRoles)
      .where(and(
        eq(userCourseRoles.userId, userId),
        eq(userCourseRoles.isActive, true)
      ))
      .orderBy(userCourseRoles.assignedAt);

    return roles;
  }

  async removeUserFromCourse(userId: string, courseId: string): Promise<boolean> {
    const result = await db
      .update(userCourseRoles)
      .set({ isActive: false })
      .where(and(
        eq(userCourseRoles.userId, userId),
        eq(userCourseRoles.courseId, courseId)
      ));
    return result.rowCount > 0;
  }

  async hasUserCourseAccess(userId: string, courseId: string, requiredRole?: string): Promise<boolean> {
    const role = await this.getUserCourseRole(userId, courseId);
    if (!role) return false;
    
    if (requiredRole) {
      return role.role === requiredRole;
    }
    
    return true;
  }

  async canUserAccessCourseModules(userId: string, courseId: string): Promise<boolean> {
    const role = await this.getUserCourseRole(userId, courseId);
    if (!role) return false;
    
    // Students and instructors can access course modules
    return ['student', 'instructor', 'assistant'].includes(role.role);
  }

  // User Grades methods
  async getUserModuleGrade(userId: string, moduleId: string): Promise<any | undefined> {
    const [result] = await db
      .select()
      .from(userGrades)
      .where(and(
        eq(userGrades.userId, userId),
        eq(userGrades.moduleId, moduleId),
        eq(userGrades.gradeType, 'module')
      ))
      .limit(1);
    
    return result;
  }

  async createUserGrade(grade: any): Promise<any> {
    const [result] = await db
      .insert(userGrades)
      .values(grade)
      .returning();
    
    return result;
  }

  async updateUserGrade(id: string, updates: any): Promise<any | undefined> {
    const [result] = await db
      .update(userGrades)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userGrades.id, id))
      .returning();
    
    return result;
  }

  async getUserCourseGrades(userId: string, courseId: string): Promise<any[]> {
    return await db
      .select()
      .from(userGrades)
      .where(and(
        eq(userGrades.userId, userId),
        eq(userGrades.courseId, courseId)
      ))
      .orderBy(desc(userGrades.gradedAt));
  }

  async getUserGrades(courseId: string): Promise<any[]> {
    return await db
      .select()
      .from(userGrades)
      .where(eq(userGrades.courseId, courseId))
      .orderBy(desc(userGrades.gradedAt));
  }



  async getBeneficiaryByUserId(userId: string): Promise<any | undefined> {
    const [result] = await db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.userId, userId))
      .limit(1);
    
    return result;
  }

  async getCourseAttendance(courseId: string, date: string): Promise<any[]> {
    return await db
      .select()
      .from(courseAttendance)
      .where(and(
        eq(courseAttendance.courseId, courseId),
        eq(courseAttendance.sessionDate, date)
      ))
      .orderBy(courseAttendance.markedAt);
  }

  async markAttendance(attendance: any): Promise<any> {
    const [result] = await db
      .insert(courseAttendance)
      .values(attendance)
      .returning();
    
    return result;
  }

  async getCourseAttendanceSummary(courseId: string, userId?: string): Promise<any[]> {
    if (userId) {
      // Query for specific user - shows only their attendance record for each session
      const result = await db
        .select({
          sessionDate: courseAttendance.sessionDate,
          sessionTitle: courseAttendance.sessionTitle,
          totalStudents: sql<number>`1`, // Only the selected student
          presentCount: sql<number>`CASE WHEN ${courseAttendance.attendanceStatus} = 'present' THEN 1 ELSE 0 END`,
          absentCount: sql<number>`CASE WHEN ${courseAttendance.attendanceStatus} = 'absent' THEN 1 ELSE 0 END`,
          lateCount: sql<number>`CASE WHEN ${courseAttendance.attendanceStatus} = 'late' THEN 1 ELSE 0 END`,
          excusedCount: sql<number>`CASE WHEN ${courseAttendance.attendanceStatus} = 'excused' THEN 1 ELSE 0 END`,
          createdAt: courseAttendance.createdAt
        })
        .from(courseAttendance)
        .where(and(
          eq(courseAttendance.courseId, courseId),
          eq(courseAttendance.userId, userId)
        ))
        .orderBy(desc(courseAttendance.sessionDate));

      return result;
    } else {
      // Query for all students - aggregated data
      const result = await db
        .select({
          sessionDate: courseAttendance.sessionDate,
          sessionTitle: courseAttendance.sessionTitle,
          totalStudents: sql<number>`COUNT(DISTINCT ${courseAttendance.userId})`,
          presentCount: sql<number>`COUNT(CASE WHEN ${courseAttendance.attendanceStatus} = 'present' THEN 1 END)`,
          absentCount: sql<number>`COUNT(CASE WHEN ${courseAttendance.attendanceStatus} = 'absent' THEN 1 END)`,
          lateCount: sql<number>`COUNT(CASE WHEN ${courseAttendance.attendanceStatus} = 'late' THEN 1 END)`,
          excusedCount: sql<number>`COUNT(CASE WHEN ${courseAttendance.attendanceStatus} = 'excused' THEN 1 END)`,
          createdAt: sql<string>`MIN(${courseAttendance.createdAt})`
        })
        .from(courseAttendance)
        .where(eq(courseAttendance.courseId, courseId))
        .groupBy(courseAttendance.sessionDate, courseAttendance.sessionTitle)
        .orderBy(desc(courseAttendance.sessionDate));

      return result;
    }
  }

  async getUserAttendanceRecords(userId: string, courseId: string): Promise<any[]> {
    const result = await db
      .select({
        id: courseAttendance.id,
        sessionDate: courseAttendance.sessionDate,
        sessionTitle: courseAttendance.sessionTitle,
        attendanceStatus: courseAttendance.attendanceStatus,
        userId: courseAttendance.userId,
        courseId: courseAttendance.courseId,
        createdAt: courseAttendance.createdAt
      })
      .from(courseAttendance)
      .where(and(
        eq(courseAttendance.courseId, courseId),
        eq(courseAttendance.userId, userId)
      ))
      .orderBy(desc(courseAttendance.sessionDate));

    return result;
  }

  async updateUserRole(userId: string, organizationId: string, newRole: string): Promise<void> {
    console.log('🗃️ PostgresStorage: Atualizando role do usuário:', { userId, organizationId, newRole });
    
    await db
      .update(userRoles)
      .set({
        role: newRole
      })
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.organizationId, organizationId)
      ));
    
    console.log('🗃️ PostgresStorage: Role do usuário atualizada com sucesso');
  }

  // Sync function to ensure all volunteers and beneficiaries have user accounts
  async syncUsersForVolunteersAndBeneficiaries(organizationId: string): Promise<void> {
    console.log('🔄 Iniciando sincronização de contas de usuário...');
    
    try {
      // Sync volunteers without user accounts
      const volunteersWithoutAccounts = await db
        .select()
        .from(volunteers)
        .where(and(
          eq(volunteers.organizationId, organizationId),
          isNotNull(volunteers.email),
          isNull(volunteers.userId)
        ));

      console.log(`📊 Encontrados ${volunteersWithoutAccounts.length} voluntários sem conta de usuário`);

      for (const volunteer of volunteersWithoutAccounts) {
        if (volunteer.email) {
          try {
            // Check if user already exists with this email
            const existingUser = await this.getUserByEmail(volunteer.email);
            
            if (existingUser) {
              // Link existing user to this volunteer
              await db
                .update(volunteers)
                .set({ userId: existingUser.id })
                .where(eq(volunteers.id, volunteer.id));
              
              // Create user role as volunteer if not exists
              const existingRole = await this.getUserRole(existingUser.id, organizationId);
              if (!existingRole) {
                await this.createUserRole({
                  userId: existingUser.id,
                  organizationId: organizationId,
                  role: 'volunteer',
                  grantedBy: null
                });
              }
              
              console.log(`✅ Vinculado voluntário ${volunteer.name} à conta existente: ${volunteer.email}`);
            } else {
              // Generate temporary password for volunteer
              const namePrefix = volunteer.name.substring(0, 4).toLowerCase().replace(/\s/g, '');
              const numberSuffix = volunteer.volunteerNumber?.slice(-3) || '123';
              const tempPassword = namePrefix + 'vol' + numberSuffix;
              
              // Create new user account
              const newUser = await this.createUser({
                email: volunteer.email,
                passwordHash: await bcrypt.hash(tempPassword, 10),
                name: volunteer.name,
                phone: volunteer.phone || undefined,
                position: 'Voluntário'
              });

              // Link user to volunteer
              await db
                .update(volunteers)
                .set({ userId: newUser.id })
                .where(eq(volunteers.id, volunteer.id));

              // Create user role as volunteer
              await this.createUserRole({
                userId: newUser.id,
                organizationId: organizationId,
                role: 'volunteer',
                grantedBy: null
              });

              console.log(`✅ Conta criada para voluntário ${volunteer.name}: ${volunteer.email} | Senha: ${tempPassword}`);
            }
          } catch (error) {
            console.error(`❌ Erro ao criar conta para voluntário ${volunteer.name}:`, error);
          }
        }
      }

      // Sync beneficiaries without user accounts
      const beneficiariesWithoutAccounts = await db
        .select()
        .from(beneficiaries)
        .where(and(
          eq(beneficiaries.organizationId, organizationId),
          isNotNull(beneficiaries.email),
          isNull(beneficiaries.userId)
        ));

      console.log(`📊 Encontrados ${beneficiariesWithoutAccounts.length} beneficiários sem conta de usuário`);

      for (const beneficiary of beneficiariesWithoutAccounts) {
        if (beneficiary.email) {
          try {
            // Check if user already exists with this email
            const existingUser = await this.getUserByEmail(beneficiary.email);
            
            if (existingUser) {
              // Link existing user to this beneficiary
              await db
                .update(beneficiaries)
                .set({ userId: existingUser.id })
                .where(eq(beneficiaries.id, beneficiary.id));
              
              // Create user role as beneficiary if not exists
              const existingRole = await this.getUserRole(existingUser.id, organizationId);
              if (!existingRole) {
                await this.createUserRole({
                  userId: existingUser.id,
                  organizationId: organizationId,
                  role: 'beneficiary',
                  grantedBy: null
                });
              }
              
              console.log(`✅ Vinculada beneficiária ${beneficiary.name} à conta existente: ${beneficiary.email}`);
            } else {
              // Generate temporary password for beneficiary
              const namePrefix = beneficiary.name.substring(0, 4).toLowerCase().replace(/\s/g, '');
              const numberSuffix = beneficiary.registrationNumber.slice(-4);
              const tempPassword = namePrefix + numberSuffix;
              
              // Create new user account
              const newUser = await this.createUser({
                email: beneficiary.email,
                passwordHash: await bcrypt.hash(tempPassword, 10),
                name: beneficiary.name,
                phone: beneficiary.contactInfo || undefined,
                position: 'Beneficiária'
              });

              // Link user to beneficiary
              await db
                .update(beneficiaries)
                .set({ userId: newUser.id })
                .where(eq(beneficiaries.id, beneficiary.id));

              // Create user role as beneficiary
              await this.createUserRole({
                userId: newUser.id,
                organizationId: organizationId,
                role: 'beneficiary',
                grantedBy: null
              });

              console.log(`✅ Conta criada para beneficiária ${beneficiary.name}: ${beneficiary.email} | Senha: ${tempPassword}`);
            }
          } catch (error) {
            console.error(`❌ Erro ao criar conta para beneficiária ${beneficiary.name}:`, error);
          }
        }
      }

      console.log('✅ Sincronização de contas concluída!');
      
    } catch (error) {
      console.error('❌ Erro durante sincronização de contas:', error);
      throw error;
    }
  }

  // Password Reset Tokens Implementation
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const result = await db.insert(passwordResetTokens).values(tokenData).returning();
    return result[0];
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const result = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gte(passwordResetTokens.expiresAt, new Date())
      ))
      .limit(1);
    
    return result[0];
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(or(
        eq(passwordResetTokens.used, true),
        lte(passwordResetTokens.expiresAt, new Date())
      ));
  }
}