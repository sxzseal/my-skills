'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { UploadCloud, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DropzoneProps {
  file: File | null
  onFileChange: (f: File | null) => void
}

function isAccepted(name: string): boolean {
  return name.endsWith('.md') || name.endsWith('.zip')
}

export function Dropzone({ file, onFileChange }: DropzoneProps) {
  const t = useTranslations('MySkills.upload.dropzone')
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const f = e.dataTransfer.files[0]
      if (!f) return
      if (!isAccepted(f.name)) {
        toast.error(t('invalidType'))
        return
      }
      onFileChange(f)
    },
    [onFileChange, t],
  )

  if (file) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB · {t('fileNameLabel')}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onFileChange(null)}>
            <X className="mr-1 h-4 w-4" />
            {t('removeFile')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <label
      htmlFor="skill-file"
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50',
      )}
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full transition-colors',
          isDragging ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
        )}
      >
        <UploadCloud className="h-7 w-7" />
      </div>
      <div className="mt-1 text-base font-medium">
        {isDragging ? t('activeLine') : t('idleLine1')}
      </div>
      <div className="text-sm text-muted-foreground">{t('idleLine2')}</div>
      <div className="mt-2 text-[11px] text-muted-foreground">{t('supportedFormat')}</div>
      <input
        id="skill-file"
        type="file"
        accept=".md,.zip"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          if (!isAccepted(f.name)) {
            toast.error(t('invalidType'))
            return
          }
          onFileChange(f)
        }}
      />
    </label>
  )
}
