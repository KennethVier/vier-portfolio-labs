import { useEffect, useMemo, useState } from 'react';

export const usePagination = (items, itemsPerPage, resetKey = '') => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  }, [currentPage, items, itemsPerPage]);

  return { currentItems, currentPage, setCurrentPage, totalPages };
};