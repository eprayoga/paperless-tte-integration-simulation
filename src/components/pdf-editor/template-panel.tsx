"use client"

import {
  ArrowSquareOutIcon,
  InfoIcon,
  PlusIcon,
  QrCodeIcon,
  SignatureIcon,
  TextAaIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import { useId } from "react"
import {
  Controller,
  useFormContext,
  type FieldPath,
  type UseFieldArrayReturn,
} from "react-hook-form"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SIGNATURE_INFO_TEXT } from "@/constants/template"
import { cn } from "@/lib/utils"
import type { TemplateFormValues } from "@/types/template"

export type PanelTab = "signatures" | "qr" | "text"

export type SignatureFieldArray = UseFieldArrayReturn<
  TemplateFormValues,
  "signatureCoordinates",
  "fieldKey"
>

type FieldName = FieldPath<TemplateFormValues>

function NumberField({
  name,
  label,
  suffix = "pt",
}: {
  name: FieldName
  label: string
  suffix?: string
}) {
  const id = useId()
  const { control } = useFormContext<TemplateFormValues>()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value =
          typeof field.value === "number" && Number.isFinite(field.value) ? field.value : ""
        return (
          <Field data-invalid={fieldState.invalid} className="gap-1.5">
            <FieldLabel htmlFor={id} className="text-xs">
              {label}
            </FieldLabel>
            <div className="relative">
              <Input
                id={id}
                type="number"
                inputMode="numeric"
                step={1}
                className="h-8 pr-8 font-mono text-xs"
                value={value}
                aria-invalid={fieldState.invalid}
                onBlur={field.onBlur}
                onChange={(event) =>
                  field.onChange(
                    event.target.value === "" ? Number.NaN : Number(event.target.value),
                  )
                }
              />
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px]">
                {suffix}
              </span>
            </div>
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </Field>
        )
      }}
    />
  )
}

function SwitchField({
  name,
  label,
  description,
}: {
  name: FieldName
  label: string
  description?: string
}) {
  const id = useId()
  const { control } = useFormContext<TemplateFormValues>()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal" className="items-center justify-between gap-3">
          <div className="space-y-0.5">
            <FieldLabel htmlFor={id} className="text-sm">
              {label}
            </FieldLabel>
            {description && (
              <FieldDescription className="text-xs">{description}</FieldDescription>
            )}
          </div>
          <Switch id={id} checked={field.value === true} onCheckedChange={field.onChange} />
        </Field>
      )}
    />
  )
}

function PageSelectField({
  name,
  label,
  pageCount,
}: {
  name: FieldName
  label: string
  pageCount: number
}) {
  const { control } = useFormContext<TemplateFormValues>()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="gap-1.5">
          <FieldLabel className="text-xs">{label}</FieldLabel>
          <Select
            value={typeof field.value === "number" ? String(field.value) : ""}
            onValueChange={(value) => field.onChange(Number(value))}
          >
            <SelectTrigger className="w-full" size="sm" aria-invalid={fieldState.invalid}>
              <SelectValue placeholder="Pilih halaman" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: pageCount }, (_, index) => (
                <SelectItem key={index} value={String(index + 1)}>
                  Halaman {index + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} className="text-xs" />
        </Field>
      )}
    />
  )
}

function SignaturesTab({
  fieldArray,
  pageCount,
  currentPage,
  onAdd,
  onGoToPage,
  activeIndex,
}: {
  fieldArray: SignatureFieldArray
  pageCount: number
  currentPage: number
  onAdd: () => void
  onGoToPage: (page: number) => void
  activeIndex: number | null
}) {
  const { register, watch, formState } = useFormContext<TemplateFormValues>()
  const signatures = watch("signatureCoordinates")
  const rootError =
    formState.errors.signatureCoordinates?.root?.message ??
    formState.errors.signatureCoordinates?.message

  return (
    <div className="space-y-4">
      {rootError && <p className="text-destructive text-sm">{rootError}</p>}

      {fieldArray.fields.map((item, index) => {
        const sig = signatures[index]
        const errors = formState.errors.signatureCoordinates?.[index]
        return (
          <FieldSet
            key={item.fieldKey}
            className={cn(
              "gap-3 rounded-lg border p-3 transition-colors",
              activeIndex === index && "border-primary bg-primary/5",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <FieldLegend variant="label" className="mb-0 flex items-center gap-1.5">
                <SignatureIcon className="text-primary size-4" />
                Signature #{index + 1}
              </FieldLegend>
              <div className="flex gap-1">
                {sig && sig.page !== currentPage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Lihat halaman ${sig.page}`}
                    onClick={() => onGoToPage(sig.page)}
                  >
                    <ArrowSquareOutIcon />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Hapus signature #${index + 1}`}
                  disabled={fieldArray.fields.length <= 1}
                  onClick={() => fieldArray.remove(index)}
                >
                  <TrashIcon />
                </Button>
              </div>
            </div>

            <FieldGroup className="gap-3">
              <PageSelectField
                name={`signatureCoordinates.${index}.page`}
                label="Halaman"
                pageCount={pageCount}
              />
              <div className="grid grid-cols-2 gap-2">
                <Field data-invalid={!!errors?.reason} className="gap-1.5">
                  <FieldLabel htmlFor={`sig-reason-${item.fieldKey}`} className="text-xs">
                    Reason
                  </FieldLabel>
                  <Input
                    id={`sig-reason-${item.fieldKey}`}
                    className="h-8 text-xs"
                    aria-invalid={!!errors?.reason}
                    {...register(`signatureCoordinates.${index}.reason`)}
                  />
                  <FieldError errors={[errors?.reason]} className="text-xs" />
                </Field>
                <Field data-invalid={!!errors?.location} className="gap-1.5">
                  <FieldLabel htmlFor={`sig-location-${item.fieldKey}`} className="text-xs">
                    Location
                  </FieldLabel>
                  <Input
                    id={`sig-location-${item.fieldKey}`}
                    className="h-8 text-xs"
                    aria-invalid={!!errors?.location}
                    {...register(`signatureCoordinates.${index}.location`)}
                  />
                  <FieldError errors={[errors?.location]} className="text-xs" />
                </Field>
              </div>

              <SwitchField
                name={`signatureCoordinates.${index}.isVisualSign`}
                label="Visual sign"
              />

              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  name={`signatureCoordinates.${index}.lowerLeftX`}
                  label="Lower left X"
                />
                <NumberField
                  name={`signatureCoordinates.${index}.lowerLeftY`}
                  label="Lower left Y"
                />
                <NumberField name={`signatureCoordinates.${index}.upperRightX`} label="Upper X" />
                <NumberField name={`signatureCoordinates.${index}.upperRightY`} label="Upper Y" />
              </div>

              <SwitchField
                name={`signatureCoordinates.${index}.showSignatureInfo`}
                label="Show signature info"
                description="Blok informasi penanda tangan."
              />
              {sig?.showSignatureInfo && (
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    name={`signatureCoordinates.${index}.signatureInfoX`}
                    label="Info X"
                  />
                  <NumberField
                    name={`signatureCoordinates.${index}.signatureInfoY`}
                    label="Info Y"
                  />
                </div>
              )}
            </FieldGroup>
          </FieldSet>
        )
      })}

      <Button type="button" variant="outline" className="w-full" onClick={onAdd}>
        <PlusIcon />
        Tambah signature di halaman {currentPage}
      </Button>
    </div>
  )
}

function QrTab({ pageCount }: { pageCount: number }) {
  const { control, watch, formState } = useFormContext<TemplateFormValues>()
  const pageMode = watch("qrRedirectCoordinate.pageMode")
  const exceptError = formState.errors.qrRedirectCoordinate?.exceptPages

  return (
    <FieldGroup className="gap-4">
      <SwitchField
        name="qrRedirectCoordinate.show"
        label="Tampilkan QR"
        description="QR redirect ke halaman verifikasi."
      />

      <Controller
        control={control}
        name="qrRedirectCoordinate.pageMode"
        render={({ field }) => (
          <Field className="gap-1.5">
            <FieldLabel className="text-xs">Page mode</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-page">All page</SelectItem>
                <SelectItem value="specific-page">Specific page</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      {pageMode === "specific-page" ? (
        <PageSelectField name="qrRedirectCoordinate.page" label="Halaman" pageCount={pageCount} />
      ) : (
        <Controller
          control={control}
          name="qrRedirectCoordinate.exceptPages"
          render={({ field }) => (
            <Field data-invalid={!!exceptError} className="gap-1.5">
              <FieldLabel className="text-xs">Kecuali halaman (except_pages)</FieldLabel>
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                className="flex flex-wrap justify-start gap-1"
                value={field.value.map(String)}
                onValueChange={(pages) =>
                  field.onChange(pages.map(Number).sort((a, b) => a - b))
                }
              >
                {Array.from({ length: pageCount }, (_, index) => (
                  <ToggleGroupItem key={index} value={String(index + 1)} className="min-w-8">
                    {index + 1}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldDescription className="text-xs">
                Pilih halaman yang tidak menampilkan QR.
              </FieldDescription>
              <FieldError errors={[exceptError]} className="text-xs" />
            </Field>
          )}
        />
      )}

      <div className="grid grid-cols-3 gap-2">
        <NumberField name="qrRedirectCoordinate.size" label="Size" />
        <NumberField name="qrRedirectCoordinate.x" label="X" />
        <NumberField name="qrRedirectCoordinate.y" label="Y" />
      </div>
    </FieldGroup>
  )
}

function TextInfoTab({ pageCount }: { pageCount: number }) {
  return (
    <FieldGroup className="gap-4">
      <SwitchField name="textInfoCoordinate.show" label="Tampilkan text info" />
      <PageSelectField name="textInfoCoordinate.page" label="Halaman" pageCount={pageCount} />
      <div className="grid grid-cols-3 gap-2">
        <NumberField name="textInfoCoordinate.bgOpacity" label="BG opacity" suffix="%" />
        <NumberField name="textInfoCoordinate.x" label="X" />
        <NumberField name="textInfoCoordinate.y" label="Y" />
      </div>
      <div className="bg-muted/50 rounded-md border p-3">
        <p className="text-muted-foreground mb-1 text-xs">Teks (8px, margin 10px):</p>
        <p className="text-[8px] leading-tight">{SIGNATURE_INFO_TEXT}</p>
      </div>
    </FieldGroup>
  )
}

export function TemplatePanel({
  tab,
  onTabChange,
  fieldArray,
  pageCount,
  currentPage,
  onAddSignature,
  onGoToPage,
  activeSignatureIndex,
}: {
  tab: PanelTab
  onTabChange: (tab: PanelTab) => void
  fieldArray: SignatureFieldArray
  pageCount: number
  currentPage: number
  onAddSignature: () => void
  onGoToPage: (page: number) => void
  activeSignatureIndex: number | null
}) {
  const { formState } = useFormContext<TemplateFormValues>()
  const errors = formState.errors

  return (
    <div className="space-y-4">
      <Alert className="py-2">
        <InfoIcon />
        <AlertDescription className="text-xs">
          Semua koordinat dalam satuan point PDF dengan origin (0,0) di <b>kiri bawah</b> halaman.
          Geser elemen di kanvas atau ubah angka di sini.
        </AlertDescription>
      </Alert>

      <Tabs value={tab} onValueChange={(value) => onTabChange(value as PanelTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="signatures"
            className={cn(errors.signatureCoordinates && "text-destructive")}
          >
            <SignatureIcon />
            Sign ({fieldArray.fields.length})
          </TabsTrigger>
          <TabsTrigger
            value="qr"
            className={cn(errors.qrRedirectCoordinate && "text-destructive")}
          >
            <QrCodeIcon />
            QR
          </TabsTrigger>
          <TabsTrigger
            value="text"
            className={cn(errors.textInfoCoordinate && "text-destructive")}
          >
            <TextAaIcon />
            Text
          </TabsTrigger>
        </TabsList>
        <TabsContent value="signatures" className="pt-2">
          <SignaturesTab
            fieldArray={fieldArray}
            pageCount={pageCount}
            currentPage={currentPage}
            onAdd={onAddSignature}
            onGoToPage={onGoToPage}
            activeIndex={activeSignatureIndex}
          />
        </TabsContent>
        <TabsContent value="qr" className="pt-2">
          <QrTab pageCount={pageCount} />
        </TabsContent>
        <TabsContent value="text" className="pt-2">
          <TextInfoTab pageCount={pageCount} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
