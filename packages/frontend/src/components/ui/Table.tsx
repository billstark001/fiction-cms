import React from 'react';
import clsx from 'clsx';
import * as tableStyles from '../../styles/table.css';

interface TableProps {
  className?: string;
  children: React.ReactNode;
}

interface TableContainerProps {
  className?: string;
  children: React.ReactNode;
}

interface TableHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface TableBodyProps {
  className?: string;
  children: React.ReactNode;
}

interface TableRowProps {
  className?: string;
  hoverable?: boolean;
  children: React.ReactNode;
}

interface TableHeadProps {
  className?: string;
  children: React.ReactNode;
}

interface TableCellProps {
  className?: string;
  withText?: boolean;
  children: React.ReactNode;
}

interface EmptyStateProps {
  title: string;
  description?: string;
}

// Table Container Component
export const TableContainer: React.FC<TableContainerProps> = ({ 
  className, 
  children 
}) => (
  <div className={clsx(tableStyles.tableContainer, className)}>
    {children}
  </div>
);

// Main Table Component
export const Table: React.FC<TableProps> = ({ 
  className, 
  children 
}) => (
  <table className={clsx(tableStyles.table, className)}>
    {children}
  </table>
);

// Table Header
export const TableHeader: React.FC<TableHeaderProps> = ({ 
  className, 
  children 
}) => (
  <thead className={clsx(tableStyles.thead, className)}>
    {children}
  </thead>
);

// Table Body
export const TableBody: React.FC<TableBodyProps> = ({ 
  className, 
  children 
}) => (
  <tbody className={clsx(tableStyles.tbody, className)}>
    {children}
  </tbody>
);

// Table Row
export const TableRow: React.FC<TableRowProps> = ({ 
  className, 
  hoverable = false, 
  children 
}) => (
  <tr className={clsx(
    hoverable ? tableStyles.trHover : tableStyles.tr,
    className
  )}>
    {children}
  </tr>
);

// Table Header Cell
export const TableHead: React.FC<TableHeadProps> = ({ 
  className, 
  children 
}) => (
  <th className={clsx(tableStyles.th, className)}>
    {children}
  </th>
);

// Table Cell
export const TableCell: React.FC<TableCellProps> = ({ 
  className,
  withText = false,
  children 
}) => (
  <td className={clsx(
    withText ? tableStyles.tdWithText : tableStyles.td,
    className
  )}>
    {children}
  </td>
);

// Empty State Component
export const TableEmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description 
}) => (
  <div className={tableStyles.emptyState}>
    <h3 className={tableStyles.emptyStateTitle}>{title}</h3>
    {description && (
      <p className={tableStyles.emptyStateText}>{description}</p>
    )}
  </div>
);