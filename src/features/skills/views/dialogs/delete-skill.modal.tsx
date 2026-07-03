'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useRouter } from '@/i18n/navigation'
import { deleteSkillRequest } from '../../mutations'

interface DeleteSkillModalProps {
  name: string
  displayName: string
}

export function DeleteSkillModal({ name, displayName }: DeleteSkillModalProps) {
  const t = useTranslations('MySkills.detail')
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setPending(true)
    try {
      await deleteSkillRequest(name)
      toast.success(t('deleteSuccess', { name: displayName }))
      setOpen(false)
      router.replace('/')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('deleteFailed')
      toast.error(message)
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          {t('delete')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
          <DialogDescription>{t('deleteConfirmDesc')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            {t('deleteConfirmNo')}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t('deleteConfirmYes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
