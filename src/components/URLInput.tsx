import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface URLInputProps {
  onExtract: (url: string, mode: 'single' | 'crawl') => void;
  isLoading: boolean;
  scrapeMode: 'single' | 'crawl';
  onScrapeModeChange: (mode: 'single' | 'crawl') => void;
}

const URLInput = ({ onExtract, isLoading, scrapeMode, onScrapeModeChange }: URLInputProps) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (trimmedUrl) {
      let finalUrlToExtract = trimmedUrl;
      try {
        // Attempt to parse the URL as is.
        // If it's something like "example.com", new URL() will throw.
        // If it's "http://example.com", it will parse.
        new URL(trimmedUrl);
        // If it didn't throw, it means trimmedUrl is already a fully qualified URL with a scheme.
        finalUrlToExtract = trimmedUrl;
      } catch (_) {
        // If new URL(trimmedUrl) threw, it's likely missing a scheme (e.g., "example.com").
        // Prepend "https://"
        // The isValidUrl check (which enables the button) should have ensured that 
        // prepending "https://" results in a valid URL.
        finalUrlToExtract = 'https://' + trimmedUrl;
      }
      onExtract(finalUrlToExtract, scrapeMode);
    }
  };

  const isValidUrl = (string: string) => {
    const trimmedString = string.trim();
    if (!trimmedString) return false; // Handle empty or whitespace-only strings
    try {
      new URL(trimmedString); // Check if it's already a full URL
      return true;
    } catch (_) {
      // If not a full URL (e.g. "example.com"), try prepending https://
      try {
        new URL('https://' + trimmedString);
        return true;
      } catch (e) {
        return false; // Invalid even with https://
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="url"
            placeholder="Enter URL to extract text from..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-11 h-12 text-base md:text-lg bg-white border border-gray-300 rounded-md focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors duration-200 shadow-sm"
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-center">
          <RadioGroup
            value={scrapeMode}
            onValueChange={onScrapeModeChange}
            disabled={isLoading}
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single" className="text-sm text-gray-600 cursor-pointer">
                Single Page Only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="crawl" id="crawl" />
              <Label htmlFor="crawl" className="text-sm text-gray-600 cursor-pointer">
                Crawl Entire Site
              </Label>
            </div>
          </RadioGroup>
        </div>
        <Button
          type="submit"
          disabled={!url.trim() || !isValidUrl(url) || isLoading}
          className="w-full h-12 text-base md:text-lg bg-gray-800 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 shadow-sm disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {scrapeMode === 'crawl' ? 'Crawling...' : 'Extracting...'}
            </>
          ) : (
            scrapeMode === 'crawl' ? 'Crawl Site' : 'Extract Page'
          )}
        </Button>
      </form>
    </div>
  );
};

export default URLInput;
