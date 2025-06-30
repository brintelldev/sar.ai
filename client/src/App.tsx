import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSimpleAuth as useAuth } from "@/hooks/use-simple-auth";
import { AdminGuard, BeneficiaryGuard, SuperAdminGuard, CourseAdminGuard, NonVolunteerGuard } from "@/components/auth/role-guard";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Donors from "@/pages/donors";
import Beneficiaries from "@/pages/beneficiaries";
import Volunteers from "@/pages/volunteers";
import Donations from "@/pages/donations";
import AccountsReceivable from "@/pages/accounts-receivable";
import AccountsPayable from "@/pages/accounts-payable";
import FinancialReports from "@/pages/financial-reports";
import Funders from "@/pages/funders";
import Financials from "@/pages/financials";
import OrganizationSetup from "@/pages/organization-setup";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Support from "@/pages/support";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import Users from "@/pages/users";

import Certificate from "@/pages/certificate";
import { CourseAdmin } from "@/pages/course-admin";
import { CourseEditor } from "@/pages/course-editor";
import { CourseManage } from "@/pages/course-manage";
import { ModuleEditor } from "@/pages/module-editor";
import { ModuleForm } from "@/pages/module-form";
import CourseStart from "@/pages/course-start";
import Whitelabel from "@/pages/whitelabel";
import { Suspense } from 'react';
import PublicSite from "@/pages/public-site";
import SuperAdminPage from "@/pages/super-admin";
import CourseManagement from "@/pages/course-management";
import BeneficiaryProjects from "@/pages/beneficiary-projects";
import AccessControl from "@/pages/access-control";

function HomeRedirect() {
  const { userRole } = useAuth();
  
  if (userRole === 'beneficiary') {
    return <Courses />;
  }
  
  if (userRole === 'volunteer') {
    return <CourseAdmin />;
  }
  
  return <Dashboard />;
}

function BeneficiaryProjectRedirect() {
  const { userRole } = useAuth();
  
  if (userRole === 'beneficiary') {
    return <BeneficiaryProjects />;
  }
  
  return <Projects />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, organizations } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Only show organization setup if user has NO organizations at all
  if (organizations && organizations.length === 0) {
    return <OrganizationSetup />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          {/* Beneficiaries see courses, volunteers see course admin, others see dashboard */}
          <HomeRedirect />
        </ProtectedRoute>
      </Route>
      <Route path="/projects">
        <ProtectedRoute>
          <BeneficiaryProjectRedirect />
        </ProtectedRoute>
      </Route>
      <Route path="/donors">
        <ProtectedRoute>
          <NonVolunteerGuard>
            <AdminGuard>
              <Donors />
            </AdminGuard>
          </NonVolunteerGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/beneficiaries">
        <ProtectedRoute>
          <NonVolunteerGuard>
            <AdminGuard>
              <Beneficiaries />
            </AdminGuard>
          </NonVolunteerGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/volunteers">
        <ProtectedRoute>
          <NonVolunteerGuard>
            <AdminGuard>
              <Volunteers />
            </AdminGuard>
          </NonVolunteerGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/users">
        <ProtectedRoute>
          <NonVolunteerGuard>
            <AdminGuard>
              <Users />
            </AdminGuard>
          </NonVolunteerGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/donations">
        <ProtectedRoute>
          <NonVolunteerGuard>
            <AdminGuard>
              <Donations />
            </AdminGuard>
          </NonVolunteerGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/accounts-receivable">
        <ProtectedRoute>
          <NonVolunteerGuard>
            <AdminGuard>
              <AccountsReceivable />
            </AdminGuard>
          </NonVolunteerGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/accounts-payable">
        <ProtectedRoute>
          <NonVolunteerGuard>
            <AdminGuard>
              <AccountsPayable />
            </AdminGuard>
          </NonVolunteerGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <NonVolunteerGuard>
            <AdminGuard>
              <FinancialReports />
            </AdminGuard>
          </NonVolunteerGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/funders">
        <ProtectedRoute>
          <NonVolunteerGuard>
            <AdminGuard>
              <Funders />
            </AdminGuard>
          </NonVolunteerGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/access-control">
        <ProtectedRoute>
          <NonVolunteerGuard>
            <AdminGuard>
              <AccessControl />
            </AdminGuard>
          </NonVolunteerGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/courses">
        <ProtectedRoute>
          <Courses />
        </ProtectedRoute>
      </Route>
      <Route path="/courses/:id">
        <ProtectedRoute>
          <CourseDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/courses/:courseId/start">
        <ProtectedRoute>
          <CourseStart />
        </ProtectedRoute>
      </Route>
      <Route path="/courses/:id/certificate">
        <ProtectedRoute>
          <Certificate />
        </ProtectedRoute>
      </Route>
      <Route path="/courses/:courseId/manage">
        <ProtectedRoute>
          <CourseAdminGuard>
            <CourseManage />
          </CourseAdminGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/courses">
        <ProtectedRoute>
          <Courses />
        </ProtectedRoute>
      </Route>
      <Route path="/courses/:courseId/manage">
        <ProtectedRoute>
          <CourseManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/course-admin">
        <ProtectedRoute>
          <CourseAdminGuard>
            <CourseAdmin />
          </CourseAdminGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/courses">
        <ProtectedRoute>
          <CourseAdminGuard>
            <CourseAdmin />
          </CourseAdminGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/course-admin/:id">
        <ProtectedRoute>
          <CourseAdminGuard>
            <CourseEditor />
          </CourseAdminGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/courses/:courseId/modules">
        <ProtectedRoute>
          <CourseAdminGuard>
            <ModuleEditor />
          </CourseAdminGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/courses/:courseId/modules/:moduleId/form">
        <ProtectedRoute>
          <ModuleForm />
        </ProtectedRoute>
      </Route>
      <Route path="/support">
        <ProtectedRoute>
          <Support />
        </ProtectedRoute>
      </Route>
      <Route path="/whitelabel">
        <ProtectedRoute>
          <NonVolunteerGuard>
            <Whitelabel />
          </NonVolunteerGuard>
        </ProtectedRoute>
      </Route>
      <Route path="/site/:subdomain">
        <PublicSite />
      </Route>
      <Route path="/super-admin">
        <ProtectedRoute>
          <SuperAdminPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
