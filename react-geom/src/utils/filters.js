export const filterConfig = {
  world: {
    map: ['measure', 'perspective', 'approach', 'variable'],
    table: ['measure', 'approach', 'year', 'region'],
    chart: ['measure', 'perspective', 'approach', 'variable', 'countries'],
  },
  country: {
    ante: ['country', 'year', 'anteFormat'],
    post: ['country', 'year', 'postFormat'],
    pdp: ['country', 'year'],
    alluvial: ['country', 'year'],
    descriptive: ['country', 'year'],
    countryTable: ['country', 'year'],
  },
};

export const getFilterLabel = (filterKey) => {
  if (filterKey === 'anteFormat' || filterKey === 'postFormat') {
    return 'Format';
  }
  return filterKey.charAt(0).toUpperCase() + filterKey.slice(1);
};
