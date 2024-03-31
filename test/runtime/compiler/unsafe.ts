import { Type } from '@sinclair/typebox'
import { Ok } from './validate'

describe('compiler/Unsafe', () => {
  it('Should validate number', () => {
    const T = Type.Unsafe()
    Ok(T, 1)
  })
  it('Should validate string', () => {
    const T = Type.Unsafe()
    Ok(T, 'hello')
  })
  it('Should validate boolean', () => {
    const T = Type.Unsafe()
    Ok(T, true)
  })
  it('Should validate array', () => {
    const T = Type.Unsafe()
    Ok(T, [1, 2, 3])
  })
  it('Should validate object', () => {
    const T = Type.Unsafe()
    Ok(T, { a: 1, b: 2 })
  })
  it('Should validate null', () => {
    const T = Type.Unsafe()
    Ok(T, null)
  })
  it('Should validate undefined', () => {
    const T = Type.Unsafe()
    Ok(T, undefined)
  })
})
