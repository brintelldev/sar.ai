import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/use-auth';
import { HelpCircle, MessageSquare, Book, Phone, Mail, ExternalLink, Clock, CheckCircle } from 'lucide-react';

export default function Support() {
  const { user, currentOrganization } = useAuth();
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    priority: '',
    description: '',
  });

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    // Here we would typically send the ticket to the backend
    console.log('Ticket submitted:', ticketForm);
    // Reset form
    setTicketForm({
      subject: '',
      category: '',
      priority: '',
      description: '',
    });
  };

  const faqs = [
    {
      question: "Como cadastrar uma nova pessoa atendida?",
      answer: "Para cadastrar uma nova pessoa atendida, vá para o menu 'Pessoas Atendidas' e clique em 'Novo Acolhimento'. Preencha os dados necessários seguindo as diretrizes de privacidade da LGPD."
    },
    {
      question: "Como gerenciar doações recorrentes?",
      answer: "No módulo de Doações, você pode configurar doações recorrentes marcando a opção correspondente no formulário. O sistema automaticamente criará os registros futuros conforme a periodicidade definida."
    },
    {
      question: "Como gerar relatórios de compliance?",
      answer: "Os relatórios de compliance estão disponíveis no menu Relatórios. Você pode filtrar por período, tipo de dado e área de atuação para gerar relatórios específicos."
    },
    {
      question: "Como configurar usuários e permissões?",
      answer: "Apenas administradores podem gerenciar usuários. Acesse as Configurações da Organização para adicionar novos usuários e definir seus níveis de acesso."
    },
    {
      question: "Como garantir a privacidade dos dados sensíveis?",
      answer: "A plataforma segue rigorosamente a LGPD. Todos os dados são criptografados, há controles de acesso granulares e logs de auditoria para todas as operações."
    }
  ];

  const supportTickets = [
    {
      id: "TK-001",
      subject: "Problema com relatório de doações",
      status: "Aberto",
      priority: "Alta",
      created: "2024-06-08",
      category: "Técnico"
    },
    {
      id: "TK-002", 
      subject: "Dúvida sobre LGPD compliance",
      status: "Resolvido",
      priority: "Média",
      created: "2024-06-05",
      category: "Conformidade"
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Central de Suporte</h1>
          <p className="text-muted-foreground">
            Encontre ajuda, documentação e entre em contato conosco
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5" />
                  <span>Ações Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Book className="h-4 w-4 mr-2" />
                  Documentação
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat ao Vivo
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Agendar Ligação
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Tutoriais em Vídeo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>suporte@sarai.com.br</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>(11) 3333-4444</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Seg-Sex: 8h às 18h</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Support Ticket */}
            <Card>
              <CardHeader>
                <CardTitle>Abrir Chamado de Suporte</CardTitle>
                <CardDescription>
                  Descreva seu problema ou dúvida detalhadamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto</Label>
                      <Input
                        id="subject"
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                        placeholder="Resumo do problema"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={ticketForm.category}
                        onValueChange={(value) => setTicketForm({ ...ticketForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Problema Técnico</SelectItem>
                          <SelectItem value="billing">Cobrança</SelectItem>
                          <SelectItem value="feature">Nova Funcionalidade</SelectItem>
                          <SelectItem value="compliance">Conformidade/LGPD</SelectItem>
                          <SelectItem value="training">Treinamento</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={ticketForm.priority}
                      onValueChange={(value) => setTicketForm({ ...ticketForm, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                      placeholder="Descreva detalhadamente o problema ou dúvida..."
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Enviar Chamado
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Support Tickets History */}
            <Card>
              <CardHeader>
                <CardTitle>Meus Chamados</CardTitle>
                <CardDescription>
                  Histórico dos seus chamados de suporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{ticket.id}</span>
                          <Badge variant={ticket.status === 'Resolvido' ? 'default' : 'secondary'}>
                            {ticket.status === 'Resolvido' ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {ticket.status}
                          </Badge>
                          <Badge variant="outline">{ticket.priority}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{ticket.created}</span>
                      </div>
                      <h4 className="font-medium mb-1">{ticket.subject}</h4>
                      <p className="text-sm text-muted-foreground">Categoria: {ticket.category}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Frequentes</CardTitle>
            <CardDescription>
              Respostas para as dúvidas mais comuns sobre a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}