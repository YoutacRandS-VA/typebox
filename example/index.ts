import { Type, TSchema, Static, StaticDecode, TypeGuard } from '@sinclair/typebox'
import { Value, ValueError, ValueErrorType, TransformDecodeError } from '@sinclair/typebox/value'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Kind, TypeRegistry, FormatRegistry } from '@sinclair/typebox'

const UnsafeByte = Type.Unsafe<number>({ type: 'byte' })

const Byte = Type.Refine(UnsafeByte)
  .Check((value) => typeof value === 'number', { message: 'Expected number' })
  .Check((value) => !isNaN(value), { message: 'Expected non NaN number' })
  .Check((value) => value >= 0, { message: 'Must be greater than 0' })
  .Check((value) => value < 256, { message: 'Must be less than 256' })
  .Done()

const A = Type.Array(Byte)
console.log(Value.Errors(A, [0, 2, 3, 10000]).Take(10))

// Todo: Error Tests
// Todo: Investigate Error Propogation for Refinements
