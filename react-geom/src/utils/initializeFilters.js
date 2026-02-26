const worldDefaultFilters = {
  measure: 'Gini',
  perspective: 'Ex-Ante Random Forest',
  approach: 'Absolute',
  variable: 'Both',
  region: 'Africa',
  countries: ['PER'],
};

const countryDefaultFilters = {
  country: 'ARG',
  year: '2014',
  anteFormat: 'chart',
  postFormat: 'chart',
};

export const initializeFilters = () => ({
  ...worldDefaultFilters,
  ...countryDefaultFilters,
});

export const initializeFilterOptions = () => {
  return {
    measure: [
      { value: 'Gini', label: 'Gini' },
      { value: 'MLD', label: 'MLD' },
    ],
    perspective: [
      { value: 'Ex-Ante Random Forest', label: 'Ex-Ante (Random Forest)' },
      { value: 'Ex-Post Tree', label: 'Ex-Post (Tree)' },
    ],
    approach: [
      { value: 'Absolute', label: 'Absolute' },
      { value: 'Relative', label: 'Relative' },
    ],
    variable: [
      { value: 'Income', label: 'Income' },
      { value: 'Consumption', label: 'Consumption' },
      { value: 'Both', label: 'Both' },
    ],
    year: [],
    region: [
      { value: 'Africa', label: 'Africa' },
      { value: 'Asia + Oceania', label: 'Asia + Oceania' },
      { value: 'Europe', label: 'Europe' },
      { value: 'LATAM', label: 'LATAM' },
      { value: 'North America', label: 'North America' },
    ],
    anteFormat: [
      { value: 'chart', label: 'Graph' },
      { value: 'pdf', label: 'PDF' },
      { value: 'decomposition', label: 'Decomposition' },
      { value: 'pdp', label: 'Partial Dependence Plot' },
    ],
    postFormat: [
      { value: 'chart', label: 'Graph' },
      { value: 'pdf', label: 'PDF' },
      { value: 'types', label: 'Type Distribution' },
      { value: 'decomposition', label: 'Decomposition' },
    ],
    countries: [],
    country: [],
  };
};
