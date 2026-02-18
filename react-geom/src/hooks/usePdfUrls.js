import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

const CATEGORIES = {
  ante: 'ex-ante',
  post: 'ex-post',
  types: 'types',
  alluvial: 'alluvial',
  descriptive: 'descriptive',
};

const usePdfUrls = (filters, countryData) => {
  const [pdfs, setPdfs] = useState({});

  useEffect(() => {
    if (filters.country && filters.year && countryData) {
      const urls = Object.keys(CATEGORIES).reduce((acc, key) => {
        acc[key] = `${API_URL}/api/files/pdf?category=${CATEGORIES[key]}&country=${filters.country}&year=${filters.year}`;
        return acc;
      }, {});

      setPdfs(urls);
    }
  }, [filters.country, filters.year, countryData]);

  return pdfs;
};

export default usePdfUrls;
