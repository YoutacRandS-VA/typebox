import { Type, TSchema, Static, StaticDecode, TypeGuard } from '@sinclair/typebox'
import { Value, ValueError, ValueErrorType, TransformDecodeError } from '@sinclair/typebox/value'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Kind, TypeRegistry, FormatRegistry } from '@sinclair/typebox'

const UnsafeByte = Type.Unsafe<number>({ type: 'byte' })

const Byte = Type.Refine(UnsafeByte)
  .Check((value) => typeof value === 'number')
  .Check((value) => !isNaN(value))
  .Check((value) => value >= 0)
  .Check((value) => value < 256)
  .Done()

const A = Type.Object({
  x: Byte,
  y: Byte,
  z: Byte,
})

console.log(Byte)
console.log(TypeCompiler.Code(A))
console.log(Value.Check(A, { x: 0, y: 0, z: 0 }))
console.log(Value.Check(Byte, 255))
console.log(Value.Check(Byte, -1))
console.log(Value.Check(Byte, NaN))

// Todo: Error Tests
// Todo: Investigate Error Propogation for Refinements
