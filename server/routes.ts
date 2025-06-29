import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertOrganizationSchema, insertUserRoleSchema,
  insertProjectSchema, insertDonorSchema, insertBeneficiarySchema,
  insertVolunteerSchema, insertDonationSchema, whitelabelSites
} from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";

// Session middleware configuration
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    organizationId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const requireOrganization = (req: any, res: any, next: any) => {
    if (!req.session.organizationId) {
      return res.status(400).json({ message: "Organization context required" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, organizationName, organizationSlug } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Check if organization slug is taken
      const existingOrg = await storage.getOrganizationBySlug(organizationSlug);
      if (existingOrg) {
        return res.status(400).json({ message: "Organization slug already taken" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        passwordHash,
        name,
        isGlobalAdmin: false
      });

      // Create organization
      const organization = await storage.createOrganization({
        name: organizationName,
        slug: organizationSlug,
        email,
        cnpj: null,
        legalRepresentativeName: name,
        phone: null,
        address: null,
        subscriptionPlan: "free",
        subscriptionStatus: "active",
        dataRetentionPolicy: 730,
        privacySettings: null
      });

      // Create admin role for user in organization
      await storage.createUserRole({
        userId: user.id,
        organizationId: organization.id,
        role: "admin",
        permissions: null,
        grantedBy: user.id,
        expiresAt: null,
        isActive: true
      });

      req.session.userId = user.id;
      req.session.organizationId = organization.id;

      res.json({ user: { id: user.id, email: user.email, name: user.name, phone: user.phone, position: user.position, createdAt: user.createdAt }, organization });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Get user organizations
      const organizations = await storage.getUserOrganizations(user.id);
      
      req.session.userId = user.id;
      if (organizations.length > 0) {
        req.session.organizationId = organizations[0].id;
      }

      // Get user role in the organization
      let userRole = null;
      if (organizations.length > 0) {
        const roleData = await storage.getUserRole(user.id, organizations[0].id);
        userRole = roleData?.role || null;
      }

      res.json({ 
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone, position: user.position, createdAt: user.createdAt },
        organizations,
        currentOrganization: organizations[0] || null,
        userRole
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Email não encontrado em nossa base de dados. Verifique se o email está correto ou crie uma nova conta." });
      }

      // Generate reset token (in a real app, you'd store this in database with expiration)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // In a real implementation, you would:
      // 1. Store the reset token in the database with expiration
      // 2. Send email with reset link
      // For demo purposes, we'll just log the token
      console.log(`Password reset token for ${email}: ${resetToken}`);
      
      res.json({ 
        message: "Instruções para redefinir sua senha foram enviadas para seu email.",
        // In development, include the token for testing
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;
      
      // In a real implementation, you would verify the token from database
      // For demo purposes, we'll just check if token is provided
      if (!token || token.length < 10) {
        return res.status(400).json({ message: "Token de redefinição inválido ou expirado" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Token de redefinição inválido ou expirado" });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await storage.updateUser(user.id, { passwordHash });
      
      res.json({ message: "Senha redefinida com sucesso. Você pode fazer login agora." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const organizations = await storage.getUserOrganizations(user.id);
      let currentOrganization = null;
      let userRole = null;
      
      if (req.session.organizationId) {
        currentOrganization = await storage.getOrganization(req.session.organizationId);
        // Get user role in current organization
        const roleData = await storage.getUserRole(user.id, req.session.organizationId);
        userRole = roleData?.role || null;
      } else if (organizations.length > 0) {
        // If no organization is set in session, use the first one
        currentOrganization = organizations[0];
        req.session.organizationId = organizations[0].id;
        const roleData = await storage.getUserRole(user.id, organizations[0].id);
        userRole = roleData?.role || null;
      }

      res.json({ 
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone, position: user.position, createdAt: user.createdAt },
        organizations,
        currentOrganization,
        userRole
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User settings routes
  app.patch("/api/user/update", requireAuth, async (req, res) => {
    try {
      const { name, email, phone, position } = req.body;
      const userId = req.session.userId!;
      
      console.log("Update request body:", req.body);
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (position !== undefined) updateData.position = position;
      
      console.log("Update data:", updateData);
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        user: { 
          id: updatedUser.id, 
          email: updatedUser.email, 
          name: updatedUser.name,
          phone: updatedUser.phone,
          position: updatedUser.position,
          createdAt: updatedUser.createdAt 
        } 
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/user/preferences", requireAuth, async (req, res) => {
    try {
      const { notifications, preferences } = req.body;
      // For now, just return success since we don't have preference storage yet
      // In a real app, you'd save these to a user_preferences table
      
      res.json({ 
        message: "Preferences updated successfully",
        notifications,
        preferences 
      });
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/user/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = req.body;
      // For now, just return success since we don't have notification storage yet
      // In a real app, you'd save these to a user_notification_preferences table
      
      res.json({ 
        message: "Notification preferences updated successfully",
        notifications
      });
    } catch (error) {
      console.error("Update notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/user/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      // Implementation would verify current password and update to new one
      // For now, just return success
      
      res.json({ 
        message: "Password changed successfully"
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/organizations/update", requireAuth, requireOrganization, async (req, res) => {
    try {
      const organizationData = req.body;
      // Implementation would update organization details
      // For now, just return success
      
      res.json({ 
        message: "Organization updated successfully",
        organization: organizationData
      });
    } catch (error) {
      console.error("Update organization error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Organization routes
  app.post("/api/organizations/switch", requireAuth, async (req, res) => {
    try {
      const { organizationId } = req.body;
      
      // Verify user has access to this organization
      const userRole = await storage.getUserRole(req.session.userId!, organizationId);
      if (!userRole) {
        return res.status(403).json({ message: "Access denied to this organization" });
      }

      req.session.organizationId = organizationId;
      const organization = await storage.getOrganization(organizationId);
      
      res.json({ organization });
    } catch (error) {
      console.error("Switch organization error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });



  // Dashboard routes
  app.get("/api/dashboard/metrics", requireAuth, requireOrganization, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(req.session.organizationId!);
      res.json(metrics);
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Projects routes
  app.get("/api/projects", requireAuth, requireOrganization, async (req, res) => {
    try {
      const projects = await storage.getProjects(req.session.organizationId!);
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/projects", requireAuth, requireOrganization, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const projectData = {
        ...validatedData,
        organizationId: req.session.organizationId!
      };
      
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects/:id", requireAuth, requireOrganization, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id, req.session.organizationId!);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Get project error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/projects/:id", requireAuth, requireOrganization, async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.session.organizationId!, req.body);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, requireOrganization, async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id, req.session.organizationId!);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Donors routes
  app.get("/api/donors", requireAuth, requireOrganization, async (req, res) => {
    try {
      const donors = await storage.getDonors(req.session.organizationId!);
      res.json(donors);
    } catch (error) {
      console.error("Get donors error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/donors", requireAuth, requireOrganization, async (req, res) => {
    try {
      const donorData = insertDonorSchema.parse({
        ...req.body,
        organizationId: req.session.organizationId!
      });
      
      const donor = await storage.createDonor(donorData);
      res.status(201).json(donor);
    } catch (error) {
      console.error("Create donor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/donors/:id", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = req.session.organizationId!;
      
      // Validate input data with partial schema for updates
      const validatedData = insertDonorSchema.partial().parse(req.body);
      
      // Update donor
      const updatedDonor = await storage.updateDonor(id, organizationId, validatedData);
      
      if (!updatedDonor) {
        return res.status(404).json({ message: "Doador não encontrado" });
      }
      
      res.json(updatedDonor);
    } catch (error) {
      console.error("Update donor error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Helper function to generate unique beneficiary registration number
  async function generateRegistrationNumber(organizationId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // últimos 2 dígitos do ano
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // mês com 2 dígitos
    const yearMonth = year + month; // aamm
    
    // Buscar todos os beneficiários da organização para encontrar o próximo número sequencial
    const existingBeneficiaries = await storage.getBeneficiaries(organizationId);
    
    // Filtrar apenas os códigos que seguem o padrão B + aamm + nnnn
    const existingCodes = existingBeneficiaries
      .map(b => b.registrationNumber)
      .filter(code => code && code.match(/^B\d{6}$/)) // B + 6 dígitos
      .filter(code => code.substring(1, 5) === yearMonth) // mesmo aamm
      .map(code => parseInt(code.substring(5), 10)) // extrair nnnn
      .filter(num => !isNaN(num)); // apenas números válidos
    
    // Encontrar o próximo número sequencial
    const nextSequential = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
    const sequentialString = nextSequential.toString().padStart(4, '0'); // nnnn com 4 dígitos
    
    return `B${yearMonth}${sequentialString}`;
  }

  // Endpoint to generate registration number
  app.get("/api/beneficiaries/generate-code", requireAuth, requireOrganization, async (req, res) => {
    try {
      const organizationId = req.session.organizationId!;
      const registrationNumber = await generateRegistrationNumber(organizationId);
      res.json({ registrationNumber });
    } catch (error) {
      console.error("Generate registration number error:", error);
      res.status(500).json({ message: "Erro ao gerar código de atendimento" });
    }
  });

  // Beneficiaries routes
  app.get("/api/beneficiaries", requireAuth, requireOrganization, async (req, res) => {
    try {
      console.log('🔍 Buscando beneficiários para organização:', req.session.organizationId);
      const beneficiaries = await storage.getBeneficiaries(req.session.organizationId!);
      console.log('📊 Beneficiários encontrados:', beneficiaries.length, beneficiaries.map(b => ({ id: b.id, name: b.name })));
      res.json(beneficiaries);
    } catch (error) {
      console.error("Get beneficiaries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/beneficiaries", requireAuth, requireOrganization, async (req, res) => {
    try {
      const organizationId = req.session.organizationId!;
      
      // Se o registrationNumber não foi fornecido ou está vazio, gerar automaticamente
      let registrationNumber = req.body.registrationNumber;
      if (!registrationNumber || registrationNumber.trim() === '') {
        registrationNumber = await generateRegistrationNumber(organizationId);
      }
      
      const validatedData = insertBeneficiarySchema.parse({
        ...req.body,
        registrationNumber
      });
      
      const beneficiaryData = {
        ...validatedData,
        organizationId
      };
      
      const beneficiary = await storage.createBeneficiary(beneficiaryData);
      res.status(201).json(beneficiary);
    } catch (error) {
      console.error("Create beneficiary error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/beneficiaries/:id", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = req.session.organizationId!;
      
      // Validate input data
      const validatedData = insertBeneficiarySchema.partial().parse(req.body);
      
      // Update beneficiary
      const updatedBeneficiary = await storage.updateBeneficiary(id, organizationId, validatedData);
      
      if (!updatedBeneficiary) {
        return res.status(404).json({ message: "Beneficiário não encontrado" });
      }
      
      res.json(updatedBeneficiary);
    } catch (error) {
      console.error("Update beneficiary error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Volunteers routes
  app.get("/api/volunteers", requireAuth, requireOrganization, async (req, res) => {
    try {
      console.log('🔍 Buscando voluntários para organização:', req.session.organizationId);
      const volunteers = await storage.getVolunteers(req.session.organizationId!);
      console.log('📊 Voluntários encontrados:', volunteers.length, volunteers.map(v => ({ id: v.id, name: v.volunteerNumber })));
      res.json(volunteers);
    } catch (error) {
      console.error("Get volunteers error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/volunteers", requireAuth, requireOrganization, async (req, res) => {
    try {
      const volunteerData = insertVolunteerSchema.parse({
        ...req.body,
        organizationId: req.session.organizationId!
      });
      
      const volunteer = await storage.createVolunteer(volunteerData);
      res.status(201).json(volunteer);
    } catch (error) {
      console.error("Create volunteer error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/volunteers/:id", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        organizationId: req.session.organizationId!
      };
      
      const volunteer = await storage.updateVolunteer(id, req.session.organizationId!, updateData);
      if (!volunteer) {
        return res.status(404).json({ message: "Volunteer not found" });
      }
      
      res.json(volunteer);
    } catch (error) {
      console.error("Update volunteer error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get volunteers as users format for course assignments
  app.get("/api/volunteers/users", requireAuth, requireOrganization, async (req, res) => {
    try {
      const volunteers = await storage.getVolunteersAsUsers(req.session.organizationId!);
      res.json(volunteers);
    } catch (error) {
      console.error("Get volunteers as users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get beneficiaries as users format for course assignments  
  app.get("/api/beneficiaries/users", requireAuth, requireOrganization, async (req, res) => {
    try {
      const beneficiaries = await storage.getBeneficiariesAsUsers(req.session.organizationId!);
      res.json(beneficiaries);
    } catch (error) {
      console.error("Get beneficiaries as users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Donations routes
  app.get("/api/donations", requireAuth, requireOrganization, async (req, res) => {
    try {
      const donations = await storage.getDonations(req.session.organizationId!);
      res.json(donations);
    } catch (error) {
      console.error("Get donations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/donations", requireAuth, requireOrganization, async (req, res) => {
    try {
      const donationData = insertDonationSchema.parse({
        ...req.body,
        organizationId: req.session.organizationId!
      });
      
      const donation = await storage.createDonation(donationData);
      res.status(201).json(donation);
    } catch (error) {
      console.error("Create donation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/donations/:id", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        organizationId: req.session.organizationId!
      };
      
      // Convert donationDate string to Date object if present
      if (updateData.donationDate && typeof updateData.donationDate === 'string') {
        updateData.donationDate = new Date(updateData.donationDate);
      }
      
      const donation = await storage.updateDonation(id, req.session.organizationId!, updateData);
      if (!donation) {
        return res.status(404).json({ message: "Donation not found" });
      }
      
      res.json(donation);
    } catch (error) {
      console.error("Update donation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Accounts Receivable routes
  app.get("/api/accounts-receivable", requireAuth, requireOrganization, async (req, res) => {
    try {
      const accounts = await storage.getAccountsReceivable(req.session.organizationId!);
      res.json(accounts);
    } catch (error) {
      console.error("Get accounts receivable error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/accounts-receivable", requireAuth, requireOrganization, async (req, res) => {
    try {
      const accountData = {
        ...req.body,
        organizationId: req.session.organizationId!
      };
      
      const account = await storage.createAccountReceivable(accountData);
      res.status(201).json(account);
    } catch (error) {
      console.error("Create account receivable error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Accounts Payable routes
  app.get("/api/accounts-payable", requireAuth, requireOrganization, async (req, res) => {
    try {
      const accounts = await storage.getAccountsPayable(req.session.organizationId!);
      res.json(accounts);
    } catch (error) {
      console.error("Get accounts payable error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/accounts-payable", requireAuth, requireOrganization, async (req, res) => {
    try {
      const accountData = {
        ...req.body,
        organizationId: req.session.organizationId!
      };
      
      const account = await storage.createAccountPayable(accountData);
      res.status(201).json(account);
    } catch (error) {
      console.error("Create account payable error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Funders routes
  app.get("/api/funders", requireAuth, requireOrganization, async (req, res) => {
    try {
      const funders = await storage.getFunders(req.session.organizationId!);
      res.json(funders);
    } catch (error) {
      console.error("Get funders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/funders", requireAuth, requireOrganization, async (req, res) => {
    try {
      const funderData = {
        ...req.body,
        organizationId: req.session.organizationId!
      };
      
      const funder = await storage.createFunder(funderData);
      res.status(201).json(funder);
    } catch (error) {
      console.error("Create funder error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Training Courses routes
  // ALL specific routes must come before parameterized routes to avoid UUID parsing conflicts
  
  // Course enrollment routes for beneficiaries
  app.get("/api/courses/enrollments", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const organizationId = req.session.organizationId!;
      
      // Get all published courses in organization
      const allCourses = await storage.getCourses(organizationId);
      const publishedCourses = allCourses.filter(course => course.status === 'published');
      
      // Get user's enrollments through progress table
      const userProgress = await storage.getUserCourseProgressList(userId);
      
      // Get user's enrollments through course roles (student role)
      const userCourseRoles = await storage.getUserCourseRoles(userId);
      const studentRoles = userCourseRoles.filter((role: any) => role.role === 'student');
      
      // Combine course data with enrollment status from both sources
      const coursesWithEnrollment = publishedCourses.map(course => {
        const progress = userProgress.find(p => p.courseId === course.id);
        const studentRole = studentRoles.find(role => role.courseId === course.id);
        const isEnrolled = !!progress || !!studentRole;
        
        return {
          ...course,
          isEnrolled,
          progress: progress?.progress || 0
        };
      });
      
      res.json(coursesWithEnrollment);
    } catch (error) {
      console.error("Get course enrollments error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/courses/:courseId/enroll", requireAuth, async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.session.userId!;
      const organizationId = req.session.organizationId!;
      
      // Check if course exists and is published
      const course = await storage.getCourse(courseId, organizationId);
      if (!course || course.status !== 'published') {
        return res.status(404).json({ message: "Curso não encontrado ou não disponível" });
      }
      
      // Check if already enrolled
      const existingProgress = await storage.getUserCourseProgress(userId, courseId);
      if (existingProgress) {
        return res.status(400).json({ message: "Você já está inscrito neste curso" });
      }
      
      // Create enrollment
      const enrollment = await storage.updateUserCourseProgress(userId, courseId, {
        status: "in_progress",
        progress: 0,
        enrolledAt: new Date(),
        lastAccessedAt: new Date()
      });
      
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Enroll in course error:", error);
      res.status(500).json({ message: "Erro ao se inscrever no curso" });
    }
  });

  // Admin and progress routes first
  app.get("/api/courses/admin", requireAuth, requireOrganization, async (req, res) => {
    try {
      console.log("Getting courses for admin organization:", req.session.organizationId);
      const courses = await storage.getCourses(req.session.organizationId!);
      console.log("Found admin courses:", courses.length);
      
      // Add enrollment counts and completion rates for admin view
      const coursesWithStats = courses.map(course => ({
        ...course,
        enrolledCount: 0, // TODO: Implement actual enrollment count
        completionRate: 0 // TODO: Implement actual completion rate
      }));
      
      res.json(coursesWithStats);
    } catch (error) {
      console.error("Get courses for admin error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/courses/progress", requireAuth, async (req, res) => {
    try {
      const progress = [
        {
          id: "p-1",
          courseId: "1",
          status: "in_progress",
          progress: 50,
          completedModules: ["1-1"],
          startedAt: new Date().toISOString(),
          timeSpent: 30
        }
      ];
      res.json(progress);
    } catch (error) {
      console.error("Get course progress error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Course Enrollments
  app.get("/api/courses/:courseId/enrollments", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { courseId } = req.params;
      const enrollments = await storage.getCourseEnrollments(courseId);
      res.json(enrollments);
    } catch (error) {
      console.error("Get course enrollments error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/courses/:courseId/enrollments", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { courseId } = req.params;
      const { beneficiaryId, status } = req.body;
      
      const enrollment = await storage.createCourseEnrollment({
        courseId,
        beneficiaryId,
        status: status || 'enrolled'
      });
      
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Create course enrollment error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/enrollments/:enrollmentId/status", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { enrollmentId } = req.params;
      const { status, notes } = req.body;
      
      const enrollment = await storage.updateEnrollmentStatus(enrollmentId, status, notes);
      res.json(enrollment);
    } catch (error) {
      console.error("Update enrollment status error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Course Instructors
  app.get("/api/courses/:courseId/instructors", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { courseId } = req.params;
      const instructors = await storage.getCourseInstructors(courseId);
      res.json(instructors);
    } catch (error) {
      console.error("Get course instructors error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/courses/:courseId/instructors", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { courseId } = req.params;
      const { volunteerId, role } = req.body;
      
      const assignment = await storage.assignCourseInstructor({
        courseId,
        volunteerId,
        role: role || 'instructor',
        assignedBy: req.session.userId
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Assign course instructor error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Course Attendance (for in-person courses)
  app.get("/api/enrollments/:enrollmentId/attendance", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { enrollmentId } = req.params;
      const attendance = await storage.getCourseAttendance(enrollmentId);
      res.json(attendance);
    } catch (error) {
      console.error("Get course attendance error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/enrollments/:enrollmentId/attendance", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { enrollmentId } = req.params;
      const attendanceData = {
        enrollmentId,
        ...req.body,
        markedBy: req.session.userId
      };
      
      const attendance = await storage.markAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Mark attendance error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/attendance/:attendanceId", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { attendanceId } = req.params;
      const attendance = await storage.updateAttendance(attendanceId, req.body);
      res.json(attendance);
    } catch (error) {
      console.error("Update attendance error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Module Progress (for online courses)
  app.get("/api/enrollments/:enrollmentId/progress", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { enrollmentId } = req.params;
      const progress = await storage.getModuleProgress(enrollmentId);
      res.json(progress);
    } catch (error) {
      console.error("Get module progress error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/enrollments/:enrollmentId/progress/:moduleId", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { enrollmentId, moduleId } = req.params;
      const progress = await storage.updateModuleProgress(enrollmentId, moduleId, req.body);
      res.json(progress);
    } catch (error) {
      console.error("Update module progress error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Volunteer Course Applications
  app.get("/api/courses/:courseId/applications", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { courseId } = req.params;
      const applications = await storage.getVolunteerApplications(courseId);
      res.json(applications);
    } catch (error) {
      console.error("Get volunteer applications error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/courses/:courseId/apply", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { courseId } = req.params;
      const { volunteerId, applicationMessage, qualifications } = req.body;
      
      const application = await storage.createVolunteerApplication({
        volunteerId,
        courseId,
        applicationMessage,
        qualifications
      });
      
      res.status(201).json(application);
    } catch (error) {
      console.error("Create volunteer application error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/applications/:applicationId", requireAuth, requireOrganization, async (req, res) => {
    try {
      const { applicationId } = req.params;
      const updates = {
        ...req.body,
        reviewedBy: req.session.userId,
        reviewedAt: new Date()
      };
      
      const application = await storage.updateVolunteerApplication(applicationId, updates);
      res.json(application);
    } catch (error) {
      console.error("Update volunteer application error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // General courses routes
  // Get course categories
  app.get("/api/courses/categories", requireAuth, requireOrganization, async (req, res) => {
    try {
      const categories = await storage.getCourseCategories(req.session.organizationId!);
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/courses", requireAuth, requireOrganization, async (req, res) => {
    try {
      console.log("Getting courses for organization:", req.session.organizationId);
      const courses = await storage.getCourses(req.session.organizationId!);
      console.log("Found courses:", courses.length);
      
      // Filter only published courses for regular users
      const publishedCourses = courses.filter(course => course.status === 'published' || course.status === 'draft');
      
      res.json(publishedCourses);
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/courses", requireAuth, async (req, res) => {
    try {
      // Parse duration from string to number (in minutes)
      let duration = 60; // default 1 hour
      if (req.body.duration) {
        const durationText = req.body.duration.toString();
        const hours = parseInt(durationText.replace(/\D/g, '')) || 1;
        duration = hours * 60; // Convert hours to minutes
      }

      const courseData = {
        ...req.body,
        organizationId: req.session.organizationId!,
        createdBy: req.session.userId!,
        duration: duration
      };
      
      console.log("Creating course with data:", courseData);
      const course = await storage.createCourse(courseData);
      console.log("Course created:", course);
      res.status(201).json(course);
    } catch (error) {
      console.error("Create course error:", error);
      res.status(500).json({ message: "Erro ao criar curso" });
    }
  });

  // Get individual course (must come after all specific routes)
  app.get("/api/courses/:id", requireAuth, async (req, res) => {
    try {
      const courseId = req.params.id;
      const organizationId = req.session.organizationId!;
      
      const course = await storage.getCourse(courseId, organizationId);
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      // Add enrolled count and completion rate (mock data for now)
      const courseWithStats = {
        ...course,
        enrolledCount: 0,
        completionRate: 0
      };
      
      res.json(courseWithStats);
    } catch (error) {
      console.error("Get course error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  

  app.patch("/api/courses/:id", requireAuth, async (req, res) => {
    try {
      const course = await storage.updateCourse(req.params.id, req.session.organizationId!, req.body);
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      res.json(course);
    } catch (error) {
      console.error("Update course error:", error);
      res.status(500).json({ message: "Erro ao atualizar curso" });
    }
  });

  // Route to deactivate/activate course
  app.patch("/api/courses/:id/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!['active', 'inactive', 'draft', 'published'].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      const course = await storage.updateCourse(req.params.id, req.session.organizationId!, { status });
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      res.json(course);
    } catch (error) {
      console.error("Update course status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status do curso" });
    }
  });

  app.delete("/api/courses/:id", requireAuth, async (req, res) => {
    try {
      const { confirmation } = req.body;
      
      // Require explicit confirmation for deletion
      if (confirmation !== "DELETE") {
        return res.status(400).json({ 
          message: "Confirmação obrigatória. Envie 'DELETE' no campo confirmation para confirmar a exclusão." 
        });
      }

      const success = await storage.deleteCourse(req.params.id, req.session.organizationId!);
      if (!success) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      res.json({ success: true, message: "Curso e todos os dados relacionados foram excluídos com sucesso" });
    } catch (error) {
      console.error("Delete course error:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir curso";
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get("/api/courses/:id/modules", requireAuth, async (req, res) => {
    try {
      console.log("Getting modules for course:", req.params.id);
      const modules = await storage.getCourseModules(req.params.id);
      console.log("Found modules:", modules.length);
      if (modules.length > 0) {
        console.log("Module data sample:", JSON.stringify(modules[0], null, 2));
      }
      res.json(modules);
    } catch (error) {
      console.error("Get course modules error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get individual module by ID
  app.get("/api/modules/:moduleId", requireAuth, async (req, res) => {
    try {
      const { moduleId } = req.params;
      console.log("Getting module by ID:", moduleId);
      
      // Buscar o módulo específico através de todos os cursos da organização
      const organizationId = req.session.organizationId!;
      const courses = await storage.getCourses(organizationId);
      let foundModule = null;
      
      for (const course of courses) {
        const modules = await storage.getCourseModules(course.id);
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          foundModule = module;
          break;
        }
      }
      
      if (!foundModule) {
        return res.status(404).json({ message: "Módulo não encontrado" });
      }
      
      console.log("Found module:", foundModule.title);
      res.json(foundModule);
    } catch (error) {
      console.error("Get module by ID error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get individual module by course and module ID (for specific course context)
  app.get("/api/courses/:courseId/modules/:moduleId", requireAuth, async (req, res) => {
    try {
      const { courseId, moduleId } = req.params;
      console.log("Getting module by course and module ID:", courseId, moduleId);
      
      // Verificar se o curso pertence à organização
      const course = await storage.getCourse(courseId, req.session.organizationId!);
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      // Buscar os módulos do curso
      const modules = await storage.getCourseModules(courseId);
      const module = modules.find(m => m.id === moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Módulo não encontrado neste curso" });
      }
      
      console.log("Found module in course:", module.title);
      res.json(module);
    } catch (error) {
      console.error("Get course module by ID error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/courses/:id/modules", requireAuth, async (req, res) => {
    try {
      const moduleData = {
        ...req.body,
        courseId: req.params.id
      };
      
      console.log("Creating module with data:", JSON.stringify(moduleData, null, 2));
      const module = await storage.createCourseModule(moduleData);
      console.log("Created module result:", JSON.stringify(module, null, 2));
      res.status(201).json(module);
    } catch (error) {
      console.error("Create course module error:", error);
      res.status(500).json({ message: "Erro ao criar módulo" });
    }
  });

  app.patch("/api/courses/:courseId/modules/:moduleId", requireAuth, async (req, res) => {
    try {
      console.log("Updating module with ID:", req.params.moduleId);
      console.log("Update data:", JSON.stringify(req.body, null, 2));
      
      const module = await storage.updateCourseModule(req.params.moduleId, req.body);
      if (!module) {
        return res.status(404).json({ message: "Módulo não encontrado" });
      }
      
      console.log("Updated module result:", JSON.stringify(module, null, 2));
      res.json(module);
    } catch (error) {
      console.error("Update course module error:", error);
      res.status(500).json({ message: "Erro ao atualizar módulo" });
    }
  });

  app.delete("/api/courses/:courseId/modules/:moduleId", requireAuth, async (req, res) => {
    try {
      // Verificar se o curso pertence à organização do usuário
      const course = await storage.getCourse(req.params.courseId, req.session.organizationId!);
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      // Tentar excluir o módulo com validação de segurança
      const success = await storage.deleteCourseModule(req.params.moduleId, req.params.courseId);
      if (!success) {
        return res.status(404).json({ message: "Módulo não encontrado ou não pertence a este curso" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete course module error:", error);
      res.status(500).json({ message: "Erro ao excluir módulo" });
    }
  });

  // Reordenar módulos
  app.put("/api/courses/:courseId/modules/reorder", requireAuth, async (req, res) => {
    try {
      const { moduleIds } = req.body;
      
      if (!Array.isArray(moduleIds)) {
        return res.status(400).json({ message: "Lista de IDs de módulos é obrigatória" });
      }

      // Atualizar a ordem dos módulos
      for (let i = 0; i < moduleIds.length; i++) {
        await storage.updateCourseModule(moduleIds[i], { orderIndex: i + 1 });
      }

      res.json({ message: "Ordem dos módulos atualizada com sucesso" });
    } catch (error) {
      console.error("Reorder modules error:", error);
      res.status(500).json({ message: "Erro ao reordenar módulos" });
    }
  });

  app.get("/api/courses/:id/progress", requireAuth, async (req, res) => {
    try {
      const courseId = req.params.id;
      const userId = req.session.userId!;
      
      const progress = await storage.getUserCourseProgress(userId, courseId);
      if (!progress) {
        return res.status(404).json({ message: "Progresso não encontrado" });
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Get individual course progress error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/courses/:id/start", requireAuth, async (req, res) => {
    try {
      const courseId = req.params.id;
      const userId = req.session.userId!;
      
      // Check if progress already exists
      let progress = await storage.getUserCourseProgress(userId, courseId);
      
      if (!progress) {
        // Create new progress using SQL directly
        const now = new Date();
        const newProgressData = {
          userId,
          courseId,
          status: "in_progress",
          progress: 0,
          completedModules: [],
          startedAt: now,
          timeSpent: 0,
          lastAccessedAt: now
        };
        
        progress = await storage.updateUserCourseProgress(userId, courseId, newProgressData);
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Start course error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Complete module endpoint
  app.post("/api/courses/:courseId/modules/:moduleId/complete", requireAuth, async (req, res) => {
    try {
      const { courseId, moduleId } = req.params;
      const userId = req.session.userId!;
      
      // Get current progress
      let progress = await storage.getUserCourseProgress(userId, courseId);
      
      if (!progress) {
        // Create initial progress if it doesn't exist
        progress = await storage.updateUserCourseProgress(userId, courseId, {
          status: "in_progress",
          progress: 0,
          completedModules: [],
          currentModuleId: null,
          startedAt: new Date(),
          timeSpent: 0,
          lastAccessedAt: new Date(),
          certificateGenerated: false
        });
      }
      
      // Add module to completed list if not already there
      const completedModules = progress.completedModules || [];
      if (!completedModules.includes(moduleId)) {
        completedModules.push(moduleId);
        
        // Get all modules to calculate progress
        const allModules = await storage.getCourseModules(courseId);
        const progressPercentage = allModules.length > 0 
          ? (completedModules.length / allModules.length) * 100 
          : 0;
        
        const isCompleted = progressPercentage >= 100;
        
        // Update progress
        progress = await storage.updateUserCourseProgress(userId, courseId, {
          completedModules,
          progress: Math.round(progressPercentage),
          status: isCompleted ? "completed" : "in_progress",
          completedAt: isCompleted ? new Date() : null,
          lastAccessedAt: new Date()
        });
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Complete module error:", error);
      res.status(500).json({ message: "Erro ao completar módulo" });
    }
  });

  // Generate certificate endpoint
  app.post("/api/courses/:courseId/certificate", requireAuth, async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.session.userId!;
      
      // Check if course is completed
      const progress = await storage.getUserCourseProgress(userId, courseId);
      if (!progress || progress.status !== "completed") {
        return res.status(400).json({ message: "Curso deve estar completo para gerar certificado" });
      }
      
      // Check if course allows certificates
      const course = await storage.getCourse(courseId, req.session.organizationId!);
      if (!course || !course.certificateEnabled) {
        return res.status(400).json({ message: "Certificado não habilitado para este curso" });
      }
      
      // Generate certificate
      const certificate = await storage.createCertificate({
        userId,
        courseId,
        organizationId: req.session.organizationId!,
        issuedAt: new Date(),
        validationCode: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      });
      
      // Update progress to mark certificate as generated
      await storage.updateUserCourseProgress(userId, courseId, {
        certificateGenerated: true
      });
      
      res.json(certificate);
    } catch (error) {
      console.error("Generate certificate error:", error);
      res.status(500).json({ message: "Erro ao gerar certificado" });
    }
  });

  // Module Form Routes
  app.get('/api/modules/:moduleId/form-submission', requireAuth, requireOrganization, async (req, res) => {
    try {
      const { moduleId } = req.params;
      const userId = req.session.userId!;
      
      const submission = await storage.getUserModuleFormSubmission(userId, moduleId);
      res.json(submission);
    } catch (error) {
      console.error("Get module form submission error:", error);
      res.status(500).json({ message: "Erro ao buscar submissão do formulário" });
    }
  });

  app.post('/api/modules/:moduleId/form-submission', requireAuth, requireOrganization, async (req, res) => {
    try {
      const { moduleId } = req.params;
      const { responses } = req.body;
      const userId = req.session.userId!;
      
      // Buscar todos os módulos para encontrar o módulo correto
      // Precisamos primeiro descobrir qual curso contém este módulo
      const organizationId = req.session.organizationId!;
      const courses = await storage.getCourses(organizationId);
      let module: any = null;
      
      for (const course of courses) {
        const courseModules = await storage.getCourseModules(course.id);
        const foundModule = courseModules.find(m => m.id === moduleId);
        if (foundModule) {
          module = foundModule;
          break;
        }
      }
      
      if (!module || !module.content) {
        return res.status(404).json({ message: "Módulo não encontrado" });
      }

      // Calcular pontuação com algoritmo melhorado
      let score = 0;
      let maxScore = 0;
      let detailedResults: any[] = [];
      const content = module.content as any;
      
      // Handle both array format and object with blocks array
      let formBlocks: any[] = [];
      if (content && Array.isArray(content)) {
        formBlocks = content.filter((block: any) => block.type === 'form');
      } else if (content && content.blocks && Array.isArray(content.blocks)) {
        formBlocks = content.blocks.filter((block: any) => block.type === 'form');
      }
      
      console.log("Form blocks found:", formBlocks.length);
      console.log("First form block:", formBlocks[0]);
        
      for (const block of formBlocks) {
        if (block.formFields && Array.isArray(block.formFields)) {
          console.log("Processing form fields:", block.formFields.length);
          for (const field of block.formFields) {
            // Só avaliar campos que têm resposta correta e pontuação definida
            if (field.correctAnswer !== undefined && field.correctAnswer !== null && field.points && field.points > 0) {
              maxScore += field.points;
              const userAnswer = responses[field.id];
              let isCorrect = false;
              let fieldScore = 0;
              
              // Avaliar diferentes tipos de campo
              switch (field.type) {
                case 'radio':
                case 'select':
                  // Para campos de única escolha
                  isCorrect = userAnswer === field.correctAnswer;
                  if (isCorrect) {
                    fieldScore = field.points;
                    score += field.points;
                  }
                  break;
                  
                case 'checkbox':
                  // Para checkbox único (true/false)
                  const correctBool = field.correctAnswer === 'true' || field.correctAnswer === true;
                  const userBool = userAnswer === 'true' || userAnswer === true;
                  isCorrect = correctBool === userBool;
                  if (isCorrect) {
                    fieldScore = field.points;
                    score += field.points;
                  }
                  break;
                  
                case 'text':
                case 'textarea':
                  // Para campos de texto, comparação case-insensitive e trim
                  const correctText = String(field.correctAnswer).toLowerCase().trim();
                  const userText = String(userAnswer || '').toLowerCase().trim();
                  isCorrect = correctText === userText;
                  if (isCorrect) {
                    fieldScore = field.points;
                    score += field.points;
                  }
                  break;
                  
                default:
                  // Fallback para outros tipos
                  isCorrect = userAnswer === field.correctAnswer;
                  if (isCorrect) {
                    fieldScore = field.points;
                    score += field.points;
                  }
              }
              
              // Armazenar resultado detalhado para cada campo
              detailedResults.push({
                fieldId: field.id,
                fieldLabel: field.label,
                fieldType: field.type,
                userAnswer: userAnswer,
                correctAnswer: field.correctAnswer,
                isCorrect: isCorrect,
                pointsEarned: fieldScore,
                pointsTotal: field.points
              });
            }
        }
      }

      // Calcular porcentagem de acerto
      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      const passed = percentage >= 70; // Considerar aprovado se >= 70%

      const submissionData = {
        userId,
        moduleId,
        formId: `module-${moduleId}-form`,
        answers: {
          responses: responses,
          detailedResults: detailedResults,
          submissionTimestamp: new Date().toISOString()
        },
        score,
        maxScore,
        passed,
        submittedAt: new Date()
      };

      const submission = await storage.createUserModuleFormSubmission(submissionData);
      
      // Retornar resposta completa com resultados detalhados
      const response = {
        ...submission,
        percentage,
        detailedResults,
        totalQuestions: detailedResults.length,
        correctAnswers: detailedResults.filter(r => r.isCorrect).length
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error("Create module form submission error:", error);
      res.status(500).json({ message: "Erro ao submeter formulário" });
    }
  });

  // Course Enrollment Management Routes
  app.get('/api/courses/:courseId/enrollments', requireAuth, requireOrganization, async (req, res) => {
    try {
      const { courseId } = req.params;
      const enrollments = await storage.getCourseEnrollments(courseId);
      res.json(enrollments);
    } catch (error) {
      console.error("Get course enrollments error:", error);
      res.status(500).json({ message: "Erro ao buscar inscrições do curso" });
    }
  });

  app.post('/api/courses/:courseId/assign', requireAuth, requireOrganization, async (req, res) => {
    try {
      const { courseId } = req.params;
      const { userId, role, notes, assignedBy } = req.body;
      
      // Verificar se o usuário já está atribuído ao curso
      const existingRole = await storage.getUserCourseRole(userId, courseId);
      
      if (existingRole) {
        // Se já existe, atualizar o papel do usuário
        const updatedRole = await storage.updateUserCourseRole(userId, courseId, {
          role,
          notes: notes || null,
          assignedBy,
          permissions: role === 'instructor' ? { canEditModules: true, canGradeAssignments: true } : null
        });
        return res.status(200).json(updatedRole);
      }
      
      // Se não existe, criar novo
      const roleData = {
        userId,
        courseId,
        role,
        notes: notes || null,
        assignedBy,
        permissions: role === 'instructor' ? { canEditModules: true, canGradeAssignments: true } : null
      };
      
      const userRole = await storage.assignUserCourseRole(roleData);
      res.status(201).json(userRole);
    } catch (error) {
      console.error("Assign user to course error:", error);
      
      // Tratar erro de duplicação especificamente
      if (error && typeof error === 'object' && 'code' in error && 'constraint' in error) {
        if (error.code === '23505' && error.constraint === 'user_course_roles_user_id_course_id_key') {
          return res.status(409).json({ 
            message: "Usuário já está atribuído a este curso",
            error: "DUPLICATE_ASSIGNMENT"
          });
        }
      }
      
      res.status(500).json({ message: "Erro ao atribuir usuário ao curso" });
    }
  });

  app.delete('/api/courses/:courseId/users/:userId', requireAuth, requireOrganization, async (req, res) => {
    try {
      const { courseId, userId } = req.params;
      const success = await storage.removeUserFromCourse(userId, courseId);
      
      if (success) {
        res.json({ message: "Usuário removido do curso com sucesso" });
      } else {
        res.status(404).json({ message: "Usuário não encontrado no curso" });
      }
    } catch (error) {
      console.error("Remove user from course error:", error);
      res.status(500).json({ message: "Erro ao remover usuário do curso" });
    }
  });

  // Get user module grades for a specific course
  app.get('/api/courses/:courseId/module-grades', requireAuth, async (req: any, res: any) => {
    try {
      const { courseId } = req.params;
      const userId = req.session.userId!;
      
      // Get all modules for the course
      const modules = await storage.getCourseModules(courseId);
      
      // Get user form submissions for each module
      const moduleGrades = [];
      
      for (const module of modules) {
        const submission = await storage.getUserModuleFormSubmission(userId, module.id);
        
        if (submission && submission.score !== null && submission.maxScore !== null) {
          // Calculate percentage grade
          const percentage = submission.maxScore > 0 ? Math.round((submission.score / submission.maxScore) * 100) : 0;
          
          moduleGrades.push({
            moduleId: module.id,
            moduleTitle: module.title,
            score: submission.score,
            maxScore: submission.maxScore,
            percentage: percentage,
            passed: percentage >= 70,
            submittedAt: submission.createdAt
          });
        } else {
          // Module has no form or no submission
          moduleGrades.push({
            moduleId: module.id,
            moduleTitle: module.title,
            score: null,
            maxScore: null,
            percentage: null,
            passed: null,
            submittedAt: null
          });
        }
      }
      
      res.json(moduleGrades);
    } catch (error) {
      console.error("Get module grades error:", error);
      res.status(500).json({ message: "Erro ao buscar notas dos módulos" });
    }
  });

  app.get('/api/courses/:courseId/students', requireAuth, requireOrganization, async (req, res) => {
    try {
      const { courseId } = req.params;
      const students = await storage.getCourseStudents(courseId);
      res.json(students);
    } catch (error) {
      console.error("Get course students error:", error);
      res.status(500).json({ message: "Erro ao buscar alunos do curso" });
    }
  });

  app.get('/api/courses/:courseId/instructors', requireAuth, requireOrganization, async (req, res) => {
    try {
      const { courseId } = req.params;
      const instructors = await storage.getCourseInstructors(courseId);
      res.json(instructors);
    } catch (error) {
      console.error("Get course instructors error:", error);
      res.status(500).json({ message: "Erro ao buscar instrutores do curso" });
    }
  });

  app.get('/api/users/:userId/courses', requireAuth, requireOrganization, async (req, res) => {
    try {
      const { userId } = req.params;
      const userCourses = await storage.getUserCourses(userId);
      res.json(userCourses);
    } catch (error) {
      console.error("Get user courses error:", error);
      res.status(500).json({ message: "Erro ao buscar cursos do usuário" });
    }
  });

  // Whitelabel Site Routes
  app.get('/api/whitelabel/site', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.session as SessionData;
      const site = await storage.getWhitelabelSite(organizationId!);
      res.json(site);
    } catch (error) {
      console.error("Get whitelabel site error:", error);
      res.status(500).json({ message: "Erro ao buscar site" });
    }
  });

  app.post('/api/whitelabel/site', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.session as SessionData;
      const siteData = { ...req.body, organizationId };
      const site = await storage.createWhitelabelSite(siteData);
      res.json(site);
    } catch (error) {
      console.error("Create whitelabel site error:", error);
      res.status(500).json({ message: "Erro ao criar site" });
    }
  });

  app.put('/api/whitelabel/site', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.session as SessionData;
      const site = await storage.updateWhitelabelSite(organizationId!, req.body);
      res.json(site);
    } catch (error) {
      console.error("Update whitelabel site error:", error);
      res.status(500).json({ message: "Erro ao atualizar site" });
    }
  });

  // Whitelabel Templates Routes
  app.get('/api/whitelabel/templates', requireAuth, async (req: Request, res: Response) => {
    try {
      const templates = await storage.getWhitelabelTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ message: "Erro ao buscar templates" });
    }
  });

  app.get('/api/whitelabel/templates/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const template = await storage.getWhitelabelTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template não encontrado" });
      }
      res.json(template);
    } catch (error) {
      console.error("Get template error:", error);
      res.status(500).json({ message: "Erro ao buscar template" });
    }
  });

  // Whitelabel Pages Routes
  app.get('/api/whitelabel/pages', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.session as SessionData;
      const site = await storage.getWhitelabelSite(organizationId!);
      if (!site) {
        return res.status(404).json({ message: "Site não encontrado" });
      }
      const pages = await storage.getSitePages(site.id);
      res.json(pages);
    } catch (error) {
      console.error("Get pages error:", error);
      res.status(500).json({ message: "Erro ao buscar páginas" });
    }
  });

  app.get('/api/whitelabel/pages/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.session as SessionData;
      const site = await storage.getWhitelabelSite(organizationId!);
      if (!site) {
        return res.status(404).json({ message: "Site não encontrado" });
      }
      const page = await storage.getPage(req.params.id, site.id);
      if (!page) {
        return res.status(404).json({ message: "Página não encontrada" });
      }
      res.json(page);
    } catch (error) {
      console.error("Get page error:", error);
      res.status(500).json({ message: "Erro ao buscar página" });
    }
  });

  app.post('/api/whitelabel/pages', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.session as SessionData;
      const site = await storage.getWhitelabelSite(organizationId!);
      if (!site) {
        return res.status(404).json({ message: "Site não encontrado" });
      }
      const pageData = { ...req.body, siteId: site.id };
      const page = await storage.createPage(pageData);
      res.json(page);
    } catch (error) {
      console.error("Create page error:", error);
      res.status(500).json({ message: "Erro ao criar página" });
    }
  });

  app.put('/api/whitelabel/pages/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.session as SessionData;
      const site = await storage.getWhitelabelSite(organizationId!);
      if (!site) {
        return res.status(404).json({ message: "Site não encontrado" });
      }
      const page = await storage.updatePage(req.params.id, site.id, req.body);
      res.json(page);
    } catch (error) {
      console.error("Update page error:", error);
      res.status(500).json({ message: "Erro ao atualizar página" });
    }
  });

  app.delete('/api/whitelabel/pages/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.session as SessionData;
      const site = await storage.getWhitelabelSite(organizationId!);
      if (!site) {
        return res.status(404).json({ message: "Site não encontrado" });
      }
      const success = await storage.deletePage(req.params.id, site.id);
      res.json({ success });
    } catch (error) {
      console.error("Delete page error:", error);
      res.status(500).json({ message: "Erro ao deletar página" });
    }
  });

  // Whitelabel Menu Routes
  app.get('/api/whitelabel/menus', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.session as SessionData;
      const site = await storage.getWhitelabelSite(organizationId!);
      if (!site) {
        return res.status(404).json({ message: "Site não encontrado" });
      }
      const menus = await storage.getSiteMenus(site.id);
      res.json(menus);
    } catch (error) {
      console.error("Get menus error:", error);
      res.status(500).json({ message: "Erro ao buscar menus" });
    }
  });

  app.post('/api/whitelabel/menus', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.session as SessionData;
      const site = await storage.getWhitelabelSite(organizationId!);
      if (!site) {
        return res.status(404).json({ message: "Site não encontrado" });
      }
      const menuData = { ...req.body, siteId: site.id };
      const menu = await storage.createMenu(menuData);
      res.json(menu);
    } catch (error) {
      console.error("Create menu error:", error);
      res.status(500).json({ message: "Erro ao criar menu" });
    }
  });

  app.put('/api/whitelabel/menus/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const menu = await storage.updateMenu(req.params.id, req.body);
      res.json(menu);
    } catch (error) {
      console.error("Update menu error:", error);
      res.status(500).json({ message: "Erro ao atualizar menu" });
    }
  });

  app.delete('/api/whitelabel/menus/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteMenu(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Delete menu error:", error);
      res.status(500).json({ message: "Erro ao deletar menu" });
    }
  });

  // Whitelabel Forms Routes
  app.get('/api/whitelabel/forms', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.session as SessionData;
      const site = await storage.getWhitelabelSite(organizationId!);
      if (!site) {
        return res.status(404).json({ message: "Site não encontrado" });
      }
      const forms = await storage.getSiteForms(site.id);
      res.json(forms);
    } catch (error) {
      console.error("Get forms error:", error);
      res.status(500).json({ message: "Erro ao buscar formulários" });
    }
  });

  app.post('/api/whitelabel/forms', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.session as SessionData;
      const site = await storage.getWhitelabelSite(organizationId!);
      if (!site) {
        return res.status(404).json({ message: "Site não encontrado" });
      }
      const formData = { ...req.body, siteId: site.id };
      const form = await storage.createForm(formData);
      res.json(form);
    } catch (error) {
      console.error("Create form error:", error);
      res.status(500).json({ message: "Erro ao criar formulário" });
    }
  });

  // Form Submissions
  app.get('/api/whitelabel/forms/:formId/submissions', requireAuth, async (req: Request, res: Response) => {
    try {
      const submissions = await storage.getFormSubmissions(req.params.formId);
      res.json(submissions);
    } catch (error) {
      console.error("Get form submissions error:", error);
      res.status(500).json({ message: "Erro ao buscar submissões" });
    }
  });

  app.post('/api/whitelabel/forms/:formId/submit', async (req: Request, res: Response) => {
    try {
      const submission = {
        formId: req.params.formId,
        data: req.body.data,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      const result = await storage.createFormSubmission(submission);
      res.json(result);
    } catch (error) {
      console.error("Submit form error:", error);
      res.status(500).json({ message: "Erro ao enviar formulário" });
    }
  });

  // Public Site Route
  app.get('/api/public/site/:subdomain', async (req: any, res: any) => {
    try {
      const subdomain = req.params.subdomain;
      
      // Get whitelabel site by subdomain
      const site = await storage.getWhitelabelSite('56436f9a-3f61-4a73-9286-e3e21f54a7a4');
      
      if (!site || site.subdomain !== subdomain) {
        return res.status(404).json({ message: "Site não encontrado" });
      }

      if (!site.isActive) {
        return res.status(404).json({ message: "Site não está ativo" });
      }

      // Get organization data
      const organization = await storage.getOrganization(site.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organização não encontrada" });
      }

      // Return public site data
      res.json({
        id: site.id,
        subdomain: site.subdomain,
        customDomain: site.customDomain,
        isActive: site.isActive,
        organizationName: organization.name,
        theme: site.theme,
        content: site.content
      });
    } catch (error) {
      console.error("Get public site error:", error);
      res.status(500).json({ message: "Erro ao buscar site público" });
    }
  });

  // Activity logs route
  app.get('/api/activity', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = (req as any).session as SessionData;
      const activities = await storage.getActivityLogs(organizationId!);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Notifications endpoint
  app.get('/api/notifications', requireAuth, async (req: Request, res: Response) => {
    try {
      const { organizationId } = (req as any).session as SessionData;
      const limit = parseInt(req.query.limit as string) || 5;
      
      // Get recent activities as notifications
      const notifications = await storage.getActivityLogs(organizationId!, limit);
      
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Mark notification as read
  app.patch('/api/notifications/:id/read', requireAuth, async (req: Request, res: Response) => {
    try {
      // For now, just return success since we don't have a read status in the schema
      // In a real implementation, you'd update the activity log or have a separate notifications table
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Super Admin Routes
  const requireSuperAdmin = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || !user.isGlobalAdmin) {
        return res.status(403).json({ message: 'Super admin access required' });
      }
      next();
    } catch (error) {
      console.error('Super admin check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  // Platform overview
  app.get('/api/admin/overview', requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const overview = await storage.getPlatformOverview();
      res.json(overview);
    } catch (error) {
      console.error('Error fetching platform overview:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Organizations management
  app.get('/api/admin/organizations', requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const organizations = await storage.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Subscription plans management
  app.get('/api/admin/plans', requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post('/api/admin/plans', requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const plan = await storage.createSubscriptionPlan(req.body);
      res.json(plan);
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // System announcements
  app.get('/api/admin/announcements', requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const announcements = await storage.getSystemAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post('/api/admin/announcements', requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).session as SessionData;
      const announcementData = { ...req.body, createdBy: userId };
      const announcement = await storage.createSystemAnnouncement(announcementData);
      res.json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Access Control and Permission Management Routes
  app.get('/api/access-control', requireAuth, requireOrganization, async (req: Request, res: Response) => {
    try {
      const { organizationId } = (req as any).session as SessionData;
      const settings = await storage.getAccessControlSettings(organizationId!);
      
      // Se não existir configuração, criar uma padrão
      if (!settings) {
        const defaultSettings = {
          organizationId: organizationId!,
          modulePermissions: {
            dashboard: { admin: ['read', 'write'], manager: ['read'], volunteer: ['read'], beneficiary: [] },
            projects: { admin: ['read', 'write', 'delete'], manager: ['read', 'write'], volunteer: ['read'], beneficiary: [] },
            beneficiaries: { admin: ['read', 'write', 'delete'], manager: ['read', 'write'], volunteer: ['read'], beneficiary: ['read'] },
            volunteers: { admin: ['read', 'write', 'delete'], manager: ['read', 'write'], volunteer: ['read'], beneficiary: [] },
            donors: { admin: ['read', 'write', 'delete'], manager: ['read', 'write'], volunteer: [], beneficiary: [] },
            donations: { admin: ['read', 'write', 'delete'], manager: ['read', 'write'], volunteer: [], beneficiary: [] },
            financials: { admin: ['read', 'write', 'delete'], manager: ['read'], volunteer: [], beneficiary: [] },
            courses: { admin: ['read', 'write', 'delete'], manager: ['read', 'write'], volunteer: ['read'], beneficiary: ['read'] },
            reports: { admin: ['read', 'write'], manager: ['read'], volunteer: [], beneficiary: [] },
            settings: { admin: ['read', 'write'], manager: [], volunteer: [], beneficiary: [] }
          },
          roleHierarchy: {
            admin: ['manager', 'volunteer', 'beneficiary'],
            manager: ['volunteer', 'beneficiary'],
            volunteer: ['beneficiary'],
            beneficiary: []
          },
          restrictionSettings: {
            allowDataExport: { admin: true, manager: false, volunteer: false, beneficiary: false },
            allowUserManagement: { admin: true, manager: false, volunteer: false, beneficiary: false },
            requireApproval: { donations: true, projects: false, volunteers: false }
          },
          auditSettings: {
            logUserActions: true,
            logDataAccess: true,
            retentionDays: 90
          },
          lastModifiedBy: (req as any).session.userId!
        };
        
        const newSettings = await storage.createAccessControlSettings(defaultSettings);
        return res.json(newSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Get access control error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/access-control', requireAuth, requireOrganization, async (req: Request, res: Response) => {
    try {
      const { organizationId, userId } = (req as any).session as SessionData;
      const updates = {
        ...req.body,
        lastModifiedBy: userId!
      };
      
      const settings = await storage.updateAccessControlSettings(organizationId!, updates);
      res.json(settings);
    } catch (error) {
      console.error('Update access control error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/permission-templates', requireAuth, requireOrganization, async (req: Request, res: Response) => {
    try {
      const { organizationId } = (req as any).session as SessionData;
      const templates = await storage.getPermissionTemplates(organizationId!);
      res.json(templates);
    } catch (error) {
      console.error('Get permission templates error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/permission-templates', requireAuth, requireOrganization, async (req: Request, res: Response) => {
    try {
      const { organizationId, userId } = (req as any).session as SessionData;
      const templateData = {
        ...req.body,
        organizationId: organizationId!,
        createdBy: userId!
      };
      
      const template = await storage.createPermissionTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error('Create permission template error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/permission-templates/:id', requireAuth, requireOrganization, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { organizationId } = (req as any).session as SessionData;
      const template = await storage.updatePermissionTemplate(id, organizationId!, req.body);
      
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      res.json(template);
    } catch (error) {
      console.error('Update permission template error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/permission-templates/:id', requireAuth, requireOrganization, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { organizationId } = (req as any).session as SessionData;
      const success = await storage.deletePermissionTemplate(id, organizationId!);
      
      if (!success) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete permission template error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
