import { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { VisualTemplate, VisualTemplateField } from '@shared/schema';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Footer } from '@/components/Footer';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';

export default function VisualTemplateEditor() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const templateRef = useRef<HTMLDivElement>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);

  const { data: template, isLoading } = useQuery<VisualTemplate & { backgroundImage: string }>({
    queryKey: ['/api/visual-templates', params.id],
    enabled: !!params.id,
  });

  const fields = (template?.fields as VisualTemplateField[]) || [];

  useEffect(() => {
    if (fields.length > 0) {
      const initialValues: Record<string, string> = {};
      fields.forEach(field => {
        initialValues[field.id] = '';
      });
      setFieldValues(initialValues);
    }
  }, [fields]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const exportToPDF = async () => {
    if (!templateRef.current || !template) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(templateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pageWidth = template.pageWidth || 595;
      const pageHeight = template.pageHeight || 842;
      const orientation = pageWidth > pageHeight ? 'landscape' : 'portrait';
      const widthMm = pageWidth * 0.264583;
      const heightMm = pageHeight * 0.264583;
      
      const pdf = new jsPDF({
        orientation: orientation as 'portrait' | 'landscape',
        unit: 'mm',
        format: [widthMm, heightMm],
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${template.name || 'document'}.pdf`);
      
      toast({ title: 'PDF бо муваффақият сохта шуд', variant: 'default' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({ title: 'Хатогӣ ҳангоми содири PDF', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Боргирӣ...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Намунаи визуалӣ ёфт нашуд</p>
            <Button onClick={() => setLocation('/department/main')} className="mt-4">
              Бозгашт
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
      <PageHeaderContainer className="bg-gradient-to-r from-green-600 to-green-700">
        <PageHeader>
          <PageHeaderLeft>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/department/main')}
              className="text-white hover:bg-white/20"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-white truncate">{template.name}</h1>
          </PageHeaderLeft>
          <PageHeaderRight>
            <Button
              onClick={exportToPDF}
              disabled={isExporting}
              className="bg-white text-green-700 hover:bg-white/90"
              data-testid="button-export-pdf"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Содир кардан PDF
            </Button>
          </PageHeaderRight>
        </PageHeader>
      </PageHeaderContainer>

      <main className="flex-1 container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ворид кардани маълумот</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{field.label}</Label>
                    {field.name === 'content' ? (
                      <Textarea
                        id={field.id}
                        value={fieldValues[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        data-testid={`input-field-${field.name}`}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        value={fieldValues[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        data-testid={`input-field-${field.name}`}
                      />
                    )}
                  </div>
                ))}
                {fields.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    Ягон майдон илова нашудааст
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Пешнамоиш</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={templateRef}
                  className="relative bg-white shadow-lg mx-auto"
                  style={{
                    width: '100%',
                    maxWidth: `${Math.min(template.pageWidth || 595, 600)}px`,
                    aspectRatio: `${template.pageWidth || 595}/${template.pageHeight || 842}`,
                  }}
                >
                  {template.backgroundImage && (
                    <img
                      src={template.backgroundImage}
                      alt="Template background"
                      className="w-full h-full object-cover absolute inset-0"
                      crossOrigin="anonymous"
                    />
                  )}
                  
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="absolute flex items-start overflow-hidden"
                      style={{
                        left: `${field.x}%`,
                        top: `${field.y}%`,
                        width: `${field.width}%`,
                        height: `${field.height}%`,
                        fontSize: `${(field.fontSize || 12) * 0.8}px`,
                        fontFamily: field.fontFamily || 'Times New Roman',
                        textAlign: field.textAlign || 'left',
                        lineHeight: 1.2,
                      }}
                    >
                      <span className="whitespace-pre-wrap break-words w-full">
                        {fieldValues[field.id] || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
