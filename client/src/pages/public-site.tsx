import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Target, Phone, Mail, MapPin, ExternalLink } from "lucide-react";

interface PublicSiteData {
  id: string;
  subdomain: string;
  organizationName: string;
  isActive: boolean;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  content?: {
    hero?: {
      title: string;
      subtitle: string;
      ctaText: string;
    };
    about?: {
      title: string;
      description: string;
    };
    contact?: {
      email: string;
      phone: string;
      address: string;
    };
  };
}

export default function PublicSite() {
  const [match, params] = useRoute("/site/:subdomain");
  const subdomain = params?.subdomain;
  
  const { data: siteData, isLoading, error } = useQuery({
    queryKey: ['/api/public/site', subdomain],
    queryFn: () => fetch(`/api/public/site/${subdomain}`).then(res => res.json()),
    enabled: !!subdomain
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando site...</p>
        </div>
      </div>
    );
  }

  if (error || !siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Site não encontrado</h1>
          <p className="text-gray-600 mb-4">
            O site que você está procurando não existe ou não está ativo.
          </p>
          <Button asChild>
            <a href="https://plataforma.org">Voltar ao início</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!siteData.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🚧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Site em manutenção</h1>
          <p className="text-gray-600">
            Este site está temporariamente indisponível.
          </p>
        </div>
      </div>
    );
  }

  const theme = siteData.theme || {};
  const content = siteData.content || {};
  const hero = content.hero || {};
  const about = content.about || {};
  const contact = content.contact || {};

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              {theme.logoUrl ? (
                <img src={theme.logoUrl} alt={siteData.organizationName} className="h-10 w-auto" />
              ) : (
                <div className="h-10 w-10 bg-blue-600 rounded flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
              )}
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                {siteData.organizationName}
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#inicio" className="text-gray-700 hover:text-blue-600">Início</a>
              <a href="#sobre" className="text-gray-700 hover:text-blue-600">Sobre</a>
              <a href="#projetos" className="text-gray-700 hover:text-blue-600">Projetos</a>
              <a href="#contato" className="text-gray-700 hover:text-blue-600">Contato</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="bg-gradient-to-br from-blue-50 to-blue-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {hero.title || "Bem-vindos à nossa organização"}
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {hero.subtitle || "Trabalhamos para construir um mundo melhor através de ações sociais que transformam vidas e comunidades."}
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700"
            style={theme.primaryColor ? { backgroundColor: theme.primaryColor } : {}}
          >
            {hero.ctaText || "Saiba Mais"}
          </Button>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              {about.title || "Sobre Nossa Missão"}
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {about.description || "Nossa organização dedica-se a criar impacto social positivo, oferecendo suporte, capacitação e oportunidades para comunidades em situação de vulnerabilidade."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Pessoas Atendidas</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Apoiamos diretamente famílias e indivíduos em situação de vulnerabilidade social.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Projetos Sociais</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Desenvolvemos projetos focados em educação, capacitação profissional e geração de renda.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Heart className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Voluntariado</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Contamos com uma rede de voluntários dedicados que contribuem com seu tempo e habilidades.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Entre em Contato</h3>
            <p className="text-lg text-gray-600">
              Gostaria de saber mais sobre nosso trabalho ou como pode contribuir?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h4 className="text-xl font-semibold text-gray-900 mb-6">Informações de Contato</h4>
              <div className="space-y-4">
                {contact.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-gray-600">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-gray-600">{contact.phone}</span>
                  </div>
                )}
                {contact.address && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-gray-600">{contact.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xl font-semibold text-gray-900 mb-6">Como Ajudar</h4>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Seja um Voluntário</h5>
                    <p className="text-sm text-gray-600">
                      Junte-se à nossa equipe de voluntários e faça a diferença na vida de pessoas.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Faça uma Doação</h5>
                    <p className="text-sm text-gray-600">
                      Sua contribuição financeira nos ajuda a expandir nossos projetos sociais.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h5 className="text-xl font-semibold mb-2">{siteData.organizationName}</h5>
            <p className="text-gray-400 mb-4">
              Transformando vidas através do trabalho social
            </p>
            <Badge variant="secondary" className="bg-gray-800 text-gray-300">
              Powered by SAR.AI Platform
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}