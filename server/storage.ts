import { 
  users, organizations, userRoles, projects, donors, beneficiaries, 
  volunteers, donations, accountsReceivable, accountsPayable, funders,
  type User, type InsertUser, type Organization, type InsertOrganization,
  type UserRole, type InsertUserRole, type Project, type InsertProject,
  type Donor, type InsertDonor, type Beneficiary, type InsertBeneficiary,
  type Volunteer, type InsertVolunteer, type Donation, type InsertDonation
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
  
  // Dashboard metrics
  getDashboardMetrics(organizationId: string): Promise<{
    activeProjects: number;
    totalDonated: number;
    beneficiariesServed: number;
    activeVolunteers: number;
  }>;
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
    const userRolesList = Array.from(this.userRoles.values())
      .filter(role => role.userId === userId && role.isActive);
    
    const organizationIds = userRolesList.map(role => role.organizationId);
    return Array.from(this.organizations.values())
      .filter(org => organizationIds.includes(org.id));
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
      expiresAt: insertRole.expiresAt || null
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

export const storage = new MemStorage();
