
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import URLInput from '@/components/URLInput';
import TextDisplay from '@/components/TextDisplay';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    loadPyodide: any;
  }
}

const Index = () => {
  const [extractedText, setExtractedText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [isPyodideLoading, setIsPyodideLoading] = useState(true);
  const { toast } = useToast();

  // Initialize Pyodide
  useEffect(() => {
    const initPyodide = async () => {
      try {
        console.log('Loading Pyodide...');
        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
        });
        
        console.log('Installing Python packages...');
        await pyodideInstance.loadPackage(['micropip']);
        
        // Install packages using runPythonAsync instead of runPython
        await pyodideInstance.runPythonAsync(`
          import micropip
          await micropip.install(['beautifulsoup4', 'strip-tags', 'lxml'])
          print("Packages installed successfully")
        `);
        
        // Load the simplified crawler script
        const crawlerScript = `
import sys
import asyncio
from urllib.parse import urlparse, urljoin
import random
import time

try:
    from pyodide.http import pyfetch
    IS_PYODIDE = True
except ImportError:
    IS_PYODIDE = False

from bs4 import BeautifulSoup
from strip_tags import strip_tags

DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

async def fetch_page_content(url, user_agent_string):
    print(f"Fetching: {url}")
    try:
        response = await pyfetch(url, method="GET", headers={"User-Agent": user_agent_string})
        if response.ok:
            final_url = response.url if hasattr(response, 'url') and response.url else url
            return await response.text(), final_url
        else:
            print(f"Error fetching {url}: Status {response.status}")
            return None, url
    except Exception as e:
        print(f"Exception during fetch for {url}: {e}")
        return None, url

def process_html_content(html_content, source_url):
    try:
        processed_text = strip_tags(html_content, minify=True, remove_blank_lines=True)
        return f"Content from: {source_url}\\n\\n{processed_text}"
    except Exception as e:
        error_message = f"Error processing content from '{source_url}': {e}"
        print(error_message)
        return f"Error processing content from: {source_url}\\n\\n{error_message}"

async def extract_text_from_url(url):
    try:
        html_content, final_url = await fetch_page_content(url, DEFAULT_USER_AGENT)
        if html_content:
            return process_html_content(html_content, final_url)
        else:
            return f"Failed to fetch content from: {url}"
    except Exception as e:
        return f"Error extracting text from {url}: {str(e)}"

print("Text extraction functions loaded successfully")
`;
        
        await pyodideInstance.runPython(crawlerScript);
        
        setPyodide(pyodideInstance);
        setIsPyodideLoading(false);
        console.log('Pyodide initialized successfully');
        
        toast({
          title: "Ready!",
          description: "Text extraction engine loaded successfully.",
        });
      } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        setIsPyodideLoading(false);
        toast({
          title: "Initialization Error",
          description: "Failed to load the text extraction engine. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    // Load Pyodide script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
    script.onload = initPyodide;
    script.onerror = () => {
      setIsPyodideLoading(false);
      toast({
        title: "Loading Error",
        description: "Failed to load Pyodide. Please check your internet connection.",
        variant: "destructive",
      });
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [toast]);

  const handleExtract = async (url: string) => {
    if (!pyodide) {
      toast({
        title: "Not Ready",
        description: "Text extraction engine is still loading. Please wait.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Extracting text from:', url);
      
      // Run the Python extraction function
      const result = await pyodide.runPythonAsync(`
        result = await extract_text_from_url("${url}")
        result
      `);
      
      setExtractedText(result);
      setSourceUrl(url);
      
      toast({
        title: "Success!",
        description: "Text has been extracted successfully.",
      });
    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: "Extraction Error",
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
        
        {isPyodideLoading && (
          <div className="text-center mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">Loading text extraction engine...</span>
              </div>
              <p className="text-blue-600 text-sm mt-2">This may take a moment on first load</p>
            </div>
          </div>
        )}
        
        <div className="space-y-8">
          <URLInput 
            onExtract={handleExtract} 
            isLoading={isLoading || isPyodideLoading} 
          />
          
          {extractedText && (
            <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <TextDisplay extractedText={extractedText} sourceUrl={sourceUrl} />
            </div>
          )}
        </div>
        
        {!extractedText && !isLoading && !isPyodideLoading && (
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
                    Our Python-powered tool fetches and processes the page content
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <p className="text-gray-600">
                    Get clean, readable text without ads, navigation, or clutter
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
