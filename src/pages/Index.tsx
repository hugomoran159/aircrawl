
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
        
        // Load the full crawler script
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

async def fetch_page_content_sequential(url, user_agent_string):
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

def process_html_content_string_main(html_content, source_url):
    try:
        processed_text = strip_tags(html_content, minify=True, remove_blank_lines=True)
        return f"\\n--- Content from: {source_url} ---\\n{processed_text}"
    except Exception as e:
        error_message = f"Error processing content from '{source_url}': {e}"
        print(error_message)
        return f"\\n--- Error processing content from: {source_url} ---\\n{error_message}"

def extract_relevant_links_main(html_content, base_url, target_domain):
    links = set()
    try:
        try: 
            soup = BeautifulSoup(html_content, 'lxml')
        except: 
            soup = BeautifulSoup(html_content, 'html.parser')
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            if not href or href.startswith('#') or href.lower().startswith(('mailto:', 'tel:', 'javascript:')):
                continue
            abs_url = urljoin(base_url, href)
            parsed_abs_url = urlparse(abs_url)
            if parsed_abs_url.scheme in ['http', 'https'] and parsed_abs_url.netloc == target_domain:
                links.add(parsed_abs_url._replace(fragment="").geturl())
    except Exception as e:
        print(f"Error parsing HTML from {base_url} for links: {e}")
    return links

async def crawl_website_sequential_async(start_url, user_agent, base_wait_time=0.5, random_wait_extra=0.5):
    parsed_start_url = urlparse(start_url)
    target_domain = parsed_start_url.netloc
    if not target_domain:
        raise ValueError(f"Invalid start URL: {start_url}")

    print(f"Starting crawl for domain: {target_domain}")
    queue = []
    queue.append(start_url)
    visited_urls = {start_url}
    all_content_pieces = []
    processed_count = 0

    while queue:
        current_url = queue.pop(0)
        if urlparse(current_url).netloc != target_domain:
            print(f"Skipping (off-domain): {current_url}")
            continue

        print(f"Processing ({processed_count + 1}): {current_url}")
        html_content, final_url = await fetch_page_content_sequential(current_url, user_agent)
        
        if urlparse(final_url).netloc != target_domain:
            print(f"Skipping (redirected off-domain): {current_url} -> {final_url}")
            continue
        
        if html_content:
            processed_block = process_html_content_string_main(html_content, final_url)
            all_content_pieces.append(processed_block)
            new_links = extract_relevant_links_main(html_content, final_url, target_domain)
            for link in new_links:
                if link not in visited_urls:
                    visited_urls.add(link)
                    queue.append(link)
            
            processed_count += 1
        
        # Politeness delay
        actual_wait = base_wait_time + (random.random() * random_wait_extra if random_wait_extra > 0 else 0)
        print(f"Waiting {actual_wait:.2f}s...")
        await asyncio.sleep(actual_wait)
    
    combined_content = "".join(all_content_pieces)
    print(f"Crawl complete. Processed {processed_count} pages. Total content length: {len(combined_content)} characters")
    return combined_content

print("Website crawler functions loaded successfully")
`;
        
        await pyodideInstance.runPython(crawlerScript);
        
        setPyodide(pyodideInstance);
        setIsPyodideLoading(false);
        console.log('Pyodide initialized successfully');
        
        toast({
          title: "Ready!",
          description: "Website crawler loaded successfully.",
        });
      } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        setIsPyodideLoading(false);
        toast({
          title: "Initialization Error",
          description: "Failed to load the website crawler. Please refresh the page.",
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
        description: "Website crawler is still loading. Please wait.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting website crawl for:', url);
      
      toast({
        title: "Crawling Started",
        description: "Starting to crawl the website. This may take a while depending on the site size.",
      });
      
      // Run the Python crawling function
      const result = await pyodide.runPythonAsync(`
        result = await crawl_website_sequential_async("${url}", "${DEFAULT_USER_AGENT}")
        result
      `);
      
      setExtractedText(result);
      setSourceUrl(url);
      
      toast({
        title: "Crawl Complete!",
        description: "Website has been crawled and text extracted successfully.",
      });
    } catch (error) {
      console.error('Error crawling website:', error);
      toast({
        title: "Crawling Error",
        description: "Failed to crawl the website. Please try again or check if the URL is accessible.",
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
                <span className="text-blue-800 font-medium">Loading website crawler...</span>
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
                    Paste any website URL in the input field above
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <p className="text-gray-600">
                    Our crawler will visit all pages on the same domain and extract content
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <p className="text-gray-600">
                    Get a single file with all the clean, readable text from the entire website
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
