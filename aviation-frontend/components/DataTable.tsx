import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Column {
  key: string;
  title: string;
  width?: number;
  sortable?: boolean;
  render?: (value: any, row: any, index: number) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
}

export default function DataTable({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection
}: DataTableProps) {
  const { colors } = useTheme();

  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    topControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 12,
      alignItems: 'center',
      gap: 10,
    },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: 10,
      height: 40,
      color: colors.text,
    },
    itemsPerPageSelector: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    perPageButton: {
      padding: 6,
      marginHorizontal: 4,
      backgroundColor: colors.surface,
      borderRadius: 4,
    },
    perPageText: {
      color: colors.text,
    },
    headerRow: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerCell: {
      paddingHorizontal: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    sortButton: {
      marginLeft: 4,
    },
    row: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cell: {
      paddingHorizontal: 12,
      paddingVertical: 16,
      justifyContent: 'center',
    },
    cellContent: {
      flex: 1,
    },
    cellText: {
      fontSize: 14,
      color: colors.text,
    },
    evenRow: {
      backgroundColor: colors.surface + '40',
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 10,
    },
    pageButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.surface,
      borderRadius: 4,
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
  });

  const handleSort = (key: string) => {
    if (!onSort) return;
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) return null;
    return sortDirection === 'asc'
      ? <ChevronUp size={16} color={colors.primary} />
      : <ChevronDown size={16} color={colors.primary} />;
  };

  // 🔎 Filter and paginate data
  const filteredData = useMemo(() => {
    return data.filter((row) =>
      Object.values(row).some((val) =>
        val?.toString().toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [data, searchText]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔍 Search & Per Page Controls */}
      <View style={styles.topControls}>
        <TextInput
          placeholder="Search..."
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />

        <View style={styles.itemsPerPageSelector}>
          {[5, 10, 20].map((num) => (
            <TouchableOpacity key={num} onPress={() => handleItemsPerPageChange(num)} style={styles.perPageButton}>
              <Text style={styles.perPageText}>{num}/page</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 🧾 Table Header */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.headerRow}>
            {/* S/N Column */}
            <View style={[styles.headerCell, { width: 60 }]}>
              <Text style={styles.headerText}>S/N</Text>
            </View>

            {/* Other Columns */}
            {columns.map((column) => (
              <View
                key={column.key}
                style={[styles.headerCell, { width: column.width || 120 }]}
              >
                {column.sortable ? (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => handleSort(column.key)}
                  >
                    <Text style={styles.headerText}>{column.title}</Text>
                    <View style={styles.sortButton}>
                      {renderSortIcon(column.key)}
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.headerText}>{column.title}</Text>
                )}
              </View>
            ))}
          </View>

          {/* 🧾 Table Body */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {paginatedData.map((row, rowIndex) => {
              const serialNo = (currentPage - 1) * itemsPerPage + rowIndex + 1;

              return (
                <View
                  key={rowIndex}
                  style={[
                    styles.row,
                    rowIndex % 2 === 1 && styles.evenRow
                  ]}
                >
                  {/* Serial Number */}
                  <View style={[styles.cell, { width: 60 }]}>
                    <View style={styles.cellContent}>
                      <Text style={styles.cellText}>{serialNo}</Text>
                    </View>
                  </View>

                  {/* Row Data */}
                  {columns.map((column) => (
                    <View
                      key={column.key}
                      style={[styles.cell, { width: column.width || 120 }]}
                    >
                      <View style={styles.cellContent}>
                        {column.render ? (
                          column.render(row[column.key], row, serialNo)
                        ) : (
                          <Text style={styles.cellText}>
                            {row[column.key]?.toString() || '-'}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {/* 🔄 Pagination */}
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={styles.pageButton}
        >
          <ChevronLeft size={18} color={colors.text} />
        </TouchableOpacity>

        <Text style={{ color: colors.text }}>
          Page {currentPage} of {totalPages}
        </Text>

        <TouchableOpacity
          onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          style={styles.pageButton}
        >
          <ChevronRight size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}





// import React, { useState, useMemo } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   Modal,
//   FlatList,
//   ActivityIndicator,
//   Dimensions,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// const { width: screenWidth } = Dimensions.get('window');

// export interface Column<T> {
//   key: keyof T;
//   title: string;
//   sortable?: boolean;
//   filterable?: boolean;
//   width?: number;
//   render?: (value: any, row: T) => React.ReactNode;
// }

// interface MobileDataTableProps<T> {
//   data: T[];
//   columns: Column<T>[];
//   loading?: boolean;
//   onRefresh?: () => void;
//   searchPlaceholder?: string;
//   emptyMessage?: string;
//   itemsPerPageOptions?: number[];
//   defaultItemsPerPage?: number;
//   colors?: {
//     primary: string;
//     background: string;
//     surface: string;
//     text: string;
//     textSecondary: string;
//     border: string;
//     success: string;
//     warning: string;
//     error: string;
//   };
// }

// export function MobileDataTable<T extends Record<string, any>>({
//   data,
//   columns,
//   loading = false,
//   onRefresh,
//   searchPlaceholder = "Search...",
//   emptyMessage = "No data found",
//   itemsPerPageOptions = [5, 10, 20, 50],
//   defaultItemsPerPage = 10,
//   colors = {
//     primary: '#007AFF',
//     background: '#F2F2F7',
//     surface: '#FFFFFF',
//     text: '#000000',
//     textSecondary: '#8E8E93',
//     border: '#C6C6C8',
//     success: '#34C759',
//     warning: '#FF9500',
//     error: '#FF3B30',
//   }
// }: MobileDataTableProps<T>) {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [sortKey, setSortKey] = useState<keyof T | null>(null);
//   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
//   const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
//   const [showFilters, setShowFilters] = useState(false);
//   const [showItemsPerPageModal, setShowItemsPerPageModal] = useState(false);

//   // Filter and search data
//   const filteredData = useMemo(() => {
//     let filtered = data;

//     // Apply search
//     if (searchTerm) {
//       filtered = filtered.filter(row =>
//         Object.values(row).some(value =>
//           String(value).toLowerCase().includes(searchTerm.toLowerCase())
//         )
//       );
//     }

//     // Apply column filters
//     Object.entries(columnFilters).forEach(([columnKey, filterValue]) => {
//       if (filterValue) {
//         filtered = filtered.filter(row =>
//           String(row[columnKey]).toLowerCase().includes(filterValue.toLowerCase())
//         );
//       }
//     });

//     // Apply sorting
//     if (sortKey) {
//       filtered = [...filtered].sort((a, b) => {
//         const aValue = a[sortKey];
//         const bValue = b[sortKey];
        
//         if (aValue === bValue) return 0;
        
//         const comparison = aValue < bValue ? -1 : 1;
//         return sortDirection === 'asc' ? comparison : -comparison;
//       });
//     }

//     return filtered;
//   }, [data, searchTerm, columnFilters, sortKey, sortDirection]);

//   // Pagination
//   const totalPages = Math.ceil(filteredData.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

//   const handleSort = (key: keyof T) => {
//     if (sortKey === key) {
//       setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
//     } else {
//       setSortKey(key);
//       setSortDirection('asc');
//     }
//   };

//   const handlePageChange = (page: number) => {
//     setCurrentPage(page);
//   };

//   const handleItemsPerPageChange = (newItemsPerPage: number) => {
//     setItemsPerPage(newItemsPerPage);
//     setCurrentPage(1);
//     setShowItemsPerPageModal(false);
//   };

//   const handleFilterChange = (columnKey: string, value: string) => {
//     setColumnFilters(prev => ({ ...prev, [columnKey]: value }));
//     setCurrentPage(1);
//   };

//   const clearFilters = () => {
//     setColumnFilters({});
//     setSearchTerm('');
//     setCurrentPage(1);
//   };

//   const hasActiveFilters = searchTerm || Object.values(columnFilters).some(Boolean);

//   const styles = StyleSheet.create({
//     container: {
//       backgroundColor: colors.surface,
//       borderRadius: 12,
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.1,
//       shadowRadius: 8,
//       elevation: 4,
//       margin: 16,
//     },
//     header: {
//       backgroundColor: colors.primary,
//       borderTopLeftRadius: 12,
//       borderTopRightRadius: 12,
//       padding: 16,
//     },
//     searchContainer: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       backgroundColor: 'rgba(255,255,255,0.2)',
//       borderRadius: 8,
//       paddingHorizontal: 12,
//       marginBottom: 12,
//     },
//     searchInput: {
//       flex: 1,
//       color: '#FFFFFF',
//       fontSize: 16,
//       paddingVertical: 12,
//       paddingLeft: 8,
//     },
//     controlsRow: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//     },
//     filterButton: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       backgroundColor: showFilters ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
//       paddingHorizontal: 12,
//       paddingVertical: 8,
//       borderRadius: 6,
//     },
//     filterButtonText: {
//       color: '#FFFFFF',
//       marginLeft: 4,
//       fontSize: 14,
//       fontWeight: '600',
//     },
//     refreshButton: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       backgroundColor: 'rgba(255,255,255,0.2)',
//       paddingHorizontal: 12,
//       paddingVertical: 8,
//       borderRadius: 6,
//     },
//     refreshButtonText: {
//       color: '#FFFFFF',
//       marginLeft: 4,
//       fontSize: 14,
//       fontWeight: '600',
//     },
//     clearButton: {
//       paddingHorizontal: 8,
//       paddingVertical: 4,
//     },
//     clearButtonText: {
//       color: '#FFFFFF',
//       fontSize: 12,
//     },
//     filtersContainer: {
//       backgroundColor: colors.background,
//       padding: 16,
//       borderBottomWidth: 1,
//       borderBottomColor: colors.border,
//     },
//     filterRow: {
//       marginBottom: 12,
//     },
//     filterLabel: {
//       fontSize: 14,
//       fontWeight: '600',
//       color: colors.text,
//       marginBottom: 4,
//     },
//     filterInput: {
//       backgroundColor: colors.surface,
//       borderWidth: 1,
//       borderColor: colors.border,
//       borderRadius: 8,
//       paddingHorizontal: 12,
//       paddingVertical: 10,
//       fontSize: 14,
//       color: colors.text,
//     },
//     tableHeader: {
//       flexDirection: 'row',
//       backgroundColor: colors.background,
//       paddingVertical: 12,
//       paddingHorizontal: 16,
//       borderBottomWidth: 1,
//       borderBottomColor: colors.border,
//     },
//     headerCell: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'space-between',
//     },
//     headerText: {
//       fontSize: 14,
//       fontWeight: '700',
//       color: colors.text,
//       textTransform: 'uppercase',
//     },
//     tableBody: {
//       maxHeight: 400,
//     },
//     row: {
//       flexDirection: 'row',
//       paddingVertical: 12,
//       paddingHorizontal: 16,
//       borderBottomWidth: 1,
//       borderBottomColor: colors.border,
//       backgroundColor: colors.surface,
//     },
//     cell: {
//       justifyContent: 'center',
//     },
//     cellText: {
//       fontSize: 14,
//       color: colors.text,
//     },
//     loadingContainer: {
//       paddingVertical: 40,
//       alignItems: 'center',
//     },
//     loadingText: {
//       marginTop: 8,
//       fontSize: 14,
//       color: colors.textSecondary,
//     },
//     emptyContainer: {
//       paddingVertical: 40,
//       alignItems: 'center',
//     },
//     emptyText: {
//       fontSize: 16,
//       color: colors.textSecondary,
//       textAlign: 'center',
//       marginBottom: 8,
//     },
//     emptySubtext: {
//       fontSize: 14,
//       color: colors.textSecondary,
//       textAlign: 'center',
//     },
//     pagination: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       padding: 16,
//       backgroundColor: colors.background,
//       borderBottomLeftRadius: 12,
//       borderBottomRightRadius: 12,
//     },
//     paginationInfo: {
//       fontSize: 12,
//       color: colors.textSecondary,
//     },
//     paginationControls: {
//       flexDirection: 'row',
//       alignItems: 'center',
//     },
//     pageButton: {
//       paddingHorizontal: 12,
//       paddingVertical: 8,
//       marginHorizontal: 2,
//       borderRadius: 6,
//       backgroundColor: colors.surface,
//       borderWidth: 1,
//       borderColor: colors.border,
//     },
//     activePageButton: {
//       backgroundColor: colors.primary,
//       borderColor: colors.primary,
//     },
//     pageButtonText: {
//       fontSize: 14,
//       color: colors.text,
//       fontWeight: '600',
//     },
//     activePageButtonText: {
//       color: '#FFFFFF',
//     },
//     itemsPerPageButton: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       paddingHorizontal: 8,
//       paddingVertical: 4,
//       borderRadius: 4,
//       backgroundColor: colors.surface,
//       borderWidth: 1,
//       borderColor: colors.border,
//       marginLeft: 8,
//     },
//     itemsPerPageText: {
//       fontSize: 12,
//       color: colors.text,
//       marginRight: 4,
//     },
//     modal: {
//       flex: 1,
//       justifyContent: 'center',
//       alignItems: 'center',
//       backgroundColor: 'rgba(0,0,0,0.5)',
//     },
//     modalContent: {
//       backgroundColor: colors.surface,
//       borderRadius: 12,
//       padding: 20,
//       width: screenWidth * 0.8,
//       maxWidth: 300,
//     },
//     modalTitle: {
//       fontSize: 18,
//       fontWeight: '700',
//       color: colors.text,
//       textAlign: 'center',
//       marginBottom: 16,
//     },
//     modalOption: {
//       paddingVertical: 12,
//       paddingHorizontal: 16,
//       borderRadius: 8,
//       marginBottom: 8,
//       backgroundColor: colors.background,
//     },
//     modalOptionText: {
//       fontSize: 16,
//       color: colors.text,
//       textAlign: 'center',
//     },
//   });

//   const renderTableHeader = () => (
//     <View style={styles.tableHeader}>
//       {columns.map((column, index) => (
//         <TouchableOpacity
//           key={String(column.key)}
//           style={[
//             styles.headerCell,
//             { width: column.width || screenWidth / columns.length - 32 }
//           ]}
//           onPress={() => column.sortable && handleSort(column.key)}
//           disabled={!column.sortable}
//         >
//           <Text style={styles.headerText}>{column.title}</Text>
//           {column.sortable && (
//             <Ionicons
//               name={
//                 sortKey === column.key
//                   ? sortDirection === 'asc'
//                     ? 'chevron-up'
//                     : 'chevron-down'
//                   : 'swap-vertical'
//               }
//               size={16}
//               color={sortKey === column.key ? colors.primary : colors.textSecondary}
//             />
//           )}
//         </TouchableOpacity>
//       ))}
//     </View>
//   );

//   const renderRow = ({ item, index }: { item: T; index: number }) => (
//     <View style={styles.row}>
//       {columns.map((column) => (
//         <View
//           key={String(column.key)}
//           style={[
//             styles.cell,
//             { width: column.width || screenWidth / columns.length - 32 }
//           ]}
//         >
//           {column.render ? (
//             column.render(item[column.key], item)
//           ) : (
//             <Text style={styles.cellText} numberOfLines={2}>
//               {String(item[column.key])}
//             </Text>
//           )}
//         </View>
//       ))}
//     </View>
//   );

//   const renderPagination = () => {
//     if (filteredData.length === 0) return null;

//     const startPage = Math.max(1, currentPage - 2);
//     const endPage = Math.min(totalPages, startPage + 4);
//     const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

//     return (
//       <View style={styles.pagination}>
//         <View>
//           <Text style={styles.paginationInfo}>
//             {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length}
//           </Text>
//           <TouchableOpacity
//             style={styles.itemsPerPageButton}
//             onPress={() => setShowItemsPerPageModal(true)}
//           >
//             <Text style={styles.itemsPerPageText}>{itemsPerPage}/page</Text>
//             <Ionicons name="chevron-down" size={12} color={colors.text} />
//           </TouchableOpacity>
//         </View>
        
//         <View style={styles.paginationControls}>
//           <TouchableOpacity
//             style={styles.pageButton}
//             onPress={() => handlePageChange(currentPage - 1)}
//             disabled={currentPage === 1}
//           >
//             <Ionicons name="chevron-back" size={16} color={colors.text} />
//           </TouchableOpacity>
          
//           {pages.map(page => (
//             <TouchableOpacity
//               key={page}
//               style={[
//                 styles.pageButton,
//                 currentPage === page && styles.activePageButton
//               ]}
//               onPress={() => handlePageChange(page)}
//             >
//               <Text style={[
//                 styles.pageButtonText,
//                 currentPage === page && styles.activePageButtonText
//               ]}>
//                 {page}
//               </Text>
//             </TouchableOpacity>
//           ))}
          
//           <TouchableOpacity
//             style={styles.pageButton}
//             onPress={() => handlePageChange(currentPage + 1)}
//             disabled={currentPage === totalPages}
//           >
//             <Ionicons name="chevron-forward" size={16} color={colors.text} />
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header with search and controls */}
//       <View style={styles.header}>
//         <View style={styles.searchContainer}>
//           <Ionicons name="search" size={20} color="#FFFFFF" />
//           <TextInput
//             style={styles.searchInput}
//             placeholder={searchPlaceholder}
//             placeholderTextColor="rgba(255,255,255,0.7)"
//             value={searchTerm}
//             onChangeText={setSearchTerm}
//           />
//         </View>
        
//         <View style={styles.controlsRow}>
//           <TouchableOpacity
//             style={styles.filterButton}
//             onPress={() => setShowFilters(!showFilters)}
//           >
//             <Ionicons name="filter" size={16} color="#FFFFFF" />
//             <Text style={styles.filterButtonText}>Filters</Text>
//           </TouchableOpacity>
          
//           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//             {hasActiveFilters && (
//               <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
//                 <Text style={styles.clearButtonText}>Clear</Text>
//               </TouchableOpacity>
//             )}
//             {onRefresh && (
//               <TouchableOpacity
//                 style={styles.refreshButton}
//                 onPress={onRefresh}
//                 disabled={loading}
//               >
//                 <Ionicons name="refresh" size={16} color="#FFFFFF" />
//                 <Text style={styles.refreshButtonText}>
//                   {loading ? 'Loading...' : 'Refresh'}
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>

//       {/* Column filters */}
//       {showFilters && (
//         <View style={styles.filtersContainer}>
//           {columns.filter(col => col.filterable).map(column => (
//             <View key={String(column.key)} style={styles.filterRow}>
//               <Text style={styles.filterLabel}>{column.title}</Text>
//               <TextInput
//                 style={styles.filterInput}
//                 placeholder={`Filter ${column.title}`}
//                 value={columnFilters[String(column.key)] || ''}
//                 onChangeText={(value) => handleFilterChange(String(column.key), value)}
//               />
//             </View>
//           ))}
//         </View>
//       )}

//       {/* Table */}
//       {renderTableHeader()}
      
//       <View style={styles.tableBody}>
//         {loading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color={colors.primary} />
//             <Text style={styles.loadingText}>Loading...</Text>
//           </View>
//         ) : paginatedData.length === 0 ? (
//           <View style={styles.emptyContainer}>
//             <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
//             <Text style={styles.emptyText}>{emptyMessage}</Text>
//             {hasActiveFilters && (
//               <TouchableOpacity onPress={clearFilters}>
//                 <Text style={[styles.emptySubtext, { color: colors.primary }]}>
//                   Clear filters to see all data
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         ) : (
//           <FlatList
//             data={paginatedData}
//             renderItem={renderRow}
//             keyExtractor={(item, index) => index.toString()}
//             showsVerticalScrollIndicator={false}
//           />
//         )}
//       </View>

//       {/* Pagination */}
//       {renderPagination()}

//       {/* Items per page modal */}
//       <Modal
//         visible={showItemsPerPageModal}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setShowItemsPerPageModal(false)}
//       >
//         <TouchableOpacity
//           style={styles.modal}
//           activeOpacity={1}
//           onPress={() => setShowItemsPerPageModal(false)}
//         >
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Items per page</Text>
//             {itemsPerPageOptions.map(option => (
//               <TouchableOpacity
//                 key={option}
//                 style={styles.modalOption}
//                 onPress={() => handleItemsPerPageChange(option)}
//               >
//                 <Text style={styles.modalOptionText}>{option}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </TouchableOpacity>
//       </Modal>
//     </View>
//   );
// }