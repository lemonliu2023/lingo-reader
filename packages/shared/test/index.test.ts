import { describe, expect, it } from 'vitest'
import { ContentType } from '../src'

describe('shared', () => {
  it('for coverage rate', () => {
    expect(ContentType).toBeDefined()
  })
})
