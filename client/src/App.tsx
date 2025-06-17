import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSimpleAuth as useAuth } from "@/hooks/use-simple-auth";
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
import CourseProgress from "@/pages/course-progress";
import Certificate from "@/pages/certificate";
import { CourseAdmin } from "@/pages/course-admin";
import { CourseEditor } from "@/pages/course-editor";
import { ModuleEditor } from "@/pages/module-editor";
import Whitelabel from "@/pages/whitelabel";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, currentOrganization, organizations } = useAuth();

  // Debug logging
  console.log('ProtectedRoute debug:', { 
    isAuthenticated, 
    isLoading, 
    currentOrganization, 
    organizationsCount: organizations?.length 
  });

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
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/projects">
        <ProtectedRoute>
          <Projects />
        </ProtectedRoute>
      </Route>
      <Route path="/donors">
        <ProtectedRoute>
          <Donors />
        </ProtectedRoute>
      </Route>
      <Route path="/beneficiaries">
        <ProtectedRoute>
          <Beneficiaries />
        </ProtectedRoute>
      </Route>
      <Route path="/volunteers">
        <ProtectedRoute>
          <Volunteers />
        </ProtectedRoute>
      </Route>
      <Route path="/donations">
        <ProtectedRoute>
          <Donations />
        </ProtectedRoute>
      </Route>
      <Route path="/accounts-receivable">
        <ProtectedRoute>
          <AccountsReceivable />
        </ProtectedRoute>
      </Route>
      <Route path="/accounts-payable">
        <ProtectedRoute>
          <AccountsPayable />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <FinancialReports />
        </ProtectedRoute>
      </Route>
      <Route path="/funders">
        <ProtectedRoute>
          <Funders />
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
      <Route path="/courses/:courseId/progress">
        <ProtectedRoute>
          <CourseProgress />
        </ProtectedRoute>
      </Route>
      <Route path="/courses/:id/certificate">
        <ProtectedRoute>
          <Certificate />
        </ProtectedRoute>
      </Route>
      <Route path="/course-admin">
        <ProtectedRoute>
          <CourseAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/course-admin/:id">
        <ProtectedRoute>
          <CourseEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/courses/:courseId/modules">
        <ProtectedRoute>
          <ModuleEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/support">
        <ProtectedRoute>
          <Support />
        </ProtectedRoute>
      </Route>
      <Route path="/whitelabel">
        <ProtectedRoute>
          <Whitelabel />
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
