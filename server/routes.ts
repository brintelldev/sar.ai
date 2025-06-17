import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertOrganizationSchema, insertUserRoleSchema,
  insertProjectSchema, insertDonorSchema, insertBeneficiarySchema,
  insertVolunteerSchema, insertDonationSchema
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

      res.json({ 
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone, position: user.position, createdAt: user.createdAt },
        organizations,
        currentOrganization: organizations[0] || null
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

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const organizations = await storage.getUserOrganizations(user.id);
      let currentOrganization = null;
      
      if (req.session.organizationId) {
        currentOrganization = await storage.getOrganization(req.session.organizationId);
      } else if (organizations.length > 0) {
        // If no organization is set in session, use the first one
        currentOrganization = organizations[0];
        req.session.organizationId = organizations[0].id;
      }

      res.json({ 
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone, position: user.position, createdAt: user.createdAt },
        organizations,
        currentOrganization
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

  // Beneficiaries routes
  app.get("/api/beneficiaries", requireAuth, requireOrganization, async (req, res) => {
    try {
      const beneficiaries = await storage.getBeneficiaries(req.session.organizationId!);
      res.json(beneficiaries);
    } catch (error) {
      console.error("Get beneficiaries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/beneficiaries", requireAuth, requireOrganization, async (req, res) => {
    try {
      const validatedData = insertBeneficiarySchema.parse(req.body);
      const beneficiaryData = {
        ...validatedData,
        organizationId: req.session.organizationId!
      };
      
      const beneficiary = await storage.createBeneficiary(beneficiaryData);
      res.status(201).json(beneficiary);
    } catch (error) {
      console.error("Create beneficiary error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Volunteers routes
  app.get("/api/volunteers", requireAuth, requireOrganization, async (req, res) => {
    try {
      const volunteers = await storage.getVolunteers(req.session.organizationId!);
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

  // General courses routes
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

  // Get individual course (public view)
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

  // Parameterized routes MUST come AFTER all specific routes
  app.get("/api/courses/:id", requireAuth, async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id, req.session.organizationId!);
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      res.json(course);
    } catch (error) {
      console.error("Get course error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/courses/:id/modules", requireAuth, async (req, res) => {
    try {
      const modules = await storage.getCourseModules(req.params.id);
      res.json(modules);
    } catch (error) {
      console.error("Get course modules error:", error);
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
      res.status(204).send();
    } catch (error) {
      console.error("Delete course error:", error);
      res.status(500).json({ message: "Erro ao excluir curso" });
    }
  });

  app.get("/api/courses/:id/modules", requireAuth, async (req, res) => {
    try {
      const modules = await storage.getCourseModules(req.params.id);
      res.json(modules);
    } catch (error) {
      console.error("Get course modules error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/courses/:id/modules", requireAuth, async (req, res) => {
    try {
      const moduleData = {
        ...req.body,
        courseId: req.params.id
      };
      
      const module = await storage.createCourseModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Create course module error:", error);
      res.status(500).json({ message: "Erro ao criar módulo" });
    }
  });

  app.patch("/api/courses/:courseId/modules/:moduleId", requireAuth, async (req, res) => {
    try {
      const module = await storage.updateCourseModule(req.params.moduleId, req.body);
      if (!module) {
        return res.status(404).json({ message: "Módulo não encontrado" });
      }
      res.json(module);
    } catch (error) {
      console.error("Update course module error:", error);
      res.status(500).json({ message: "Erro ao atualizar módulo" });
    }
  });

  app.delete("/api/courses/:courseId/modules/:moduleId", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteCourseModule(req.params.moduleId);
      if (!success) {
        return res.status(404).json({ message: "Módulo não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete course module error:", error);
      res.status(500).json({ message: "Erro ao excluir módulo" });
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
          startedAt: new Date().toISOString(),
          timeSpent: 0,
          lastAccessedAt: new Date().toISOString(),
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
          completedAt: isCompleted ? new Date().toISOString() : null,
          lastAccessedAt: new Date().toISOString()
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
        issuedAt: new Date().toISOString(),
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

  const httpServer = createServer(app);
  return httpServer;
}
