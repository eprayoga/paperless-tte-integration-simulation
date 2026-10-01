"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { FileArrowUpIcon, FilePdfIcon, FloppyDiskIcon, InfoIcon } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ROUTES } from "@/constants/app"
import { formatFileSize, hashFile } from "@/lib/file"
import {
  createDocumentSchema,
  type DocumentFormOutput,
  type DocumentFormValues,
} from "@/schemas/document.schema"
import { useDocumentStore } from "@/stores/document.store"
import { useSessionFileStore } from "@/stores/session-file.store"
import { useTemplateStore } from "@/stores/template.store"
import type { DocumentInput, DocumentItem } from "@/types/document"

type DocumentFormProps = {
  /** When set, the form edits this draft document. */
  document?: DocumentItem
}

export function DocumentForm({ document }: DocumentFormProps) {
  const router = useRouter()
  const documents = useDocumentStore((state) => state.documents)
  const addDocument = useDocumentStore((state) => state.addDocument)
  const updateDocument = useDocumentStore((state) => state.updateDocument)
  const removeTemplate = useTemplateStore((state) => state.removeTemplate)
  const setSessionFile = useSessionFileStore((state) => state.setFile)
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!document
  const schema = useMemo(
    () => createDocumentSchema({ documents, editingId: document?.id, requireFile: !isEdit }),
    [documents, document?.id, isEdit],
  )

  const form = useForm<DocumentFormValues, unknown, DocumentFormOutput>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      title: document?.title ?? "",
      regNumber: document?.regNumber ?? "",
      keyDoc: document?.keyDoc ?? "",
      file: undefined,
    },
  })

  async function onSubmit(values: DocumentFormOutput) {
    if (submitting) return
    setSubmitting(true)
    try {
      let fileMeta: Pick<DocumentInput, "fileName" | "fileSize" | "fileHash">
      if (values.file) {
        fileMeta = {
          fileName: values.file.name,
          fileSize: values.file.size,
          fileHash: await hashFile(values.file),
        }
      } else if (document) {
        fileMeta = {
          fileName: document.fileName,
          fileSize: document.fileSize,
          fileHash: document.fileHash,
        }
      } else {
        form.setError("file", { message: "File PDF wajib diunggah." })
        return
      }

      const input: DocumentInput = {
        title: values.title,
        regNumber: values.regNumber,
        keyDoc: values.keyDoc,
        reason: document?.reason,
        location: document?.location,
        ...fileMeta,
      }

      if (document) {
        // A different PDF invalidates the V2 Custom coordinates.
        if (fileMeta.fileHash !== document.fileHash) removeTemplate(document.id)
        updateDocument(document.id, input)
        if (values.file) setSessionFile(document.id, values.file)
        toast.success("Dokumen berhasil diperbarui.")
        router.push(ROUTES.documentDetail(document.id))
      } else {
        const created = addDocument(input)
        if (values.file) setSessionFile(created.id, values.file)
        toast.success("Dokumen berhasil dibuat.", { description: "Status: Draft" })
        router.push(ROUTES.documents)
      }
    } catch {
      toast.error("Gagal menyimpan dokumen.", { description: "Coba pilih ulang file PDF." })
    } finally {
      setSubmitting(false)
    }
  }

  const { errors } = form.formState

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Document" : "Document Information"}</CardTitle>
          <CardDescription>
            Data ini dipakai sebagai payload TTE Paperless (title, regNumber, key_doc, file).
            Reason dan location diisi saat TTE V2.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="title">Title *</FieldLabel>
              <Input
                id="title"
                placeholder="Document Signature Test"
                aria-invalid={!!errors.title}
                {...form.register("title")}
              />
              <FieldError errors={[errors.title]} />
            </Field>

            <div className="grid gap-6 md:grid-cols-2">
              <Field data-invalid={!!errors.regNumber}>
                <FieldLabel htmlFor="regNumber">Registration Number *</FieldLabel>
                <Input
                  id="regNumber"
                  placeholder="Test-TTE-001"
                  aria-invalid={!!errors.regNumber}
                  {...form.register("regNumber")}
                />
                <FieldDescription>Harus unik untuk setiap dokumen.</FieldDescription>
                <FieldError errors={[errors.regNumber]} />
              </Field>

              <Field data-invalid={!!errors.keyDoc}>
                <FieldLabel htmlFor="keyDoc">Key Document *</FieldLabel>
                <Input
                  id="keyDoc"
                  placeholder="sertifikat-xxxxx"
                  aria-invalid={!!errors.keyDoc}
                  {...form.register("keyDoc")}
                />
                <FieldDescription>Dikirim sebagai key_doc.</FieldDescription>
                <FieldError errors={[errors.keyDoc]} />
              </Field>
            </div>

            <Controller
              control={form.control}
              name="file"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="file">File PDF {isEdit ? "" : "*"}</FieldLabel>
                  <label
                    htmlFor="file"
                    className="hover:border-primary/60 hover:bg-primary/5 data-[invalid=true]:border-destructive/60 flex cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed p-4 transition-colors"
                    data-invalid={fieldState.invalid}
                  >
                    {field.value ? (
                      <FilePdfIcon className="size-10 shrink-0 text-red-500" />
                    ) : (
                      <FileArrowUpIcon className="text-primary size-10 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {field.value
                          ? field.value.name
                          : isEdit
                            ? `${document?.fileName} (klik untuk mengganti)`
                            : "Klik untuk memilih file PDF"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {field.value
                          ? formatFileSize(field.value.size)
                          : "Hanya application/pdf, maksimal 10 MB"}
                      </p>
                    </div>
                  </label>
                  <input
                    id="file"
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    aria-invalid={fieldState.invalid}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      field.onChange(event.target.files?.[0] ?? undefined)
                      event.target.value = ""
                    }}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Alert>
              <InfoIcon />
              <AlertDescription>
                File PDF tidak disimpan di browser. Aplikasi hanya menyimpan nama, ukuran, dan hash
                SHA-256 untuk memverifikasi file saat Anda memilihnya kembali ketika signing.
                {isEdit && " Mengganti file akan menghapus template V2 Custom dokumen ini."}
              </AlertDescription>
            </Alert>
          </FieldGroup>
        </CardContent>

        <CardFooter className="justify-end gap-2 border-t">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Spinner /> : <FloppyDiskIcon />}
            {submitting
              ? isEdit
                ? "Saving document..."
                : "Creating document..."
              : isEdit
                ? "Save Changes"
                : "Create Document"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
