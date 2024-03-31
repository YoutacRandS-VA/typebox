import { TypeGuard } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'
import { Assert } from '../../assert/index'

describe('type/guard/Refine', () => {
  it('Should guard for Refine', () => {
    const T = Type.Refine(Type.Any()).Done()
    const R = TypeGuard.IsRefine(T)
    Assert.IsTrue(R)
  })
  it('Should not guard for Refine', () => {
    const T = Type.Any()
    const R = TypeGuard.IsRefine(T)
    Assert.IsFalse(R)
  })
  it('Should guard for Refinement 1', () => {
    const T = { check: () => {}, message: '' }
    const R = TypeGuard.IsRefinement(T)
    Assert.IsTrue(R)
  })
  it('Should guard for Refinement 2', () => {
    const T = { check: () => {} }
    const R = TypeGuard.IsRefinement(T)
    Assert.IsFalse(R)
  })
  it('Should guard for Refinement 3', () => {
    const T = { message: '' }
    const R = TypeGuard.IsRefinement(T)
    Assert.IsFalse(R)
  })
})
