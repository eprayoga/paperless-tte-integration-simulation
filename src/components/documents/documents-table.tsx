"use client"

import {
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  FilePdfIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import Link from "next/link"
import { useMemo, useState } from "react"

import { DocumentRowActions } from "@/components/documents/document-row-actions"
import { SignMethodBadge, StatusBadge } from "@/components/documents/status-badge"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROUTES } from "@/constants/app"
import { STATUS_LABELS } from "@/constants/document"
import { formatDateTime } from "@/lib/format"
import { DOCUMENT_STATUSES, type DocumentItem, type DocumentStatus } from "@/types/document"

const columns: ColumnDef<DocumentItem>[] = [
  {
    id: "document",
    accessorKey: "title",
    header: "Document",
    cell: ({ row }) => (
      <Link
        href={ROUTES.documentDetail(row.original.id)}
        className="group flex min-w-[180px] items-center gap-3"
      >
        <FilePdfIcon className="size-8 shrink-0 text-red-500" />
        <div className="min-w-0">
          <p className="group-hover:text-primary truncate font-medium">{row.original.title}</p>
          <p className="text-muted-foreground truncate text-xs">{row.original.fileName}</p>
        </div>
      </Link>
    ),
  },
  {
    accessorKey: "regNumber",
    header: "Registration Number",
    cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
  },
  {
    accessorKey: "signMethod",
    header: "Sign Method",
    cell: ({ row }) => <SignMethodBadge method={row.original.signMethod} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "signerName",
    header: "Signer",
    cell: ({ getValue }) =>
      getValue<string | undefined>() ?? <span className="text-muted-foreground">-</span>,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-sm whitespace-nowrap">
        {formatDateTime(getValue<string>())}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DocumentRowActions document={row.original} />
      </div>
    ),
  },
]

const ALL_STATUSES = "all"
type StatusFilter = DocumentStatus | typeof ALL_STATUSES

export function DocumentsTable({ documents }: { documents: DocumentItem[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }])
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_STATUSES)

  const columnFilters = useMemo(
    () => (statusFilter === ALL_STATUSES ? [] : [{ id: "status", value: statusFilter }]),
    [statusFilter],
  )

  const table = useReactTable({
    data: documents,
    columns,
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, value: string) => {
      const query = value.trim().toLowerCase()
      if (!query) return true
      const { title, regNumber, fileName, signerName } = row.original
      return [title, regNumber, fileName, signerName].some((field) =>
        field?.toLowerCase().includes(query),
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    autoResetPageIndex: false,
  })

  const filteredCount = table.getFilteredRowModel().rows.length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <InputGroup className="sm:max-w-xs">
          <InputGroupAddon>
            <MagnifyingGlassIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Cari judul, reg number, signer..."
            aria-label="Cari dokumen"
            value={globalFilter}
            onChange={(event) => {
              setGlobalFilter(event.target.value)
              table.setPageIndex(0)
            }}
          />
        </InputGroup>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as StatusFilter)
            table.setPageIndex(0)
          }}
        >
          <SelectTrigger className="sm:w-40" aria-label="Filter status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>Semua status</SelectItem>
            {DOCUMENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const SortIcon =
                    sorted === "asc"
                      ? CaretUpIcon
                      : sorted === "desc"
                        ? CaretDownIcon
                        : CaretUpDownIcon
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="hover:text-foreground -ml-1 inline-flex items-center gap-1 rounded px-1"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon className="size-3.5 opacity-60" />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  Tidak ada dokumen yang cocok dengan filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-muted-foreground text-sm">
          {filteredCount} dari {documents.length} dokumen
        </p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
            {Math.max(table.getPageCount(), 1)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Halaman sebelumnya"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <CaretLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Halaman berikutnya"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <CaretRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
