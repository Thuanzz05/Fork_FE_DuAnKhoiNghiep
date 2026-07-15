import { useEffect, useMemo, useState } from 'react'

export function usePagination<T>(items: T[], pageSize: number, resetKey = '') {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    setCurrentPage(1)
  }, [resetKey])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const pageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return items.slice(startIndex, startIndex + pageSize)
  }, [currentPage, items, pageSize])

  return { currentPage, totalPages, pageItems, setCurrentPage }
}
