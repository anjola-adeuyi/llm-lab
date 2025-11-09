'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Response } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ComparisonTableProps {
  responses: Response[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400 font-semibold';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400 font-semibold';
  return 'text-red-600 dark:text-red-400 font-semibold';
}

export function ComparisonTable({ responses }: ComparisonTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Response>[] = [
    {
      accessorKey: 'temperature',
      header: 'Temperature',
      cell: ({ row }) => row.original.temperature.toFixed(2),
    },
    {
      accessorKey: 'topP',
      header: 'Top P',
      cell: ({ row }) => row.original.topP.toFixed(2),
    },
    {
      accessorKey: 'metrics.overall',
      header: 'Overall Score',
      cell: ({ row }) => (
        <span className={getScoreColor(row.original.metrics.overall)}>{row.original.metrics.overall}</span>
      ),
    },
    {
      accessorKey: 'metrics.coherence',
      header: 'Coherence',
      cell: ({ row }) => (
        <span className={getScoreColor(row.original.metrics.coherence)}>{row.original.metrics.coherence}</span>
      ),
    },
    {
      accessorKey: 'metrics.completeness',
      header: 'Completeness',
      cell: ({ row }) => (
        <span className={getScoreColor(row.original.metrics.completeness)}>{row.original.metrics.completeness}</span>
      ),
    },
    {
      accessorKey: 'metrics.structural',
      header: 'Structural',
      cell: ({ row }) => (
        <span className={getScoreColor(row.original.metrics.structural)}>{row.original.metrics.structural}</span>
      ),
    },
    {
      accessorKey: 'responseText',
      header: 'Response Preview',
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className="text-sm line-clamp-2">{row.original.responseText}</p>
        </div>
      ),
    },
    {
      accessorKey: 'responseTimeMs',
      header: 'Time (ms)',
      cell: ({ row }) => row.original.responseTimeMs,
    },
    {
      accessorKey: 'tokenCount',
      header: 'Tokens',
      cell: ({ row }) => row.original.tokenCount,
    },
  ];

  const table = useReactTable({
    data: responses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(header.column.getCanSort() && 'cursor-pointer select-none hover:bg-muted/50')}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  {{
                    asc: ' ↑',
                    desc: ' ↓',
                  }[header.column.getIsSorted() as string] ?? null}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                No responses to compare
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
