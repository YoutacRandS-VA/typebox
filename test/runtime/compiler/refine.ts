import { Type } from '@sinclair/typebox'
import { Ok, Fail } from './validate'

describe('compiler/Refine', () => {
  it('Should should refine a Number', () => {
    const T = Type.Refine(Type.Number())
      .Check((value) => value === 42)
      .Done()
    Ok(T, 42)
    Fail(T, 0)
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
    Ok(T, { x: 1, y: 1 })
    Fail(T, { x: 1, y: 2 })
  })
  it('Should should refine Nested 1', () => {
    const R = Type.Refine(Type.Number())
      .Check((value) => value === 42)
      .Done()
    const T = Type.Array(R)
    Ok(T, [42, 42, 42, 42])
    Fail(T, [42, 42, 42, 0])
  })
  it('Should should refine Nested 2', () => {
    const R = Type.Refine(Type.Number())
      .Check((value) => value === 42)
      .Done()
    const T = Type.Object({ x: R })
    Ok(T, { x: 42 })
    Fail(T, { x: 0 })
  })
})
