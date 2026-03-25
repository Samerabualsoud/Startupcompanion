/**
 * Standardized Industry & Vertical List
 * Used across the entire platform for consistency
 */

export const INDUSTRIES = [
  // Technology & Software
  'SaaS',
  'Artificial Intelligence / Machine Learning',
  'Cybersecurity',
  'Cloud Computing',
  'Data Analytics',
  'Mobile Apps',
  'Web Development',
  'DevOps / Infrastructure',
  'Blockchain / Crypto',
  'IoT / Hardware',

  // E-Commerce & Retail
  'E-Commerce',
  'Marketplace',
  'Retail Tech',
  'Fashion / Apparel',
  'Luxury Goods',
  'Direct-to-Consumer (D2C)',
  'Subscription Commerce',

  // Financial Services
  'FinTech',
  'Payments',
  'Banking',
  'Insurance Tech',
  'Investment / Wealth Management',
  'Lending / Credit',
  'Trading Platforms',
  'Accounting / Bookkeeping',

  // Healthcare & Life Sciences
  'HealthTech',
  'Telemedicine',
  'Biotech',
  'Medical Devices',
  'Pharmaceuticals',
  'Fitness / Wellness',
  'Mental Health',
  'Diagnostics',

  // Education & Learning
  'EdTech',
  'Online Learning',
  'Professional Development',
  'Skill Training',
  'Corporate Training',
  'Language Learning',

  // Logistics & Supply Chain
  'Logistics / Supply Chain',
  'Last-Mile Delivery',
  'Warehouse Management',
  'Fleet Management',
  'Cold Chain',
  'Freight / Shipping',

  // Food & Beverage
  'Food Delivery',
  'Cloud Kitchens',
  'Restaurant Tech',
  'Beverage',
  'Food Manufacturing',
  'Agritech / Farming',
  'Food Waste Management',

  // Real Estate & Construction
  'Real Estate Tech',
  'Property Management',
  'Construction Tech',
  'Smart Buildings',
  'Architecture / Design',
  'Interior Design',

  // Travel & Hospitality
  'Travel Tech',
  'Booking Platforms',
  'Hospitality',
  'Tourism',
  'Events Management',
  'Accommodation',

  // Media & Entertainment
  'Media & Entertainment',
  'Streaming',
  'Gaming',
  'Social Media',
  'Content Creation',
  'Music / Audio',
  'Video Production',
  'Publishing',

  // Marketing & Advertising
  'Marketing Tech',
  'Advertising',
  'SEO / SEM',
  'Email Marketing',
  'Social Media Management',
  'Influencer Marketing',
  'Analytics',

  // Human Resources & Recruitment
  'HR Tech',
  'Recruitment',
  'Talent Management',
  'Payroll',
  'Employee Engagement',
  'Learning Management',

  // Manufacturing & Industrial
  'Manufacturing',
  'Industrial Tech',
  'Factory Automation',
  'Quality Control',
  'Maintenance / Repair',
  '3D Printing',

  // Energy & Utilities
  'Clean Energy',
  'Solar',
  'Wind Energy',
  'Energy Management',
  'Smart Grid',
  'Oil & Gas Tech',

  // Transportation & Mobility
  'Mobility',
  'Ride-Sharing',
  'Autonomous Vehicles',
  'Electric Vehicles',
  'Micro-Mobility',
  'Public Transport',

  // Environment & Sustainability
  'Climate Tech',
  'Sustainability',
  'Recycling',
  'Water Management',
  'Carbon Tracking',
  'Green Building',

  // Government & Public Services
  'GovTech',
  'Legal Tech',
  'Compliance',
  'Document Management',
  'Public Administration',

  // Telecommunications
  'Telecom',
  'Connectivity',
  'Network Infrastructure',
  '5G',
  'Satellite Communications',

  // Consumer Goods & Services
  'Consumer Goods',
  'Home Services',
  'Personal Care',
  'Pet Services',
  'Beauty & Cosmetics',
  'Cleaning Services',

  // B2B Services
  'B2B SaaS',
  'Enterprise Software',
  'Consulting',
  'Staffing / Recruitment',
  'Outsourcing',
  'Business Services',

  // Sports & Fitness
  'Sports Tech',
  'Fitness',
  'Sports Management',
  'Athlete Training',
  'Sports Analytics',

  // Specialized Industries
  'Luxury Tech',
  'Fashion Tech',
  'Legal Services',
  'Accounting Services',
  'Consulting Services',
  'Engineering Services',
  'Design Services',
  'Other',
] as const;

export type Industry = typeof INDUSTRIES[number];

/**
 * Get industry by exact match (case-insensitive)
 */
export function getIndustry(value: string): Industry | undefined {
  return INDUSTRIES.find(ind => ind.toLowerCase() === value.toLowerCase()) as Industry | undefined;
}

/**
 * Search industries by partial match
 */
export function searchIndustries(query: string): Industry[] {
  const lowerQuery = query.toLowerCase();
  return INDUSTRIES.filter(ind => ind.toLowerCase().includes(lowerQuery)) as Industry[];
}

/**
 * Get industry category (for grouping)
 */
export function getIndustryCategory(industry: Industry): string {
  const categoryMap: Record<Industry, string> = {
    // Technology & Software
    'SaaS': 'Technology & Software',
    'Artificial Intelligence / Machine Learning': 'Technology & Software',
    'Cybersecurity': 'Technology & Software',
    'Cloud Computing': 'Technology & Software',
    'Data Analytics': 'Technology & Software',
    'Mobile Apps': 'Technology & Software',
    'Web Development': 'Technology & Software',
    'DevOps / Infrastructure': 'Technology & Software',
    'Blockchain / Crypto': 'Technology & Software',
    'IoT / Hardware': 'Technology & Software',

    // E-Commerce & Retail
    'E-Commerce': 'E-Commerce & Retail',
    'Marketplace': 'E-Commerce & Retail',
    'Retail Tech': 'E-Commerce & Retail',
    'Fashion / Apparel': 'E-Commerce & Retail',
    'Luxury Goods': 'E-Commerce & Retail',
    'Direct-to-Consumer (D2C)': 'E-Commerce & Retail',
    'Subscription Commerce': 'E-Commerce & Retail',

    // Financial Services
    'FinTech': 'Financial Services',
    'Payments': 'Financial Services',
    'Banking': 'Financial Services',
    'Insurance Tech': 'Financial Services',
    'Investment / Wealth Management': 'Financial Services',
    'Lending / Credit': 'Financial Services',
    'Trading Platforms': 'Financial Services',
    'Accounting / Bookkeeping': 'Financial Services',

    // Healthcare & Life Sciences
    'HealthTech': 'Healthcare & Life Sciences',
    'Telemedicine': 'Healthcare & Life Sciences',
    'Biotech': 'Healthcare & Life Sciences',
    'Medical Devices': 'Healthcare & Life Sciences',
    'Pharmaceuticals': 'Healthcare & Life Sciences',
    'Fitness / Wellness': 'Healthcare & Life Sciences',
    'Mental Health': 'Healthcare & Life Sciences',
    'Diagnostics': 'Healthcare & Life Sciences',

    // Education & Learning
    'EdTech': 'Education & Learning',
    'Online Learning': 'Education & Learning',
    'Professional Development': 'Education & Learning',
    'Skill Training': 'Education & Learning',
    'Corporate Training': 'Education & Learning',
    'Language Learning': 'Education & Learning',

    // Logistics & Supply Chain
    'Logistics / Supply Chain': 'Logistics & Supply Chain',
    'Last-Mile Delivery': 'Logistics & Supply Chain',
    'Warehouse Management': 'Logistics & Supply Chain',
    'Fleet Management': 'Logistics & Supply Chain',
    'Cold Chain': 'Logistics & Supply Chain',
    'Freight / Shipping': 'Logistics & Supply Chain',

    // Food & Beverage
    'Food Delivery': 'Food & Beverage',
    'Cloud Kitchens': 'Food & Beverage',
    'Restaurant Tech': 'Food & Beverage',
    'Beverage': 'Food & Beverage',
    'Food Manufacturing': 'Food & Beverage',
    'Agritech / Farming': 'Food & Beverage',
    'Food Waste Management': 'Food & Beverage',

    // Real Estate & Construction
    'Real Estate Tech': 'Real Estate & Construction',
    'Property Management': 'Real Estate & Construction',
    'Construction Tech': 'Real Estate & Construction',
    'Smart Buildings': 'Real Estate & Construction',
    'Architecture / Design': 'Real Estate & Construction',
    'Interior Design': 'Real Estate & Construction',

    // Travel & Hospitality
    'Travel Tech': 'Travel & Hospitality',
    'Booking Platforms': 'Travel & Hospitality',
    'Hospitality': 'Travel & Hospitality',
    'Tourism': 'Travel & Hospitality',
    'Events Management': 'Travel & Hospitality',
    'Accommodation': 'Travel & Hospitality',

    // Media & Entertainment
    'Media & Entertainment': 'Media & Entertainment',
    'Streaming': 'Media & Entertainment',
    'Gaming': 'Media & Entertainment',
    'Social Media': 'Media & Entertainment',
    'Content Creation': 'Media & Entertainment',
    'Music / Audio': 'Media & Entertainment',
    'Video Production': 'Media & Entertainment',
    'Publishing': 'Media & Entertainment',

    // Marketing & Advertising
    'Marketing Tech': 'Marketing & Advertising',
    'Advertising': 'Marketing & Advertising',
    'SEO / SEM': 'Marketing & Advertising',
    'Email Marketing': 'Marketing & Advertising',
    'Social Media Management': 'Marketing & Advertising',
    'Influencer Marketing': 'Marketing & Advertising',
    'Analytics': 'Marketing & Advertising',

    // Human Resources & Recruitment
    'HR Tech': 'Human Resources & Recruitment',
    'Recruitment': 'Human Resources & Recruitment',
    'Talent Management': 'Human Resources & Recruitment',
    'Payroll': 'Human Resources & Recruitment',
    'Employee Engagement': 'Human Resources & Recruitment',
    'Learning Management': 'Human Resources & Recruitment',

    // Manufacturing & Industrial
    'Manufacturing': 'Manufacturing & Industrial',
    'Industrial Tech': 'Manufacturing & Industrial',
    'Factory Automation': 'Manufacturing & Industrial',
    'Quality Control': 'Manufacturing & Industrial',
    'Maintenance / Repair': 'Manufacturing & Industrial',
    '3D Printing': 'Manufacturing & Industrial',

    // Energy & Utilities
    'Clean Energy': 'Energy & Utilities',
    'Solar': 'Energy & Utilities',
    'Wind Energy': 'Energy & Utilities',
    'Energy Management': 'Energy & Utilities',
    'Smart Grid': 'Energy & Utilities',
    'Oil & Gas Tech': 'Energy & Utilities',

    // Transportation & Mobility
    'Mobility': 'Transportation & Mobility',
    'Ride-Sharing': 'Transportation & Mobility',
    'Autonomous Vehicles': 'Transportation & Mobility',
    'Electric Vehicles': 'Transportation & Mobility',
    'Micro-Mobility': 'Transportation & Mobility',
    'Public Transport': 'Transportation & Mobility',

    // Environment & Sustainability
    'Climate Tech': 'Environment & Sustainability',
    'Sustainability': 'Environment & Sustainability',
    'Recycling': 'Environment & Sustainability',
    'Water Management': 'Environment & Sustainability',
    'Carbon Tracking': 'Environment & Sustainability',
    'Green Building': 'Environment & Sustainability',

    // Government & Public Services
    'GovTech': 'Government & Public Services',
    'Legal Tech': 'Government & Public Services',
    'Compliance': 'Government & Public Services',
    'Document Management': 'Government & Public Services',
    'Public Administration': 'Government & Public Services',

    // Telecommunications
    'Telecom': 'Telecommunications',
    'Connectivity': 'Telecommunications',
    'Network Infrastructure': 'Telecommunications',
    '5G': 'Telecommunications',
    'Satellite Communications': 'Telecommunications',

    // Consumer Goods & Services
    'Consumer Goods': 'Consumer Goods & Services',
    'Home Services': 'Consumer Goods & Services',
    'Personal Care': 'Consumer Goods & Services',
    'Pet Services': 'Consumer Goods & Services',
    'Beauty & Cosmetics': 'Consumer Goods & Services',
    'Cleaning Services': 'Consumer Goods & Services',

    // B2B Services
    'B2B SaaS': 'B2B Services',
    'Enterprise Software': 'B2B Services',
    'Consulting': 'B2B Services',
    'Staffing / Recruitment': 'B2B Services',
    'Outsourcing': 'B2B Services',
    'Business Services': 'B2B Services',

    // Sports & Fitness
    'Sports Tech': 'Sports & Fitness',
    'Fitness': 'Sports & Fitness',
    'Sports Management': 'Sports & Fitness',
    'Athlete Training': 'Sports & Fitness',
    'Sports Analytics': 'Sports & Fitness',

    // Specialized Industries
    'Luxury Tech': 'Specialized Industries',
    'Fashion Tech': 'Specialized Industries',
    'Legal Services': 'Specialized Industries',
    'Accounting Services': 'Specialized Industries',
    'Consulting Services': 'Specialized Industries',
    'Engineering Services': 'Specialized Industries',
    'Design Services': 'Specialized Industries',
    'Other': 'Specialized Industries',
  };

  return categoryMap[industry] || 'Other';
}
