
import React, { useState } from 'react';
import Header from '@/components/Header';
import URLInput from '@/components/URLInput';
import TextDisplay from '@/components/TextDisplay';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [extractedText, setExtractedText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExtract = async (url: string) => {
    setIsLoading(true);
    try {
      // This is where you'll integrate your Python script with Pyiodide
      // For now, I'll simulate the extraction process
      console.log('Extracting text from:', url);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Placeholder extracted text - replace this with your actual Pyiodide integration
      const mockExtractedText = `This is a sample extracted text from ${url}.
      
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`;

      setExtractedText(mockExtractedText);
      setSourceUrl(url);
      
      toast({
        title: "Success!",
        description: "Text has been extracted successfully.",
      });
    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: "Error",
        description: "Failed to extract text from the URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Header />
        
        <div className="space-y-8">
          <URLInput onExtract={handleExtract} isLoading={isLoading} />
          
          {extractedText && (
            <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <TextDisplay extractedText={extractedText} sourceUrl={sourceUrl} />
            </div>
          )}
        </div>
        
        {!extractedText && !isLoading && (
          <div className="text-center mt-16">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                How it works
              </h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <p className="text-gray-600">
                    Paste any webpage URL in the input field above
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <p className="text-gray-600">
                    Our tool crawls the page and extracts only the meaningful text
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <p className="text-gray-600">
                    Copy or download the clean text without ads, navigation, or clutter
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
