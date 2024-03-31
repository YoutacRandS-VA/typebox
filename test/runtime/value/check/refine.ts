import { Value } from '@sinclair/typebox/value'
import { Type } from '@sinclair/typebox'
import { Assert } from '../../assert/index'

describe('value/check/Refine', () => {
  it('Should should refine a Number', () => {
    const T = Type.Refine(Type.Number())
      .Check((value) => value === 42)
      .Done()
    Assert.IsTrue(Value.Check(T, 42))
    Assert.IsFalse(Value.Check(T, 0))
  })
  it('Should should refine a Object', () => {
    const T = Type.Refine(
      Type.Object({
        x: Type.Number(),
        y: Type.Number(),
      }),
    )
      .Check((value) => value.x === value.y)
      .Done()
    Assert.IsTrue(Value.Check(T, { x: 0, y: 0 }))
    Assert.IsFalse(Value.Check(T, { x: 0, y: 1 }))
  })
  it('Should should refine Nested 1', () => {
    const R = Type.Refine(Type.Number())
      .Check((value) => value === 42)
      .Done()
    const T = Type.Array(R)
    Assert.IsTrue(Value.Check(T, [42, 42, 42, 42]))
    Assert.IsFalse(Value.Check(T, [42, 42, 42, 0]))
  })
  it('Should should refine Nested 2', () => {
    const R = Type.Refine(Type.Number())
      .Check((value) => value === 42)
      .Done()
    const T = Type.Object({ x: R })
    Assert.IsTrue(Value.Check(T, { x: 42 }))
    Assert.IsFalse(Value.Check(T, { x: 0 }))
  })
})
