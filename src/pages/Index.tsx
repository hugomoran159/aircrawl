import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import URLInput from '@/components/URLInput';
import TextDisplay from '@/components/TextDisplay';
import { useToast } from '@/hooks/use-toast';
import * as cheerio from 'cheerio'; // Import cheerio

// Helper function to delay execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Start of JavaScript Crawler Functions ---

// NEW: Progress data structure
interface CrawlProgress {
  currentAction: string; // e.g., "Fetching", "Processing", "Idle", "Error"
  url?: string; // Current URL being processed
  processedCount: number;
  successfulCount: number;
  failedCount: number;
  queueSize: number;
}

const DEFAULT_JS_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

async function fetchPageContentJS(url: string, userAgent: string = DEFAULT_JS_USER_AGENT): Promise<{html: string | null, finalUrl: string, error?: string}> {
  // console.log(`Fetching (JS): ${url}`); // Console log can be handled by onProgress
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": userAgent,
      },
      // It's good practice to handle redirects manually if you need to inspect them,
      // but for simplicity, we'll let fetch handle them by default (redirect: 'follow').
    });

    if (response.ok) {
      const html = await response.text();
      // response.url will contain the final URL after any redirects
      return { html, finalUrl: response.url || url };
    } else {
      console.error(`Error fetching ${url}: Status ${response.status}`);
      return { html: null, finalUrl: url, error: `HTTP status ${response.status}` };
    }
  } catch (e) {
    console.error(`Exception during JS fetch for ${url}:`, e);
    const error = e as Error; // Type assertion
    return { html: null, finalUrl: url, error: error.message || String(e) };
  }
}

function processHtmlContentJS(htmlContent: string, sourceUrl: string): {text: string, error?: string} {
  try {
    const $ = cheerio.load(htmlContent);

    // Remove script and style tags first
    $('script, style, noscript, iframe, head, header, footer, nav, aside, form, button, input, textarea, select, option, [aria-hidden="true"], [hidden], link[rel="stylesheet"], meta').remove();
    
    // Attempt to get text from common content containers or body
    let mainContent = $('article').text() || $('main').text() || $('.content').text() || $('#content').text() || $('body').text();
    
    // Fallback to body text if specific containers yield nothing substantial
    if (!mainContent || mainContent.trim().length < 100) {
        mainContent = $('body').text();
    }

    // Basic text cleaning: replace multiple newlines/spaces with a single one
    let processedText = mainContent.replace(/\s\s+/g, ' ').trim();
    processedText = processedText.replace(/\n\s*\n/g, '\n').trim(); // Consolidate multiple blank lines

    return {text: `\n--- Content from: ${sourceUrl} ---\n${processedText}`};
  } catch (e) {
    const error_message = `Error processing content with Cheerio from '${sourceUrl}': ${e}`;
    console.error(error_message);
    const error = e as Error; // Type assertion
    return {text: `\n--- Error processing content from: ${sourceUrl} ---\n${error_message}`, error: error.message || String(e)};
  }
}

function extractRelevantLinksJS(htmlContent: string, baseUrl: string, targetDomain: string): Set<string> {
  const links = new Set<string>();
  try {
    const $ = cheerio.load(htmlContent);
    $('a').each((_i, element) => {
      const href = $(element).attr('href');
      if (!href || href.startsWith('#') || href.toLowerCase().startsWith('mailto:') || href.toLowerCase().startsWith('tel:') || href.toLowerCase().startsWith('javascript:')) {
        return; // Skip irrelevant links
      }
      try {
        const absoluteUrl = new URL(href, baseUrl).toString();
        const parsedAbsoluteUrl = new URL(absoluteUrl);
        if ((parsedAbsoluteUrl.protocol === 'http:' || parsedAbsoluteUrl.protocol === 'https:') && parsedAbsoluteUrl.hostname === targetDomain) {
          links.add(parsedAbsoluteUrl.href.split('#')[0]); // Add URL without fragment
        }
      } catch (urlError) {
        // console.warn(`Could not parse or resolve URL: ${href} relative to ${baseUrl}`, urlError);
      }
    });
  } catch (e) {
    console.error(`Error parsing HTML with Cheerio from ${baseUrl} for links:`, e);
  }
  return links;
}

async function crawlWebsiteJS(
  startUrl: string, 
  userAgent: string = DEFAULT_JS_USER_AGENT, 
  baseWaitTimeMs: number = 500, // Still here but not used, could be removed if sure
  randomWaitExtraMs: number = 500, // Still here but not used
  maxConcurrentRequests: number = 5,
  onProgress?: (progress: CrawlProgress) => void // NEW: onProgress callback
): Promise<string> {
  let parsedStartUrl;
  try {
    parsedStartUrl = new URL(startUrl);
  } catch (e) {
    console.error(`Invalid start URL: ${startUrl}`, e);
    return "Error: Invalid start URL provided.";
  }
  const targetDomain = parsedStartUrl.hostname;

  if (!targetDomain) {
    console.error(`Invalid start URL (no hostname): ${startUrl}`);
    return "Error: Invalid start URL. Could not determine domain.";
  }

  console.log(`Starting JS crawl for domain: ${targetDomain}`);
  const queue: string[] = [startUrl];
  const visitedUrls = new Set<string>([startUrl]);
  const allContentPieces: string[] = [];
  let attemptedProcessingCount = 0; // Renamed from processedCount for clarity
  let successfulProcessingCount = 0;
  let failedProcessingCount = 0;

  const activeFetches: Set<Promise<void>> = new Set();

  const reportProgress = (action: string, url?: string) => {
    if (onProgress) {
      onProgress({
        currentAction: action,
        url: url,
        processedCount: attemptedProcessingCount,
        successfulCount: successfulProcessingCount,
        failedCount: failedProcessingCount,
        queueSize: queue.length + activeFetches.size // More accurate queue size
      });
    }
  };

  reportProgress("Initializing", startUrl);

  const processUrl = async (urlToProcess: string) => {
    attemptedProcessingCount++;
    reportProgress("Fetching", urlToProcess);

    let currentUrlParsed;
    try {
      currentUrlParsed = new URL(urlToProcess);
    } catch (e) {
      console.warn(`Skipping invalid URL in queue: ${urlToProcess}`);
      failedProcessingCount++;
      reportProgress("Error", urlToProcess);
      return;
    }

    if (currentUrlParsed.hostname !== targetDomain) {
      console.log(`Skipping (off-domain): ${urlToProcess}`);
      // Not counted as a failure of *this* crawl, just a skip.
      // If you want to count it, add failedProcessingCount++ and reportProgress
      return;
    }

    // console.log(`Processing JS (${attemptedProcessingCount}): ${urlToProcess}`); // Replaced by onProgress
    const { html: htmlContent, finalUrl, error: fetchError } = await fetchPageContentJS(urlToProcess, userAgent);
    
    if (fetchError || !htmlContent) {
      console.error(`Fetch failed for ${urlToProcess}: ${fetchError}`);
      failedProcessingCount++;
      reportProgress("Error", urlToProcess);
      return;
    }
    
    reportProgress("Processing", finalUrl);

    let finalUrlParsed;
    try {
      finalUrlParsed = new URL(finalUrl);
    } catch (e) {
      console.warn(`Skipping due to invalid final URL: ${finalUrl} (from ${urlToProcess})`);
      failedProcessingCount++;
      reportProgress("Error", finalUrl);
      return;
    }

    if (finalUrlParsed.hostname !== targetDomain) {
      console.log(`Skipping (redirected off-domain): ${urlToProcess} -> ${finalUrl}`);
      return;
    }
    
    const {text: processedBlock, error: processingError} = processHtmlContentJS(htmlContent, finalUrl);
    allContentPieces.push(processedBlock); // Still push even if there was a processing error message inside

    if (processingError) {
        console.error(`Content processing error for ${finalUrl}: ${processingError}`);
        failedProcessingCount++;
        reportProgress("Error", finalUrl);
        // Continue to extract links even if main content processing had issues
    } else {
        successfulProcessingCount++;
        reportProgress("Success", finalUrl);
    }
    
    const newLinks = extractRelevantLinksJS(htmlContent, finalUrl, targetDomain);
    newLinks.forEach(link => {
      if (!visitedUrls.has(link)) {
        visitedUrls.add(link);
        queue.push(link);
      }
    });
    // No politeness delay here
  };
  
  // Main loop
  while (queue.length > 0 || activeFetches.size > 0) {
    while (queue.length > 0 && activeFetches.size < maxConcurrentRequests) {
      const currentUrl = queue.shift()!;
      reportProgress("Queueing", currentUrl); // Report when taken from queue
      const fetchPromise = processUrl(currentUrl)
        .catch(err => {
          console.error(`Unhandled error in processUrl for ${currentUrl}:`, err);
          failedProcessingCount++; // Ensure errors directly from processUrl also count
          reportProgress("Error", currentUrl);
        })
        .finally(() => {
          activeFetches.delete(fetchPromise);
          reportProgress(activeFetches.size > 0 ? "Fetching" : (queue.length > 0 ? "Queueing" : "Idle") ); // Update general status
        });
      activeFetches.add(fetchPromise);
    }

    if (activeFetches.size > 0) {
      await Promise.race(Array.from(activeFetches));
    } else if (queue.length === 0) {
      break; 
    }
     reportProgress(activeFetches.size > 0 ? "Fetching" : (queue.length > 0 ? "Queueing" : "Idle") );
  }
  
  reportProgress("Complete");
  const combinedContent = allContentPieces.join("\n\n");
  console.log(`JS Crawl complete. Attempted: ${attemptedProcessingCount}, Succeeded: ${successfulProcessingCount}, Failed: ${failedProcessingCount}. Total content length: ${combinedContent.length} characters`);
  return combinedContent;
}

// --- End of JavaScript Crawler Functions ---

const Index = () => {
  const [extractedText, setExtractedText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // NEW: State for crawl progress
  const [crawlStatus, setCrawlStatus] = useState<CrawlProgress>({
    currentAction: "Idle",
    processedCount: 0,
    successfulCount: 0,
    failedCount: 0,
    queueSize: 0,
  });

  // Initialize Pyodide
  useEffect(() => {
    // Pyodide initialization logic will be removed.
    // We will replace this with Cheerio and JS fetch later.
    console.log("Pyodide initialization removed. Will use JS-native solutions.");
    // toast({
    //   title: "Ready!",
    //   description: "Website crawler (JS version) is ready.", // Updated message
    // });
  }, [toast]);

  const handleExtract = async (url: string) => {
    setIsLoading(true);
    setExtractedText(''); // Clear previous results
    setSourceUrl('');
    // Reset status
    setCrawlStatus({
      currentAction: "Starting...",
      processedCount: 0,
      successfulCount: 0,
      failedCount: 0,
      queueSize: 0,
      url: url
    });

    try {
      toast({
        title: "Crawling Started",
        description: "Attempting to crawl the website. This may take a while.",
      });
      
      const userAgent = DEFAULT_JS_USER_AGENT;
      
      // NEW: onProgress callback definition
      const onProgressCallback = (progress: CrawlProgress) => {
        setCrawlStatus(progress);
        // Optional: a more detailed toast, but can be noisy.
        // if (progress.currentAction === "Fetching" || progress.currentAction === "Processing") {
        //   toast({
        //     title: `${progress.currentAction} ${progress.url ? progress.url.substring(0, 50)+'...' : ''}`,
        //     description: `Processed: ${progress.processedCount}, Succeeded: ${progress.successfulCount}, Failed: ${progress.failedCount}, Queue: ${progress.queueSize}`,
        //     duration: 2000, // Short duration for progress toasts
        //   });
        // }
      };
      
      const result = await crawlWebsiteJS(url, userAgent, 500, 500, 5, onProgressCallback);
      
      setExtractedText(result);
      setSourceUrl(url);
      
      toast({
        title: "Crawl Complete!",
        description: `Processed: ${crawlStatus.processedCount}, Succeeded: ${crawlStatus.successfulCount}, Failed: ${crawlStatus.failedCount}.`,
      });
    } catch (e) {
      const error = e as Error; // Type assertion
      console.error('Error crawling website:', error);
      setCrawlStatus(prev => ({ ...prev, currentAction: "Error", url: prev.url || url}));
      toast({
        title: "Crawling Error",
        description: error.message || "Failed to crawl the website. Please try again or check if the URL is accessible.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Final status update if needed, or let the last onProgress call stand
      // setCrawlStatus(prev => ({ ...prev, currentAction: "Idle" }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Header />
        
        <div className="space-y-10 md:space-y-12">
          <URLInput 
            onExtract={handleExtract} 
            isLoading={isLoading}
          />

          {/* NEW: Progress Display Area */}
          {isLoading && (
            <div className="max-w-xl mx-auto p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-sm">
              <div className="font-semibold text-gray-700 mb-2">Crawl Progress:</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-gray-600">Status:</span> 
                <span className="text-gray-800 font-medium truncate" title={crawlStatus.url}>
                  {crawlStatus.currentAction} {crawlStatus.url ? `(${new URL(crawlStatus.url).hostname}...)` : ''}
                </span>
                
                <span className="text-gray-600">Attempted:</span> 
                <span className="text-gray-800 font-medium">{crawlStatus.processedCount}</span>
                
                <span className="text-gray-600">Succeeded:</span> 
                <span className="text-gray-800 font-medium text-green-600">{crawlStatus.successfulCount}</span>
                
                <span className="text-gray-600">Failed:</span> 
                <span className="text-gray-800 font-medium text-red-600">{crawlStatus.failedCount}</span>

                <span className="text-gray-600">In Queue:</span> 
                <span className="text-gray-800 font-medium">{crawlStatus.queueSize}</span>
              </div>
              {crawlStatus.url && crawlStatus.currentAction !== "Idle" && crawlStatus.currentAction !== "Complete" && crawlStatus.currentAction !== "Starting..." && (
                 <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 truncate" title={crawlStatus.url}>
                        Current URL: {crawlStatus.url}
                    </p>
                 </div>
              )}
            </div>
          )}
          
          {extractedText && !isLoading && (
            <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <TextDisplay extractedText={extractedText} sourceUrl={sourceUrl} />
            </div>
          )}
        </div>
        
        {!extractedText && !isLoading && (
          <div className="text-center mt-16 md:mt-24">
            <div className="bg-white border border-gray-200 rounded-lg p-8 md:p-10 max-w-2xl mx-auto shadow-sm">
              <h3 className="text-xl md:text-2xl font-semibold text-gray-700 mb-6">
                How it works
              </h3>
              <div className="space-y-5 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-gray-800 text-white rounded-md flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    1
                  </div>
                  <p className="text-gray-600 text-sm md:text-base">
                    Paste any website URL in the input field above
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-gray-800 text-white rounded-md flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    2
                  </div>
                  <p className="text-gray-600 text-sm md:text-base">
                    Our crawler will visit all pages on the same domain and extract content
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-gray-800 text-white rounded-md flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    3
                  </div>
                  <p className="text-gray-600 text-sm md:text-base">
                    Get a single file with all the clean, readable text from the entire website
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="w-full max-w-4xl mx-auto mt-12 pt-8 pb-6 text-center text-gray-500 text-sm border-t border-gray-200">
        <p> 
           View the source code on{" "}
          <a
            href="https://github.com/hugomoran159/aircrawl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-gray-900 underline"
          >
            GitHub
          </a>
          .
        </p>
      </footer>
    </div>
  );
};

export default Index;
