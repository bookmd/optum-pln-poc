import { useEffect } from "react";

export const LaunchHandler = () => {
  useEffect(() => {
    // Get the current URL search params (launch_id, vim_organization_id, etc.)
    const currentParams = new URLSearchParams(window.location.search);
    
    // Redirect to the API launch endpoint with the same parameters
    const apiUrl = `/api/launch?${currentParams.toString()}`;
    window.location.href = apiUrl;
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Launching application...</p>
      </div>
    </div>
  );
}; 