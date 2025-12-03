import React, { useState } from 'react';
import { useVimOSPatient } from '../hooks/usePatient';
import { calculateAge } from '../utils/ageUtils';

interface SearchResult {
  title: string;
  excerpt: string;
  category?: string;
  patientType: 'adult' | 'pediatric' | 'both';
}

interface SearchResultsProps {
  searchTerm: string;
  results: SearchResult[];
  onBack: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ searchTerm, results, onBack }) => {
  const categories = ['All', 'Adult', 'Pediatric', 'Patient', 'Graphics'];
  const { patient } = useVimOSPatient();
  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (!patient?.demographics?.dateOfBirth) return 0; // Default to 'All' if no DOB
    const age = calculateAge(patient.demographics.dateOfBirth);
    return age >= 18 ? 1 : 2; // 1 for 'Adult', 2 for 'Pediatric'
  });
  
  // Filter results based on selected category
  const filteredResults = results.filter(result => {
    if (selectedCategory === 0) return true; // Show all for 'All' category
    if (selectedCategory === 1) return result.patientType === 'adult' || result.patientType === 'both'; // Adult
    if (selectedCategory === 2) return result.patientType === 'pediatric' || result.patientType === 'both'; // Pediatric
    return true; // Show all for other categories
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-br from-[#0B1B35] via-[#1B3A6F] to-[#0B1B35] py-6 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 flex items-center">
          <button
            type="button"
            onClick={() => {
              console.log('Back button clicked');
              onBack();
            }}
            className="text-white hover:text-blue-200 transition-colors mr-6 p-2 cursor-pointer rounded-full hover:bg-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-4xl font-bold tracking-wider text-white">
            UpToDate<sup className="text-sm">®</sup>
          </h1>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="max-w-6xl mx-auto">
          <nav className="flex space-x-8 px-4">
            {categories.map((category, index) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(index)}
                className={`px-6 py-4 text-gray-700 hover:text-blue-700 relative flex items-center font-medium transition-colors ${
                  index === selectedCategory ? 'text-blue-700' : ''
                }`}
              >
                {category}
                {index === selectedCategory && patient?.demographics?.dateOfBirth && (
                  <>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-700 rounded-t-full" />
                    <div className="ml-2 group relative">
                      <svg 
                        className="w-4 h-4" 
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M8 2L6 6L2 8L6 10L8 14L10 10L14 8L10 6L8 2Z"
                          fill="#A855F7"
                        />
                      </svg>
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                        Auto-selected based on patient age ({calculateAge(patient.demographics.dateOfBirth)} years)
                      </div>
                    </div>
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl text-gray-700 flex items-center gap-2">
            <span className="font-medium">Search results for:</span>
            <span className="text-blue-700">{searchTerm}</span>
            {patient?.demographics?.dateOfBirth && (
              <span className="text-gray-500 text-base">
                • Patient age: {calculateAge(patient.demographics.dateOfBirth)} years
              </span>
            )}
          </h2>
        </div>

        <div className="space-y-6">
          {filteredResults.length > 0 ? (
            filteredResults.map((result, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-medium text-blue-700 hover:text-blue-800 cursor-pointer">
                    {result.title}
                  </h3>
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${result.patientType === 'adult' ? 'bg-blue-50 text-blue-700' : 
                      result.patientType === 'pediatric' ? 'bg-green-50 text-green-700' :
                      'bg-gray-50 text-gray-700'}
                  `}>
                    {result.patientType === 'both' ? 'All Ages' : 
                     result.patientType === 'adult' ? 'Adult' : 'Pediatric'}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {result.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <button className="text-blue-700 hover:text-blue-800 font-medium text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Read more
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <div className="text-gray-400 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No results found
              </h3>
              <p className="text-gray-500">
                Try switching to a different category or modifying your search terms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults; 