"use client"

import "@/components/pdf/pdf-worker"

import { WarningCircleIcon } from "@phosphor-icons/react"
import { useMemo, useState, type ReactNode } from "react"
import { Document, Page, type PageProps } from "react-pdf"
import { Rnd } from "react-rnd"

import {
  QrVisual,
  SignatureInfoVisual,
  SignatureVisual,
  TextInfoVisual,
} from "@/components/pdf-editor/overlay-visuals"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MAX_QR_SIZE,
  MIN_QR_SIZE,
  MIN_SIGNATURE_SIZE,
  SIGNATURE_INFO_SIZE,
  TEXT_INFO_SIZE,
} from "@/constants/template"
import { useElementWidth } from "@/hooks/use-element-width"
import {
  boxToPdfRect,
  pdfRectToScreenRect,
  roundPdfRect,
  screenRectToPdfRect,
  type PdfRect,
  type ScreenRect,
  type Transform,
} from "@/lib/pdf-coordinates"
import { cn } from "@/lib/utils"
import type { SignatureCoordinate, TemplateFormValues } from "@/types/template"

type LoadedPage = Parameters<NonNullable<PageProps["onLoadSuccess"]>>[0]

export type EditorElementKey = `signature:${number}` | `signatureInfo:${number}` | "qr" | "text"

export type EditorCanvasProps = {
  file: File
  pageNumber: number
  /** 1 = fit container width. */
  zoom: number
  values: TemplateFormValues
  selected: EditorElementKey | null
  onSelect: (key: EditorElementKey | null) => void
  onSignatureChange: (index: number, rect: PdfRect) => void
  onSignatureInfoChange: (index: number, x: number, y: number) => void
  onQrChange: (next: { x: number; y: number; size: number }) => void
  onTextInfoChange: (x: number, y: number) => void
}

const HANDLE = "!size-3 rounded-full border-2 border-white bg-primary"

type DraggableElementProps = {
  elementKey: EditorElementKey
  screen: ScreenRect
  transform: Transform
  selected: boolean
  onSelect: (key: EditorElementKey) => void
  /** Called with the element's new rect in PDF space (rounded to whole points). */
  onCommit: (rect: PdfRect) => void
  resizable?: boolean
  lockAspectRatio?: boolean
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  title: string
  children: ReactNode
}

function DraggableElement({
  elementKey,
  screen,
  transform,
  selected,
  onSelect,
  onCommit,
  resizable = false,
  lockAspectRatio = false,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  title,
  children,
}: DraggableElementProps) {
  const commit = (rect: ScreenRect) =>
    onCommit(roundPdfRect(screenRectToPdfRect(transform, rect)))

  return (
    <Rnd
      bounds="parent"
      size={{ width: screen.width, height: screen.height }}
      position={{ x: screen.left, y: screen.top }}
      enableResizing={resizable}
      lockAspectRatio={lockAspectRatio}
      minWidth={minWidth}
      minHeight={minHeight}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      onMouseDown={() => onSelect(elementKey)}
      onDragStop={(_event, data) =>
        commit({ left: data.x, top: data.y, width: screen.width, height: screen.height })
      }
      onResizeStop={(_event, _direction, ref, _delta, position) =>
        commit({
          left: position.x,
          top: position.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        })
      }
      className={cn(
        "cursor-move",
        selected
          ? "ring-primary z-20 ring-2 ring-offset-1"
          : "hover:ring-primary/50 z-10 hover:ring-1",
      )}
      resizeHandleClasses={
        resizable
          ? {
              bottomRight: `${HANDLE} !-right-1.5 !-bottom-1.5`,
              bottomLeft: `${HANDLE} !-bottom-1.5 !-left-1.5`,
              topRight: `${HANDLE} !-top-1.5 !-right-1.5`,
              topLeft: `${HANDLE} !-top-1.5 !-left-1.5`,
            }
          : undefined
      }
    >
      <div className="h-full w-full" title={title}>
        {children}
      </div>
    </Rnd>
  )
}

function SignatureElements({
  index,
  signature,
  transform,
  scale,
  selected,
  onSelect,
  onSignatureChange,
  onSignatureInfoChange,
}: {
  index: number
  signature: SignatureCoordinate
  transform: Transform
  scale: number
  selected: EditorElementKey | null
  onSelect: (key: EditorElementKey) => void
  onSignatureChange: EditorCanvasProps["onSignatureChange"]
  onSignatureInfoChange: EditorCanvasProps["onSignatureInfoChange"]
}) {
  const signatureKey: EditorElementKey = `signature:${index}`
  const infoKey: EditorElementKey = `signatureInfo:${index}`

  return (
    <>
      {signature.showSignatureInfo && (
        <DraggableElement
          elementKey={infoKey}
          title={`Signature Info #${index + 1}`}
          transform={transform}
          screen={pdfRectToScreenRect(
            transform,
            boxToPdfRect(
              signature.signatureInfoX,
              signature.signatureInfoY,
              SIGNATURE_INFO_SIZE.width,
              SIGNATURE_INFO_SIZE.height,
            ),
          )}
          selected={selected === infoKey}
          onSelect={onSelect}
          onCommit={(rect) => onSignatureInfoChange(index, rect.llx, rect.lly)}
        >
          <SignatureInfoVisual
            scale={scale}
            reason={signature.reason}
            location={signature.location}
          />
        </DraggableElement>
      )}
      <DraggableElement
        elementKey={signatureKey}
        title={`Signature #${index + 1}`}
        transform={transform}
        screen={pdfRectToScreenRect(transform, {
          llx: signature.lowerLeftX,
          lly: signature.lowerLeftY,
          urx: signature.upperRightX,
          ury: signature.upperRightY,
        })}
        selected={selected === signatureKey}
        onSelect={onSelect}
        resizable
        minWidth={MIN_SIGNATURE_SIZE.width * scale}
        minHeight={MIN_SIGNATURE_SIZE.height * scale}
        onCommit={(rect) => onSignatureChange(index, rect)}
      >
        <SignatureVisual
          scale={scale}
          isVisualSign={signature.isVisualSign}
          label={`#${index + 1}`}
        />
      </DraggableElement>
    </>
  )
}

/**
 * Renders one PDF page with the template elements on top. Elements are stored
 * in PDF space; every render maps them to screen space with the page viewport
 * transform, and every drag/resize maps them back (origin bottom-left).
 */
export default function EditorCanvasImpl({
  file,
  pageNumber,
  zoom,
  values,
  selected,
  onSelect,
  onSignatureChange,
  onSignatureInfoChange,
  onQrChange,
  onTextInfoChange,
}: EditorCanvasProps) {
  const { ref, width: containerWidth } = useElementWidth<HTMLDivElement>()
  const [page, setPage] = useState<LoadedPage | null>(null)
  const renderWidth = Math.max(200, Math.floor(containerWidth * zoom) - 4)

  const viewport = useMemo(() => {
    if (!page || page.pageNumber !== pageNumber) return null
    const base = page.getViewport({ scale: 1 })
    return page.getViewport({ scale: renderWidth / base.width })
  }, [page, pageNumber, renderWidth])

  const transform = viewport?.transform as Transform | undefined
  const scale = viewport?.scale ?? 1

  const qr = values.qrRedirectCoordinate
  const text = values.textInfoCoordinate
  const qrVisible =
    qr.show &&
    (qr.pageMode === "all-page" ? !qr.exceptPages.includes(pageNumber) : qr.page === pageNumber)
  const textVisible = text.show && text.page === pageNumber

  return (
    <div ref={ref} className="w-full overflow-auto p-3 [scrollbar-gutter:stable]">
      {containerWidth > 0 && (
        <Document
          file={file}
          loading={<Skeleton className="aspect-[1/1.414] w-full" />}
          error={
            <Alert variant="destructive">
              <WarningCircleIcon />
              <AlertTitle>PDF tidak dapat ditampilkan</AlertTitle>
              <AlertDescription>File mungkin rusak atau terproteksi.</AlertDescription>
            </Alert>
          }
        >
          <div className="relative mx-auto w-fit">
            <Page
              pageNumber={pageNumber}
              width={renderWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onLoadSuccess={setPage}
              className="overflow-hidden rounded-md border bg-white shadow-sm"
              loading={<Skeleton style={{ width: renderWidth, aspectRatio: "1 / 1.414" }} />}
            />

            {viewport && transform && (
              <div
                className="absolute top-0 left-0"
                style={{ width: viewport.width, height: viewport.height }}
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) onSelect(null)
                }}
              >
                {textVisible && (
                  <DraggableElement
                    elementKey="text"
                    title="Text Info"
                    transform={transform}
                    screen={pdfRectToScreenRect(
                      transform,
                      boxToPdfRect(text.x, text.y, TEXT_INFO_SIZE.width, TEXT_INFO_SIZE.height),
                    )}
                    selected={selected === "text"}
                    onSelect={onSelect}
                    onCommit={(rect) => onTextInfoChange(rect.llx, rect.lly)}
                  >
                    <TextInfoVisual scale={scale} bgOpacity={text.bgOpacity} />
                  </DraggableElement>
                )}

                {qrVisible && (
                  <DraggableElement
                    elementKey="qr"
                    title="QR Code"
                    transform={transform}
                    screen={pdfRectToScreenRect(
                      transform,
                      boxToPdfRect(qr.x, qr.y, qr.size, qr.size),
                    )}
                    selected={selected === "qr"}
                    onSelect={onSelect}
                    resizable
                    lockAspectRatio
                    minWidth={MIN_QR_SIZE * scale}
                    minHeight={MIN_QR_SIZE * scale}
                    maxWidth={MAX_QR_SIZE * scale}
                    maxHeight={MAX_QR_SIZE * scale}
                    onCommit={(rect) =>
                      onQrChange({
                        x: rect.llx,
                        y: rect.lly,
                        size: Math.round(Math.max(rect.urx - rect.llx, rect.ury - rect.lly)),
                      })
                    }
                  >
                    <QrVisual />
                  </DraggableElement>
                )}

                {values.signatureCoordinates.map((sig, index) =>
                  sig.page !== pageNumber ? null : (
                    <SignatureElements
                      key={sig.id}
                      index={index}
                      signature={sig}
                      transform={transform}
                      scale={scale}
                      selected={selected}
                      onSelect={onSelect}
                      onSignatureChange={onSignatureChange}
                      onSignatureInfoChange={onSignatureInfoChange}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </Document>
      )}
    </div>
  )
}
