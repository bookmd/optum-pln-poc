import React, { useState, useCallback, useMemo } from 'react';
import {
  DrugInteractionIcon,
  PracticeUpdatesIcon,
  WhatsNewIcon,
  PatientEducationIcon,
  CalculatorsIcon
} from './icons/UpToDateIcons';
import SearchResults from './SearchResults';
import Header from './Header';
import { useVimOSEncounter } from '../hooks/useEncounter';

interface Suggestion {
  text: string;
  source: 'notes' | 'assessment';
}

interface SearchResult {
  title: string;
  excerpt: string;
  category?: string;
  patientType: 'adult' | 'pediatric' | 'both';
}

const LandingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { encounter } = useVimOSEncounter();

  // Extract search suggestions from encounter data
  const searchSuggestions = useMemo(() => {
    const suggestions: Suggestion[] = [];

    // Add chief complaint if available
    if (encounter?.subjective?.chiefComplaintNotes) {
      suggestions.push({
        text: encounter.subjective.chiefComplaintNotes,
        source: 'notes'
      });
    }

    // Add diagnoses from assessment if available
    if (encounter?.assessment?.diagnosisCodes) {
      encounter.assessment.diagnosisCodes.forEach(diagnosis => {
        if (diagnosis.description) {
          suggestions.push({
            text: diagnosis.description,
            source: 'assessment'
          });
        }
      });
    }

    // Remove duplicates and empty strings
    return suggestions.filter((suggestion, index, self) => 
      suggestion.text.trim() !== '' && 
      index === self.findIndex(s => s.text === suggestion.text)
    );
  }, [encounter]);

  // Mock search results for demonstration
  const mockResults: SearchResult[] = [
    {
      title: 'Evaluation and management of dental injuries in children',
      excerpt: '...primary dentition . Dental trauma to the permanent dentition in school-age children is more common in males than females . These figures underestimate the occurrence of dental trauma because minor trauma ...',
      patientType: 'pediatric'
    },
    {
      title: 'Initial evaluation and management of facial trauma in adults',
      excerpt: '...if the care of other injuries allows and there is no risk of aspiration if the tooth loosens. Dental trauma may occur with or without other facial injury . Trauma to the mouth of sufficient force can avulse ...',
      patientType: 'adult'
    },
    {
      title: 'Mandibular (jaw) fractures in children',
      excerpt: '... This topic will discuss the evaluation and treatment of jaw fractures in children. Dental trauma in children is discussed separately. The mandible is a U-shaped bone composed of the following paired ...',
      patientType: 'pediatric'
    },
    {
      title: 'Assessment and management of intra-oral lacerations',
      excerpt: '...clinician should also evaluate for the following associated injuries to the face, teeth, and jaw: Dental trauma – Indicated by loose, displaced, fractured or missing teeth Midface fracture – Findings include...',
      patientType: 'both'
    }
  ];

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsSearching(true);
    }
  }, [searchTerm]);

  const handleBack = useCallback(() => {
    console.log('Back handler called');
    setIsSearching(false);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchTerm(suggestion);
    setIsSearching(true);
  }, []);

  if (isSearching) {
    return (
      <SearchResults 
        searchTerm={searchTerm} 
        results={mockResults} 
        onBack={handleBack}
      />
    );
  }

  const menuItems = [
    {
      icon: <DrugInteractionIcon />,
      title: 'Drug Interactions',
      link: '/drug-interactions'
    },
    {
      icon: <PracticeUpdatesIcon />,
      title: 'Practice Changing Updates',
      link: '/practice-updates'
    },
    {
      icon: <WhatsNewIcon />,
      title: "What's New",
      link: '/whats-new'
    },
    {
      icon: <PatientEducationIcon />,
      title: 'Patient Education',
      link: '/patient-education'
    },
    {
      icon: <CalculatorsIcon />,
      title: 'Calculators',
      link: '/calculators'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearch}
        suggestions={searchSuggestions}
        onSuggestionClick={handleSuggestionClick}
      />

      {/* Menu Items - White Background */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center p-3 mb-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200 group border border-transparent hover:border-gray-200"
          >
            <div className="w-10 h-10 flex items-center justify-center mr-4 text-[#1B3A6F] group-hover:text-blue-700 transition-colors">
              {item.icon}
            </div>
            <span className="text-lg text-[#1B3A6F] group-hover:text-blue-700 transition-colors font-medium">
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingPage; 