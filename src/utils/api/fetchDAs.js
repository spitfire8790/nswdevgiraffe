/**
 * Utilities for fetching development application data
 */

/**
 * Fetches a single page of development applications with improved error handling
 * @param {string} API_BASE_URL - The base URL for the API
 * @param {number} page - The page number to fetch
 * @param {number} pageSize - The number of records per page
 * @param {object} apiFilters - The filters to apply to the API request
 * @returns {Promise<object|null>} - The response data or null if there was an error
 */
async function fetchPage(API_BASE_URL, page, pageSize, apiFilters) {
  const requestBody = {
    url: 'https://api.apps1.nsw.gov.au/eplanning/data/v0/OnlineDA',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'PageSize': pageSize.toString(),
      'PageNumber': page.toString(),
      'filters': JSON.stringify({ filters: apiFilters })
    }
  };

  // Set up abort controller with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second client-side timeout

  try {
    console.log(`Starting request for page ${page} with pageSize ${pageSize}`);
    
    const response = await fetch(`${API_BASE_URL}${process.env.NODE_ENV === 'development' ? '/api/proxy' : ''}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Failed to fetch page ${page}, status: ${response.status}`, 
        errorText.substring(0, 200)); // Limit error text
      return null;
    }

    // For browsers with ReadableStream support, process as stream
    if (typeof ReadableStream !== 'undefined' && response.body instanceof ReadableStream) {
      try {
        const reader = response.body.getReader();
        let chunks = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        // Combine chunks and parse JSON
        const allChunks = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let position = 0;
        for (const chunk of chunks) {
          allChunks.set(chunk, position);
          position += chunk.length;
        }
        
        const jsonText = new TextDecoder().decode(allChunks);
        return JSON.parse(jsonText);
      } catch (streamError) {
        console.warn(`Error processing stream for page ${page}:`, streamError);
        return null;
      }
    } else {
      // Fallback for browsers without ReadableStream support
      try {
        return await response.json();
      } catch (jsonError) {
        console.warn(`Error parsing JSON for page ${page}:`, jsonError);
        return null;
      }
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn(`Request timeout for page ${page} after 30 seconds`);
    } else {
      console.warn(`Error fetching page ${page}:`, error);
    }
    return null;
  }
}

/**
 * Fetches all development applications for a given council
 * @param {string} councilName - The name of the council to fetch DAs for
 * @param {Function} setLoadingProgress - Function to update loading progress state
 * @returns {Promise<Array>} Array of development applications
 */
export async function fetchAllDAs(councilName, setLoadingProgress) {
  const allDAs = [];
  let pageNumber = 1;
  // Reduced page size to prevent timeouts
  const pageSize = 500; // Reduced from 2000 to improve reliability
  let retryCount = 0;
  const maxRetries = 3;
  
  try {
    console.log(`Fetching DAs for council: ${councilName}`);
    
    const API_BASE_URL = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : 'https://proxy-server.jameswilliamstrutt.workers.dev';

    // Format the filters object according to the API requirements
    const apiFilters = {
      CouncilName: [councilName],
      // Removed CostOfDevelopmentFrom filter as requested
      LodgementDateFrom: '2020-01-01' // Fixed date as requested
    };

    console.log('Using API filters:', apiFilters);

    // Fetch first page using our new fetchPage function
    const firstPageData = await fetchPage(API_BASE_URL, pageNumber, pageSize, apiFilters);
    
    if (!firstPageData) {
      throw new Error('Failed to fetch initial page of development applications');
    }
    
    console.log('Received API response:', {
      totalRecords: firstPageData.TotalRecords || 0,
      totalPages: firstPageData.TotalPages || 0,
      applicationCount: firstPageData.Application?.length || 0
    });
    
    // Update loading progress with initial data
    setLoadingProgress({
      currentPage: 1,
      totalPages: firstPageData.TotalPages || 1,
      loadedDAs: firstPageData.Application?.length || 0,
      totalDAs: firstPageData.TotalRecords || 0
    });
    
    if (!firstPageData.Application) {
      console.error('Invalid response format:', firstPageData);
      throw new Error('Invalid response format from DA API');
    }

    // Add all applications from the first page
    allDAs.push(...firstPageData.Application);

    // Fetch all pages
    const maxPages = firstPageData.TotalPages || 1;
    
    if (maxPages > 1) {
      console.log(`Fetching ${maxPages - 1} additional pages...`);
      
      // Use sequential fetching with improved retry logic
      for (let page = 2; page <= maxPages; page++) {
        let pageData = null;
        retryCount = 0;
        
        // Try up to maxRetries times with exponential backoff
        while (!pageData && retryCount < maxRetries) {
          console.log(`Fetching page ${page}/${maxPages}${retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''}...`);
          
          // Update current page in loading progress
          setLoadingProgress(prev => ({
            ...prev,
            currentPage: page
          }));
          
          pageData = await fetchPage(API_BASE_URL, page, pageSize, apiFilters);
          
          if (!pageData && retryCount < maxRetries - 1) {
            // Calculate backoff delay: 1s, 2s, 4s, etc.
            const backoffDelay = Math.pow(2, retryCount) * 1000;
            console.log(`Retrying page ${page} after ${backoffDelay}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            retryCount++;
          } else if (!pageData) {
            console.warn(`Failed to fetch page ${page} after ${maxRetries} attempts, continuing with data we have`);
            break;
          }
        }
        
        if (pageData?.Application) {
          allDAs.push(...pageData.Application);
          console.log(`Added ${pageData.Application.length} applications from page ${page}`);
          
          // Update loading progress with new count
          setLoadingProgress(prev => ({
            ...prev,
            loadedDAs: allDAs.length
          }));
        }
        
        // Increased delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Successfully fetched ${allDAs.length} DAs`);
    // Add this log to show the first DA object as a sample
    if (allDAs.length > 0) {
      console.log('Sample DA object:', allDAs[0]);
    }
    return allDAs;
  } catch (error) {
    console.error('Error fetching DAs:', error);
    throw error; // Re-throw so the UI can show error state
  }
}
