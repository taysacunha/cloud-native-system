import { useState, useMemo } from "react";
import { normalizeText } from "@/lib/textUtils";

interface UseTableControlsOptions<T> {
  data: T[];
  searchField: keyof T | (keyof T)[];
  defaultItemsPerPage?: number;
}

interface UseTableControlsReturn<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  sortField: keyof T | null;
  sortDirection: "asc" | "desc";
  setSorting: (field: keyof T) => void;
  filteredData: T[];
  paginatedData: T[];
  totalPages: number;
}

export function useTableControls<T extends Record<string, any>>({
  data,
  searchField,
  defaultItemsPerPage = 20,
}: UseTableControlsOptions<T>): UseTableControlsReturn<T> {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const setSorting = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    // Filter by search
    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm);
      const fields = Array.isArray(searchField) ? searchField : [searchField];
      
      result = result.filter((item) => {
        return fields.some((field) => {
          const value = item[field];
          if (typeof value === "string") {
            return normalizeText(value).includes(normalizedSearch);
          }
          return false;
        });
      });
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, searchField, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Reset to page 1 when search changes
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  };

  return {
    searchTerm,
    setSearchTerm: handleSearchChange,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage: handleItemsPerPageChange,
    sortField,
    sortDirection,
    setSorting,
    filteredData,
    paginatedData,
    totalPages,
  };
}
