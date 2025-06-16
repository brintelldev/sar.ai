import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Award, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CertificateData {
  studentName: string;
  courseName: string;
  organizationName: string;
  completionDate: string;
  duration: number;
  certificateId: string;
  instructorName?: string;
}

interface CertificateGeneratorProps {
  certificateData: CertificateData;
  onGenerate?: () => void;
}

export function CertificateGenerator({ certificateData, onGenerate }: CertificateGeneratorProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!certificateRef.current) return;

    try {
      // Captura o componente como imagem
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Cria o PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Salva o PDF
      const fileName = `certificado-${certificateData.courseName.toLowerCase().replace(/\s+/g, '-')}-${certificateData.certificateId}.pdf`;
      pdf.save(fileName);
      
      onGenerate?.();
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
    }
  };

  const formattedDate = format(new Date(certificateData.completionDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-6">
      {/* Certificado para captura */}
      <div 
        ref={certificateRef}
        className="bg-white p-12 border-8 border-blue-600 mx-auto"
        style={{ 
          width: '800px', 
          minHeight: '600px',
          fontFamily: 'serif',
          background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)'
        }}
      >
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Award className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-blue-800 mb-2">CERTIFICADO</h1>
          <h2 className="text-2xl text-blue-600 mb-4">DE CONCLUSÃO</h2>
          <div className="w-32 h-1 bg-blue-600 mx-auto"></div>
        </div>

        {/* Conteúdo principal */}
        <div className="text-center space-y-6">
          <p className="text-lg text-gray-700">
            Certificamos que
          </p>
          
          <div className="py-4 px-8 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h3 className="text-3xl font-bold text-blue-800 uppercase">
              {certificateData.studentName}
            </h3>
          </div>

          <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
            concluiu com aproveitamento o curso de 
            <span className="font-bold text-blue-800"> "{certificateData.courseName}"</span>,
            com carga horária de <span className="font-bold">{certificateData.duration} horas</span>,
            oferecido pela organização <span className="font-bold">{certificateData.organizationName}</span>.
          </p>

          <div className="flex justify-center items-center space-x-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span>Concluído em {formattedDate}</span>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-12 flex justify-between items-end">
          <div className="text-left">
            <div className="w-48 border-b-2 border-gray-400 mb-2"></div>
            <p className="text-sm text-gray-600">
              {certificateData.instructorName || 'Coordenação do Curso'}
            </p>
            <p className="text-xs text-gray-500">Instrutor(a)</p>
          </div>
          
          <div className="text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Certificado Verificado</p>
            <p className="text-xs text-gray-400">ID: {certificateData.certificateId}</p>
          </div>
          
          <div className="text-right">
            <div className="w-48 border-b-2 border-gray-400 mb-2"></div>
            <p className="text-sm text-gray-600">{certificateData.organizationName}</p>
            <p className="text-xs text-gray-500">Organização</p>
          </div>
        </div>
      </div>

      {/* Botão de download */}
      <div className="text-center">
        <Button 
          onClick={generatePDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
        >
          <Download className="w-5 h-5 mr-2" />
          Baixar Certificado em PDF
        </Button>
      </div>
    </div>
  );
}

// Componente de pré-visualização menor
export function CertificatePreview({ certificateData }: { certificateData: CertificateData }) {
  const formattedDate = format(new Date(certificateData.completionDate), "dd/MM/yyyy");

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <Award className="w-12 h-12 text-blue-600 mx-auto" />
          <div>
            <h3 className="font-bold text-lg text-blue-800">Certificado Disponível</h3>
            <p className="text-sm text-gray-600">{certificateData.courseName}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <p className="font-semibold text-blue-800">{certificateData.studentName}</p>
            <p className="text-sm text-gray-600">Concluído em {formattedDate}</p>
            <p className="text-xs text-gray-500">Duração: {certificateData.duration}h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}