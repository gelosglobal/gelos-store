'use client'

import { X } from 'lucide-react'
import {
  productTagDefinitions,
  getTagDefinition,
  type ProductTagId,
} from '@/lib/product-tags'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ProductTagSelectorProps = {
  value: ProductTagId[]
  onChange: (tags: ProductTagId[]) => void
}

export function ProductTagSelector({ value, onChange }: ProductTagSelectorProps) {
  const available = productTagDefinitions.filter((t) => !value.includes(t.id))

  const addTag = (tagId: string) => {
    if (!tagId || value.includes(tagId as ProductTagId)) return
    onChange([...value, tagId as ProductTagId])
  }

  const removeTag = (tagId: ProductTagId) => {
    onChange(value.filter((t) => t !== tagId))
  }

  return (
    <div className="space-y-2">
      <Select
        value=""
        onValueChange={addTag}
        disabled={available.length === 0}
      >
        <SelectTrigger className="border-neutral-200 bg-white">
          <SelectValue
            placeholder={
              value.length === 0 ? 'Choose tags' : 'Add another tag'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {available.map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              {tag.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tagId) => (
            <Badge
              key={tagId}
              variant="secondary"
              className="gap-1 pr-1 font-normal"
            >
              {getTagDefinition(tagId)?.label ?? tagId}
              <button
                type="button"
                onClick={() => removeTag(tagId)}
                className="rounded-full p-0.5 hover:bg-neutral-200"
                aria-label={`Remove ${getTagDefinition(tagId)?.label ?? tagId}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
