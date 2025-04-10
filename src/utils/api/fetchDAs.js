/**
 * Utilities for fetching development application data
 */
import { track } from '@vercel/analytics/server';

/**
 * Fetches all development applications for a given council
 * @param {string} councilName - The name of the council to fetch DAs for
 * @param {Function} setLoadingProgress - Function to update loading progress state
 * @returns {Promise<Array>} Array of development applications
 */
export async function fetchAllDAs(councilName, setLoadingProgress) {
  const allDAs = [];
  let pageNumber = 1;
  const pageSize = 2000; // Increased page size for faster retrieval
  
  try {
    console.log(`Fetching DAs for council: ${councilName}`);
    
    // Track API request start
    await track('DA_Fetch_Started', {
      councilName,
      pageSize,
      timestamp: new Date().toISOString()
    });
    
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

    const requestBody = {
      url: 'https://api.apps1.nsw.gov.au/eplanning/data/v0/OnlineDA',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'PageSize': pageSize.toString(),
        'PageNumber': pageNumber.toString(),
        'filters': JSON.stringify({ filters: apiFilters })
      }
    };

    console.log('Sending API request to fetch DAs');
    
    try {
      const response = await fetch(`${API_BASE_URL}${process.env.NODE_ENV === 'development' ? '/api/proxy' : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Non-OK response from API:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 200) // Limit error text length to avoid console spam
        });
        
        // Track API error
        await track('DA_Fetch_Error', {
          councilName,
          errorStatus: response.status,
          errorType: 'API_Response_Error'
        });
        
        throw new Error(`API responded with ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received API response:', {
        totalRecords: data.TotalRecords || 0,
        totalPages: data.TotalPages || 0,
        applicationCount: data.Application?.length || 0
      });
      
      // Update loading progress with initial data
      setLoadingProgress({
        currentPage: 1,
        totalPages: data.TotalPages || 1,
        loadedDAs: data.Application?.length || 0,
        totalDAs: data.TotalRecords || 0
      });
      
      // Log a sample response to see the structure
      if (data?.Application?.length > 0) {
        console.log('Sample Development Application:', JSON.stringify(data.Application[0], null, 2));
        
        // Log some key properties for the first few applications
        const sampleCount = Math.min(3, data.Application.length);
        console.log(`Sample ${sampleCount} Development Applications:`, 
          data.Application.slice(0, sampleCount).map(app => ({
            address: app.Location?.[0]?.FullAddress,
            status: app.ApplicationStatus,
            cost: app.CostOfDevelopment,
            lodgementDate: app.LodgementDate,
            description: app.DevelopmentDescription,
            type: app.DevelopmentType?.[0]?.DevelopmentType || 'N/A',
            coords: app.Location?.[0] ? [app.Location[0].X, app.Location[0].Y] : null
          }))
        );
      }

      if (!data || !data.Application) {
        console.error('Invalid response format:', data);
        
        // Track format error
        await track('DA_Fetch_Error', {
          councilName,
          errorType: 'Invalid_Response_Format'
        });
        
        throw new Error('Invalid response format from DA API');
      }

      // Add all applications from this page
      allDAs.push(...data.Application);

      // Fetch all pages as requested (no cap)
      const maxPages = data.TotalPages || 1;
      
      if (maxPages > 1) {
        console.log(`Fetching ${maxPages - 1} additional pages...`);
        
        // Use sequential fetching instead of Promise.all to prevent rate limiting
        for (let page = 2; page <= maxPages; page++) {
          console.log(`Fetching page ${page}/${maxPages}...`);
          
          // Update current page in loading progress
          setLoadingProgress(prev => ({
            ...prev,
            currentPage: page
          }));
          
          try {
            const pageResponse = await fetch(`${API_BASE_URL}${process.env.NODE_ENV === 'development' ? '/api/proxy' : ''}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                url: 'https://api.apps1.nsw.gov.au/eplanning/data/v0/OnlineDA',
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'PageSize': pageSize.toString(),
                  'PageNumber': page.toString(),
                  'filters': JSON.stringify({ filters: apiFilters })
                }
              })
            });
            
            if (!pageResponse.ok) {
              console.warn(`Failed to fetch page ${page}, continuing with data we have`);
              
              // Track page fetch error
              await track('DA_Page_Fetch_Error', {
                councilName,
                pageNumber: page,
                errorStatus: pageResponse.status
              });
              
              continue;
            }
            
            const pageData = await pageResponse.json();
            
            if (pageData?.Application) {
              allDAs.push(...pageData.Application);
              console.log(`Added ${pageData.Application.length} applications from page ${page}`);
              
              // Update loading progress with new count
              setLoadingProgress(prev => ({
                ...prev,
                loadedDAs: allDAs.length
              }));
            }
            
            // Minimal delay between requests while still avoiding rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));
            
          } catch (pageError) {
            console.warn(`Error fetching page ${page}, skipping:`, pageError);
            
            // Track page fetch error
            await track('DA_Page_Fetch_Error', {
              councilName,
              pageNumber: page,
              errorMessage: pageError.message
            });
            
            // Continue with the data we have
          }
        }
      }
    } catch (fetchError) {
      console.error('Error during API fetch:', fetchError);
      
      // Track fetch error
      await track('DA_Fetch_Error', {
        councilName,
        errorMessage: fetchError.message,
        errorType: 'Fetch_Error'
      });
      
      throw fetchError;
    }

    // Track successful fetch completion
    await track('DA_Fetch_Completed', {
      councilName,
      recordCount: allDAs.length,
      pagesFetched: maxPages || 1
    });

    console.log(`Successfully fetched ${allDAs.length} DAs`);
    return allDAs;
  } catch (error) {
    console.error('Error fetching DAs:', error);
    
    // Track overall fetch error
    await track('DA_Fetch_Error', {
      councilName,
      errorMessage: error.message,
      errorType: 'Overall_Error'
    });
    
    throw error; // Re-throw so the UI can show error state
  }
}
