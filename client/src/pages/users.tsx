import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Search, Filter, Users as UsersIcon, Key, AlertTriangle, UserCog } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  userRole: string;
  createdAt: string;
  lastLoginAt: string | null;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  volunteer: "Voluntário",
  beneficiary: "Beneficiário"
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin":
      return "destructive";
    case "manager":
      return "default";
    case "volunteer":
      return "secondary";
    case "beneficiary":
      return "outline";
    default:
      return "default";
  }
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newUserRole, setNewUserRole] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json() as Promise<User[]>;
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ newPassword: password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao redefinir senha');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha redefinida",
        description: "A senha do usuário foi redefinida com sucesso.",
      });
      setIsDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changeUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao alterar tipo de usuário");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tipo alterado",
        description: "O tipo de usuário foi alterado com sucesso.",
      });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      setNewUserRole("");
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleResetPassword = () => {
    if (!selectedUser || !newPassword) return;
    
    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({ 
      userId: selectedUser.id, 
      password: newPassword 
    });
  };

  const openResetDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setIsDialogOpen(true);
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewUserRole(user.userRole);
    setIsRoleDialogOpen(true);
  };

  const handleChangeRole = () => {
    if (!selectedUser || !newUserRole) return;

    changeUserRoleMutation.mutate({
      userId: selectedUser.id,
      newRole: newUserRole,
    });
  };

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.userRole === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Get unique roles for filter dropdown
  const availableRoles = Array.from(new Set(users.map(user => user.userRole)));

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando usuários...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-2">Erro ao carregar usuários</p>
            <p className="text-muted-foreground text-sm">Tente recarregar a página</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todos os usuários cadastrados
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <UsersIcon className="h-4 w-4" />
          <span>{filteredUsers.length} de {users.length} usuários</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="w-full md:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role] || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || selectedRole !== "all" 
                  ? "Nenhum usuário encontrado com os filtros aplicados"
                  : "Nenhum usuário cadastrado"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Nome</th>
                    <th className="text-left p-4 font-semibold">Email</th>
                    <th className="text-left p-4 font-semibold">Tipo de Usuário</th>
                    <th className="text-left p-4 font-semibold">Posição</th>
                    <th className="text-left p-4 font-semibold">Último Acesso</th>
                    <th className="text-left p-4 font-semibold">Data de Cadastro</th>
                    <th className="text-left p-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">{user.name}</td>
                      <td className="p-4 text-muted-foreground">{user.email}</td>
                      <td className="p-4">
                        <Badge variant={getRoleBadgeVariant(user.userRole)}>
                          {roleLabels[user.userRole] || user.userRole}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {user.position || "-"}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR')
                          : "Nunca"
                        }
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResetDialog(user)}
                            className="flex items-center space-x-1"
                          >
                            <Key className="h-3 w-3" />
                            <span>Redefinir Senha</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleDialog(user)}
                            className="flex items-center space-x-1"
                          >
                            <UserCog className="h-3 w-3" />
                            <span>Alterar Tipo</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para redefinir senha */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setSelectedUser(null);
          setNewPassword("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Redefinir Senha</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você está prestes a redefinir a senha para:
            </p>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{selectedUser?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Digite a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                A senha deve ter pelo menos 6 caracteres.
              </p>
            </div>
          </div>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={resetPasswordMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending || !newPassword}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {resetPasswordMutation.isPending ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para alterar tipo de usuário */}
      <Dialog open={isRoleDialogOpen} onOpenChange={(open) => {
        setIsRoleDialogOpen(open);
        if (!open) {
          setSelectedUser(null);
          setNewUserRole("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UserCog className="h-5 w-5 text-blue-500" />
              <span>Alterar Tipo de Usuário</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione o novo tipo para <strong>{selectedUser?.name}</strong>:
            </p>
            <div className="space-y-2">
              <Label htmlFor="userRole">Novo Tipo de Usuário</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="volunteer">Voluntário</SelectItem>
                  <SelectItem value="beneficiary">Beneficiário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={changeUserRoleMutation.isPending || !newUserRole}
            >
              {changeUserRoleMutation.isPending ? "Alterando..." : "Alterar Tipo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </MainLayout>
  );
}