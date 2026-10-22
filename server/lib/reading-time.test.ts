import { describe, expect, it } from 'vitest'
import { countWords, toReadingTime } from './reading-time'

describe('countWords', () => {
  it('统计中文字符与英文单词', () => {
    expect(countWords('你好世界 hello world')).toBe(6)
  })

  it('忽略代码块与行内代码', () => {
    const content = '正文\n```ts\nconst answer = 42\n```\n`inline`'
    expect(countWords(content)).toBe(2)
  })

  it('图片与链接只保留可见文字', () => {
    expect(countWords('![图](https://example.com/a.png) [链接](https://example.com)')).toBe(2)
  })

  it('空内容统计为 0', () => {
    expect(countWords('')).toBe(0)
  })
})

describe('toReadingTime', () => {
  it('空内容最少 1 分钟', () => {
    expect(toReadingTime('')).toBe(1)
  })

  it('300 个字以内为 1 分钟', () => {
    expect(toReadingTime('字'.repeat(300))).toBe(1)
  })

  it('超过 300 个字进位到 2 分钟', () => {
    expect(toReadingTime('字'.repeat(301))).toBe(2)
  })
})
