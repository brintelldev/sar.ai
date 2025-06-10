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

      res.json({ user: { id: user.id, email: user.email, name: user.name }, organization });
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
        user: { id: user.id, email: user.email, name: user.name },
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
        user: { id: user.id, email: user.email, name: user.name },
        organizations,
        currentOrganization
      });
    } catch (error) {
      console.error("Get user error:", error);
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
      res.status(500).json({ message: "Internal server error" });
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
      const beneficiaryData = insertBeneficiarySchema.parse({
        ...req.body,
        organizationId: req.session.organizationId!
      });
      
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

  const httpServer = createServer(app);
  return httpServer;
}
