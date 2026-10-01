"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowCounterClockwiseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  EyeIcon,
  FloppyDiskIcon,
  HandGrabbingIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
  type FieldPath,
} from "react-hook-form"
import { toast } from "sonner"

import { DocumentNotFound, PageSkeleton } from "@/components/common/states"
import { PdfAttachField } from "@/components/documents/pdf-attach-field"
import { PageContainer, PageHeader, PageTitle } from "@/components/layout/page-header"
import { EditorCanvas, type EditorElementKey } from "@/components/pdf-editor/editor-canvas"
import { TemplatePanel, type PanelTab } from "@/components/pdf-editor/template-panel"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ROUTES } from "@/constants/app"
import { SIGNATURE_INFO_SIZE } from "@/constants/template"
import { useDocument } from "@/hooks/use-document"
import type { PdfRect } from "@/lib/pdf-coordinates"
import { readPdfInfo, type PdfInfo } from "@/lib/pdf-info"
import { createSignatureCoordinate, getInitialTemplateValues } from "@/lib/template-defaults"
import { createTemplateSchema } from "@/schemas/template.schema"
import { useSessionFileStore } from "@/stores/session-file.store"
import { useTemplateStore } from "@/stores/template.store"
import type { DocumentItem } from "@/types/document"
import type { TemplateFormValues, V2CustomTemplate } from "@/types/template"

const ZOOM_OPTIONS = [
  { value: "1", label: "Fit width" },
  { value: "1.25", label: "125%" },
  { value: "1.5", label: "150%" },
  { value: "2", label: "200%" },
]

const SET_OPTIONS = { shouldDirty: true, shouldValidate: true } as const

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max))

function describeSelection(
  key: EditorElementKey | null,
  values: TemplateFormValues,
): string | null {
  if (!key) return null
  if (key === "qr") {
    const qr = values.qrRedirectCoordinate
    return `QR · x ${qr.x}, y ${qr.y} · size ${qr.size}pt`
  }
  if (key === "text") {
    const text = values.textInfoCoordinate
    return `Text Info · x ${text.x}, y ${text.y}`
  }
  const [type, rawIndex] = key.split(":")
  const index = Number(rawIndex)
  const sig = values.signatureCoordinates[index]
  if (!sig) return null
  if (type === "signatureInfo") {
    return `Signature Info #${index + 1} · x ${sig.signatureInfoX}, y ${sig.signatureInfoY}`
  }
  return `Signature #${index + 1} · lower-left (${sig.lowerLeftX}, ${sig.lowerLeftY}) · upper (${sig.upperRightX}, ${sig.upperRightY})`
}

function TemplateEditorForm({
  document,
  file,
  info,
  existing,
}: {
  document: DocumentItem
  file: File
  info: PdfInfo
  existing?: V2CustomTemplate
}) {
  const router = useRouter()
  const saveTemplate = useTemplateStore((state) => state.saveTemplate)
  const [initialValues] = useState(() =>
    getInitialTemplateValues(document, info.pageSizes, existing),
  )
  const [currentPage, setCurrentPage] = useState(
    () => initialValues.signatureCoordinates[0]?.page ?? 1,
  )
  const [zoom, setZoom] = useState("1")
  const [selected, setSelected] = useState<EditorElementKey | null>(null)
  const [tab, setTab] = useState<PanelTab>("signatures")

  const schema = useMemo(() => createTemplateSchema(info), [info])
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
    mode: "onChange",
  })
  const fieldArray = useFieldArray({
    control: form.control,
    name: "signatureCoordinates",
    keyName: "fieldKey",
  })
  const values = useWatch({ control: form.control }) as TemplateFormValues
  const { isDirty } = form.formState

  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [isDirty])

  const setNumber = useCallback(
    (path: FieldPath<TemplateFormValues>, value: number) =>
      form.setValue(path, value as never, SET_OPTIONS),
    [form],
  )

  const handleSelect = useCallback((key: EditorElementKey | null) => {
    setSelected(key)
    if (!key) return
    setTab(key === "qr" ? "qr" : key === "text" ? "text" : "signatures")
  }, [])

  const handleSignatureChange = useCallback(
    (index: number, rect: PdfRect) => {
      // Copy: getValues returns the live form object, which the setters below mutate.
      const prev = { ...form.getValues(`signatureCoordinates.${index}`) }
      const moved =
        Math.abs(rect.urx - rect.llx - (prev.upperRightX - prev.lowerLeftX)) <= 1 &&
        Math.abs(rect.ury - rect.lly - (prev.upperRightY - prev.lowerLeftY)) <= 1

      setNumber(`signatureCoordinates.${index}.lowerLeftX`, rect.llx)
      setNumber(`signatureCoordinates.${index}.lowerLeftY`, rect.lly)
      setNumber(`signatureCoordinates.${index}.upperRightX`, rect.urx)
      setNumber(`signatureCoordinates.${index}.upperRightY`, rect.ury)

      // Keep the signature info block attached when the signature is moved.
      if (moved && prev.showSignatureInfo) {
        const page = info.pageSizes[prev.page - 1]
        const infoX = prev.signatureInfoX + rect.llx - prev.lowerLeftX
        const infoY = prev.signatureInfoY + rect.lly - prev.lowerLeftY
        setNumber(
          `signatureCoordinates.${index}.signatureInfoX`,
          Math.round(clamp(infoX, 0, page.width - SIGNATURE_INFO_SIZE.width)),
        )
        setNumber(
          `signatureCoordinates.${index}.signatureInfoY`,
          Math.round(clamp(infoY, 0, page.height - SIGNATURE_INFO_SIZE.height)),
        )
      }
    },
    [form, info.pageSizes, setNumber],
  )

  const handleAddSignature = () => {
    const nextIndex = fieldArray.fields.length
    fieldArray.append(
      createSignatureCoordinate({
        page: currentPage,
        pageSize: info.pageSizes[currentPage - 1],
        reason: document.reason ?? "",
        location: document.location ?? "",
      }),
    )
    handleSelect(`signature:${nextIndex}`)
  }

  const handleSave = (goToPreview: boolean) =>
    form.handleSubmit(
      (data) => {
        saveTemplate({
          documentId: document.id,
          fileHash: document.fileHash,
          pageCount: info.pageCount,
          pageSizes: info.pageSizes,
          ...data,
        })
        form.reset(data)
        toast.success("Template V2 Custom tersimpan.", {
          description: "Template disimpan di localStorage browser ini.",
        })
        if (goToPreview) router.push(ROUTES.signPreview(document.id))
      },
      () =>
        toast.error("Template belum valid.", {
          description: "Periksa field yang ditandai merah pada panel.",
        }),
    )()

  const selectedSignatureIndex = selected?.startsWith("signature")
    ? Number(selected.split(":")[1])
    : null
  const selectionLabel = describeSelection(selected, values)

  return (
    <FormProvider {...form}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="min-w-0 gap-4">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Halaman sebelumnya"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  <CaretLeftIcon />
                </Button>
                <span className="min-w-28 text-center text-sm font-medium tabular-nums">
                  Halaman {currentPage} / {info.pageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Halaman berikutnya"
                  disabled={currentPage >= info.pageCount}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  <CaretRightIcon />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {isDirty && <Badge variant="secondary">Belum disimpan</Badge>}
                <Select value={zoom} onValueChange={setZoom}>
                  <SelectTrigger size="sm" className="w-32" aria-label="Zoom">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZOOM_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <HandGrabbingIcon className="size-4 shrink-0" />
              {selectionLabel ??
                "Drag elemen untuk memindahkan. Tarik sudut signature/QR untuk mengubah ukuran."}
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-muted/40 mx-4 rounded-lg p-0 sm:mx-6">
            <EditorCanvas
              file={file}
              pageNumber={currentPage}
              zoom={Number(zoom)}
              values={values}
              selected={selected}
              onSelect={handleSelect}
              onSignatureChange={handleSignatureChange}
              onSignatureInfoChange={(index, x, y) => {
                setNumber(`signatureCoordinates.${index}.signatureInfoX`, x)
                setNumber(`signatureCoordinates.${index}.signatureInfoY`, y)
              }}
              onQrChange={({ x, y, size }) => {
                setNumber("qrRedirectCoordinate.x", x)
                setNumber("qrRedirectCoordinate.y", y)
                setNumber("qrRedirectCoordinate.size", size)
              }}
              onTextInfoChange={(x, y) => {
                setNumber("textInfoCoordinate.x", x)
                setNumber("textInfoCoordinate.y", y)
              }}
            />
          </CardContent>
        </Card>

        <Card className="gap-4 xl:sticky xl:top-20 xl:max-h-[calc(100svh-6rem)] xl:overflow-hidden">
          <CardHeader>
            <CardTitle>Properti Template</CardTitle>
            <CardDescription>Signature, QR redirect, dan text info.</CardDescription>
          </CardHeader>
          <CardContent className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            <TemplatePanel
              tab={tab}
              onTabChange={setTab}
              fieldArray={fieldArray}
              pageCount={info.pageCount}
              currentPage={currentPage}
              onAddSignature={handleAddSignature}
              onGoToPage={setCurrentPage}
              activeSignatureIndex={selectedSignatureIndex}
            />
          </CardContent>
          <CardFooter className="flex-wrap justify-end gap-2 border-t">
            <Button
              type="button"
              variant="ghost"
              disabled={!isDirty}
              onClick={() => {
                form.reset()
                setSelected(null)
              }}
            >
              <ArrowCounterClockwiseIcon />
              Reset
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleSave(false)}>
              <FloppyDiskIcon />
              Save Template
            </Button>
            <Button type="button" onClick={() => void handleSave(true)}>
              <EyeIcon />
              Save &amp; Preview
            </Button>
          </CardFooter>
        </Card>
      </div>
    </FormProvider>
  )
}

type LoaderState = { status: "loading" } | { status: "ready"; info: PdfInfo } | { status: "error" }

function TemplateEditorLoader({
  document,
  file,
  existing,
}: {
  document: DocumentItem
  file: File
  existing?: V2CustomTemplate
}) {
  const [state, setState] = useState<LoaderState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    readPdfInfo(file)
      .then((info) => {
        if (!cancelled) {
          setState(info.pageCount > 0 ? { status: "ready", info } : { status: "error" })
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" })
      })
    return () => {
      cancelled = true
    }
  }, [file])

  if (state.status === "loading") {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="aspect-[1/1.414] w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }
  if (state.status === "error") {
    return (
      <Alert variant="destructive">
        <WarningCircleIcon />
        <AlertTitle>PDF tidak dapat dibaca</AlertTitle>
        <AlertDescription>File mungkin rusak atau terproteksi password.</AlertDescription>
      </Alert>
    )
  }
  return (
    <TemplateEditorForm document={document} file={file} info={state.info} existing={existing} />
  )
}

export function TemplateEditorView({ id }: { id: string }) {
  const { hydrated, document } = useDocument(id)
  const existing = useTemplateStore((state) => state.templates[id])
  const file = useSessionFileStore((state) => state.files[id])

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Documents", href: ROUTES.documents },
          ...(document ? [{ label: document.title, href: ROUTES.documentDetail(id) }] : []),
          { label: "Template V2 Custom" },
        ]}
      />
      <PageContainer>
        {!hydrated ? (
          <PageSkeleton />
        ) : !document ? (
          <DocumentNotFound />
        ) : (
          <>
            <PageTitle
              title="Template V2 Custom"
              description={
                <>
                  Tentukan posisi signature, QR, dan text info untuk{" "}
                  <span className="text-foreground font-medium">{document.title}</span>.
                </>
              }
              actions={
                <Button variant="outline" asChild>
                  <Link href={ROUTES.documentDetail(id)}>Kembali ke detail</Link>
                </Button>
              }
            />

            {document.status !== "draft" ? (
              <Alert>
                <WarningCircleIcon />
                <AlertTitle>Dokumen sudah diproses</AlertTitle>
                <AlertDescription>
                  Template hanya dapat diubah untuk dokumen berstatus Draft.
                </AlertDescription>
              </Alert>
            ) : !file ? (
              <Card className="mx-auto w-full max-w-xl">
                <CardHeader>
                  <CardTitle>Pilih file PDF dokumen</CardTitle>
                  <CardDescription>
                    File tidak disimpan di browser. Pilih ulang file yang sama untuk dijadikan
                    background editor.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PdfAttachField document={document} />
                </CardContent>
              </Card>
            ) : (
              <TemplateEditorLoader
                key={`${file.name}-${file.size}-${file.lastModified}`}
                document={document}
                file={file}
                existing={existing}
              />
            )}
          </>
        )}
      </PageContainer>
    </>
  )
}
