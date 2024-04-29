import { Type, TSchema, Static, StaticDecode, TypeGuard } from '@sinclair/typebox'
import { Value, ValueError, ValueErrorType, TransformDecodeError } from '@sinclair/typebox/value'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Kind, TypeRegistry, FormatRegistry } from '@sinclair/typebox'

const UnsafeByte = Type.Unsafe<number>({ type: 'byte' })

const Byte = Type.Refine(UnsafeByte)
  .Check((value) => typeof value === 'number')
  .Check((value) => !isNaN(value), { message: 'Must not be NaN', x: 100 })
  .Check((value) => value >= 0, { message: 'Must be greater than 0' })
  .Check((value) => value < 256, { message: 'Must be something' })
  .Done()

const A = Type.Object({
  x: Byte,
  y: Byte,
  z: Byte,
})

console.dir(A, { depth: 100 })
console.log(TypeCompiler.Code(A))
console.log(Value.Errors(Byte, 'asdsa').Take(10))

// Todo: Error Tests
// Todo: Investigate Error Propogation for Refinements
