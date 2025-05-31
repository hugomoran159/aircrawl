
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Loader2 } from 'lucide-react';

interface URLInputProps {
  onExtract: (url: string) => void;
  isLoading: boolean;
}

const URLInput = ({ onExtract, isLoading }: URLInputProps) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onExtract(url.trim());
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="url"
            placeholder="Enter URL to extract text from..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10 h-12 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-blue-500 transition-all duration-300"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={!url.trim() || !isValidUrl(url) || isLoading}
          className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Extracting Text...
            </>
          ) : (
            'Extract Text'
          )}
        </Button>
      </form>
    </div>
  );
};

export default URLInput;
