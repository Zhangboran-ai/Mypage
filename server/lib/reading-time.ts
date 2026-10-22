import { READING_WORDS_PER_MINUTE } from '../../shared/constants'

export function countWords(content: string): number {
  const text = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')

  const chinese = text.match(/[\u4e00-\u9fff]/g)?.length ?? 0
  const english = text
    .replace(/[\u4e00-\u9fff]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  return chinese + english
}

export function toReadingTime(content: string): number {
  return Math.max(1, Math.ceil(countWords(content) / READING_WORDS_PER_MINUTE))
}
