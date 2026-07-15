import { useState } from 'react';

export const usePagination = (defaultLimit = 10) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);

  const reset = () => {
    setPage(1);
  };

  return {
    page,
    limit,
    setPage,
    setLimit,
    reset,
  };
};
