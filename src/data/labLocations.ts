export interface LabLocation {
  id: string;
  provider: 'Quest' | 'LabCorp';
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  nextAvailable: string;
  estimatedCost: string;
  distance: string;
}

export const labLocations: LabLocation[] = [
  {
    id: '1',
    provider: 'Quest',
    name: 'Quest Diagnostics',
    address: '424 E 12300 S',
    city: 'Draper',
    state: 'UT',
    zip: '84020',
    phone: '(801) 631-5470',
    nextAvailable: 'Tomorrow at 8:45 AM',
    estimatedCost: '$40-60',
    distance: '6.6 miles'
  },
  {
    id: '2',
    provider: 'Quest',
    name: 'Quest Diagnostics',
    address: '348 E 4500 S, Suite 210',
    city: 'Murray',
    state: 'UT',
    zip: '84107',
    phone: '(801) 573-2740',
    nextAvailable: 'Tomorrow at 11:45 AM',
    estimatedCost: '$40-60',
    distance: '6.9 miles'
  },
  {
    id: '3',
    provider: 'LabCorp',
    name: 'LabCorp',
    address: '74 E Kimballs Ln, Suite 250',
    city: 'Draper',
    state: 'UT',
    zip: '84020',
    phone: '(801) 523-5044',
    nextAvailable: 'Tomorrow at 10:30 AM',
    estimatedCost: '$45-65',
    distance: '7 miles'
  },
  {
    id: '4',
    provider: 'LabCorp',
    name: 'Labcorp',
    address: '12176 S 1000 E',
    city: 'Draper',
    state: 'UT',
    zip: '84020',
    phone: '(801) 495-9514',
    nextAvailable: 'Today at 2:15 PM',
    estimatedCost: '$55-75',
    distance: '8 miles'
  },
  {
    id: '5',
    provider: 'Quest',
    name: 'Quest Diagnostics',
    address: '1250 E 3900 S, Bldg B Suite 50A',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '84124',
    phone: '(801) 264-9675',
    nextAvailable: 'Tomorrow at 8:45 AM',
    estimatedCost: '$40-60',
    distance: '9 miles'
  }
]; 