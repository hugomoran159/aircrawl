import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TextDisplayProps {
  extractedText: string;
  sourceUrl: string;
}

const TextDisplay = ({ extractedText, sourceUrl }: TextDisplayProps) => {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      toast({
        title: "Copied!",
        description: "Text has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy text to clipboard.",
        variant: "destructive",
      });
    }
  };

  const downloadText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-text-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
      <CardHeader className="pb-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-semibold text-gray-700">
            <FileText className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
            Extracted Text
          </CardTitle>
          <div className="flex gap-2 self-end sm:self-center">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 focus:ring-gray-500"
            >
              <Copy className="h-4 w-4 mr-1.5" />
              Copy
            </Button>
            <Button
              onClick={downloadText}
              variant="outline"
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 focus:ring-gray-500"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>
          </div>
        </div>
        <p className="text-xs md:text-sm text-gray-500 break-all mt-2">
          Source: {sourceUrl}
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-[50vh] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
            {extractedText}
          </pre>
        </div>
        <div className="mt-4 text-xs md:text-sm text-gray-500">
          Word count: {extractedText.split(/\s+/).filter(word => word.length > 0).length} | 
          Character count: {extractedText.length}
        </div>
      </CardContent>
    </Card>
  );
};

export default TextDisplay;
