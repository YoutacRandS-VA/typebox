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

console.log(Value.Check(Byte, 0)) // false
console.log(Value.Check(Byte, 255)) // false
console.log(Value.Check(Byte, -1)) // true
console.log(Value.Check(Byte, NaN)) // true

// Todo: Error Tests
// Todo: Investigate Error Propogation for Refinements
