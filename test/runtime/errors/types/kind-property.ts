import { ValueErrorType } from '@sinclair/typebox/errors'
import { Resolve } from './resolve'
import { Assert } from '../../assert'

describe('errors/type/KindProperty', () => {
  it('Should pass 0', () => {
    const R = Resolve({} as never, 1)
    Assert.IsEqual(R.length, 1)
    Assert.IsEqual(R[0].type, ValueErrorType.KindProperty)
  })
})
