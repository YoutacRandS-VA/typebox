import { Type } from '@sinclair/typebox'
import { ValueErrorType } from '@sinclair/typebox/errors'
import { Resolve } from './resolve'
import { Assert } from '../../assert'

describe('errors/type/StringFormatNotFound', () => {
  const T = Type.String({ format: 'unknown' })
  it('Should pass 1', () => {
    const R = Resolve(T, '')
    Assert.IsEqual(R.length, 1)
    Assert.IsEqual(R[0].type, ValueErrorType.StringFormatNotFound)
  })
})
