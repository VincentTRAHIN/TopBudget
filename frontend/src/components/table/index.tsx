import dayjs from "dayjs";
import { DynamicIcon } from "lucide-react/dynamic";
import { DataType, DisplayType, TableProps } from "./table.types";
import { useTableFeatures } from "./useTableFeatures";
import { useCallback } from "react";


export function Table<T extends Record<string, any>>({
  columns,
  data,
  footer,
  rowAction,
  emptyRender,
  onFilterChange
}: TableProps<T>) {
  const { sortState, handleSort, sortedData } = useTableFeatures<T>({
    data,
    defaultSortKey: columns.find(col => col.enableSort)?.accessor as keyof T,
    onFilterChange
  });


  // Factorisation du rendu des cellules
  const renderCell = useCallback((column: typeof columns[number], row: T): React.ReactNode => {
    const value = row[column.accessor];
    if (column.displayType) {
      switch (column.displayType) {
        case DisplayType.DATE:
          return dayjs(value).format(column.dateFormat || 'DD/MM/YYYY');
        case DisplayType.CURRENCY:
          const currency = column.getCurrentCurrency ? column.getCurrentCurrency() : '€';
          return typeof value === 'number' ? `${value.toFixed(2)} ${currency}` : value;
        case DisplayType.ICON:
          if (column.getIcon) {
            const icon = column.getIcon(row);
            if (icon && icon.name) {
              return <DynamicIcon name={icon.name} size={icon.size ?? 16} color={icon.color} />;
            }
          }
          return null;
        default:
          return value;
      }
    } else {
      switch (column.dataType) {
        case DataType.STRING:
          return value;
        case DataType.NUMBER:
          return typeof value === 'number' ? value.toLocaleString() : value;
        default:
          return value;
      }
    }
  }, []);

  return (
    <>
      <table className="table w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            {columns.map((column, index) => {

              const header = (column.header ?? String(column.accessor))
                .replace(/^\w/, (c) => c.toUpperCase())
              return (
                <th
                  key={index}
                  className={`px-4 py-2 text-left ${column.enableSort ? 'cursor-pointer select-none' : ''} ${column.className || ''}`}
                  onClick={column.enableSort ? () => handleSort(column.accessor) : undefined}
                >
                  {header}
                  {column.enableSort && sortState?.key === column.accessor && (
                    <span className="ml-1">
                      {sortState.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
              );
            })}
            {rowAction && <th className="px-4 py-2 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((row, index) => (
              <tr className="border-b hover:bg-gray-50" key={index}>
                {columns.map((column, columnIndex) => (
                  <td key={columnIndex} className={`px-4 py-2 ${column.className}`}>
                    {column.getValue ? column.getValue(row) : renderCell(column, row)}
                  </td>
                ))}
                {rowAction && (
                  <td className="px-4 py-2">
                    {rowAction.map((action, rowIndex) => {
                      const { icon, action: actionFn, disabled: disabledFn, color: colorFn, header, ariaLabel: ariaLabelFn, className } = action;
                      const color = colorFn || 'blue';
                      const disabled = typeof disabledFn === 'function' ? disabledFn(row) : !!disabledFn;
                      const ariaLabel = header
                        ? undefined
                        : typeof ariaLabelFn === 'function'
                          ? ariaLabelFn(row)
                          : ariaLabelFn || 'Action';
                      return (
                        <button
                          key={rowIndex}
                          type="button"
                          className={`p-1 text-${color}-600 hover:text-${color}-800 disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
                          onClick={() => actionFn(row)}
                          aria-label={ariaLabel}
                          disabled={disabled}
                        >
                          <span className="inline-block mr-1 align-middle"><DynamicIcon name={icon} size={16} color={color} /></span>
                        </button>
                      );
                    })}
                  </td>
                )}
              </tr>
            )))
            : (emptyRender)}

        </tbody>
        {footer && <tfoot className="table-footer">{footer}</tfoot>}
      </table >
    </>
  );
}

// Classe utilitaire pour les options de select (filterOption)
export class DataEnum<T> {
  data: T[];
  getId: (row: T) => string | number;
  getLabel: (row: T) => string;
  action?: (value: string) => void;
  constructor(params: {
    data: T[];
    getId: (row: T) => string | number;
    getLabel: (row: T) => string;
    action?: (value: string) => void;
  }) {
    this.data = params.data;
    this.getId = params.getId;
    this.getLabel = params.getLabel;
    this.action = params.action;
  }
}