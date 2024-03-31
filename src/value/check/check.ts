/*--------------------------------------------------------------------------

@sinclair/typebox/value

The MIT License (MIT)

Copyright (c) 2017-2024 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

import { TypeSystemPolicy } from '../../system/index'
import { Deref } from '../deref/index'
import { Hash } from '../hash/index'
import { Kind, RefineKind } from '../../type/symbols/index'
import { KeyOfPattern } from '../../type/keyof/index'
import { ExtendsUndefinedCheck } from '../../type/extends/index'
import { TypeRegistry, FormatRegistry } from '../../type/registry/index'
import { IsRefine } from '../../type/guard/type'

import type { TSchema } from '../../type/schema/index'
import type { TAsyncIterator } from '../../type/async-iterator/index'
import type { TAny } from '../../type/any/index'
import type { TArray } from '../../type/array/index'
import type { TBigInt } from '../../type/bigint/index'
import type { TBoolean } from '../../type/boolean/index'
import type { TDate } from '../../type/date/index'
import type { TConstructor } from '../../type/constructor/index'
import type { TFunction } from '../../type/function/index'
import type { TInteger } from '../../type/integer/index'
import type { TIntersect } from '../../type/intersect/index'
import type { TIterator } from '../../type/iterator/index'
import type { TLiteral } from '../../type/literal/index'
import { Never, type TNever } from '../../type/never/index'
import type { TNot } from '../../type/not/index'
import type { TNull } from '../../type/null/index'
import type { TNumber } from '../../type/number/index'
import type { TObject } from '../../type/object/index'
import type { TPromise } from '../../type/promise/index'
import type { TRecord } from '../../type/record/index'
import type { TRef } from '../../type/ref/index'
import type { Refinement } from '../../type/refine/index'
import type { TRegExp } from '../../type/regexp/index'
import type { TTemplateLiteral } from '../../type/template-literal/index'
import type { TThis } from '../../type/recursive/index'
import type { TTuple } from '../../type/tuple/index'
import type { TUnion } from '../../type/union/index'
import type { TUnknown } from '../../type/unknown/index'
import type { Static } from '../../type/static/index'
import type { TString } from '../../type/string/index'
import type { TSymbol } from '../../type/symbol/index'
import type { TUndefined } from '../../type/undefined/index'
import type { TUint8Array } from '../../type/uint8array/index'
import type { TVoid } from '../../type/void/index'

// ------------------------------------------------------------------
// ValueGuard
// ------------------------------------------------------------------
import { IsArray, IsUint8Array, IsDate, IsPromise, IsFunction, IsAsyncIterator, IsIterator, IsBoolean, IsNumber, IsBigInt, IsString, IsSymbol, IsInteger, IsNull, IsUndefined } from '../guard/index'
// ------------------------------------------------------------------
// TypeGuard
// ------------------------------------------------------------------
import { IsSchema } from '../../type/guard/type'
// ------------------------------------------------------------------
// TypeGuards
// ------------------------------------------------------------------
function IsAnyOrUnknown(schema: TSchema) {
  return schema[Kind] === 'Any' || schema[Kind] === 'Unknown'
}
// ------------------------------------------------------------------
// Guards
// ------------------------------------------------------------------
function IsDefined<T>(value: unknown): value is T {
  return value !== undefined
}
// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
function FromAny(schema: TAny, references: TSchema[], value: any): boolean {
  return true
}
function FromArray(schema: TArray, references: TSchema[], value: any): boolean {
  if (!IsArray(value)) return false
  if (IsDefined<number>(schema.minItems) && !(value.length >= schema.minItems)) {
    return false
  }
  if (IsDefined<number>(schema.maxItems) && !(value.length <= schema.maxItems)) {
    return false
  }
  if (!value.every((value) => Visit(schema.items, references, value))) {
    return false
  }
  // prettier-ignore
  if (schema.uniqueItems === true && !((function() { const set = new Set(); for(const element of value) { const hashed = Hash(element); if(set.has(hashed)) { return false } else { set.add(hashed) } } return true })())) {
      return false
    }
  // contains
  if (!(IsDefined(schema.contains) || IsNumber(schema.minContains) || IsNumber(schema.maxContains))) {
    return true // exit
  }
  const containsSchema = IsDefined<TSchema>(schema.contains) ? schema.contains : Never()
  const containsCount = value.reduce((acc: number, value) => (Visit(containsSchema, references, value) ? acc + 1 : acc), 0)
  if (containsCount === 0) {
    return false
  }
  if (IsNumber(schema.minContains) && containsCount < schema.minContains) {
    return false
  }
  if (IsNumber(schema.maxContains) && containsCount > schema.maxContains) {
    return false
  }
  return true
}
function FromAsyncIterator(schema: TAsyncIterator, references: TSchema[], value: any): boolean {
  return IsAsyncIterator(value)
}
function FromBigInt(schema: TBigInt, references: TSchema[], value: any): boolean {
  if (!IsBigInt(value)) return false
  if (IsDefined<bigint>(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false
  }
  if (IsDefined<bigint>(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false
  }
  if (IsDefined<bigint>(schema.maximum) && !(value <= schema.maximum)) {
    return false
  }
  if (IsDefined<bigint>(schema.minimum) && !(value >= schema.minimum)) {
    return false
  }
  if (IsDefined<bigint>(schema.multipleOf) && !(value % schema.multipleOf === BigInt(0))) {
    return false
  }
  return true
}
function FromBoolean(schema: TBoolean, references: TSchema[], value: any): boolean {
  return IsBoolean(value)
}
function FromConstructor(schema: TConstructor, references: TSchema[], value: any): boolean {
  return Visit(schema.returns, references, value.prototype)
}
function FromDate(schema: TDate, references: TSchema[], value: any): boolean {
  if (!IsDate(value)) return false
  if (IsDefined<number>(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
    return false
  }
  if (IsDefined<number>(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
    return false
  }
  if (IsDefined<number>(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
    return false
  }
  if (IsDefined<number>(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
    return false
  }
  if (IsDefined<number>(schema.multipleOfTimestamp) && !(value.getTime() % schema.multipleOfTimestamp === 0)) {
    return false
  }
  return true
}
function FromFunction(schema: TFunction, references: TSchema[], value: any): boolean {
  return IsFunction(value)
}
function FromInteger(schema: TInteger, references: TSchema[], value: any): boolean {
  if (!IsInteger(value)) {
    return false
  }
  if (IsDefined<number>(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false
  }
  if (IsDefined<number>(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false
  }
  if (IsDefined<number>(schema.maximum) && !(value <= schema.maximum)) {
    return false
  }
  if (IsDefined<number>(schema.minimum) && !(value >= schema.minimum)) {
    return false
  }
  if (IsDefined<number>(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    return false
  }
  return true
}
function FromIntersect(schema: TIntersect, references: TSchema[], value: any): boolean {
  const check1 = schema.allOf.every((schema) => Visit(schema, references, value))
  if (schema.unevaluatedProperties === false) {
    const keyPattern = new RegExp(KeyOfPattern(schema))
    const check2 = Object.getOwnPropertyNames(value).every((key) => keyPattern.test(key))
    return check1 && check2
  } else if (IsSchema(schema.unevaluatedProperties)) {
    const keyCheck = new RegExp(KeyOfPattern(schema))
    const check2 = Object.getOwnPropertyNames(value).every((key) => keyCheck.test(key) || Visit(schema.unevaluatedProperties as TSchema, references, value[key]))
    return check1 && check2
  } else {
    return check1
  }
}
function FromIterator(schema: TIterator, references: TSchema[], value: any): boolean {
  return IsIterator(value)
}
function FromLiteral(schema: TLiteral, references: TSchema[], value: any): boolean {
  return value === schema.const
}
function FromNever(schema: TNever, references: TSchema[], value: any): boolean {
  return false
}
function FromNot(schema: TNot, references: TSchema[], value: any): boolean {
  return !Visit(schema.not, references, value)
}
function FromNull(schema: TNull, references: TSchema[], value: any): boolean {
  return IsNull(value)
}
function FromNumber(schema: TNumber, references: TSchema[], value: any): boolean {
  if (!TypeSystemPolicy.IsNumberLike(value)) return false
  if (IsDefined<number>(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false
  }
  if (IsDefined<number>(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false
  }
  if (IsDefined<number>(schema.minimum) && !(value >= schema.minimum)) {
    return false
  }
  if (IsDefined<number>(schema.maximum) && !(value <= schema.maximum)) {
    return false
  }
  if (IsDefined<number>(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    return false
  }
  return true
}
function FromObject(schema: TObject, references: TSchema[], value: any): boolean {
  if (!TypeSystemPolicy.IsObjectLike(value)) return false
  if (IsDefined<number>(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    return false
  }
  if (IsDefined<number>(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    return false
  }
  const knownKeys = Object.getOwnPropertyNames(schema.properties)
  for (const knownKey of knownKeys) {
    const property = schema.properties[knownKey]
    if (schema.required && schema.required.includes(knownKey)) {
      if (!Visit(property, references, value[knownKey])) {
        return false
      }
      if ((ExtendsUndefinedCheck(property) || IsAnyOrUnknown(property)) && !(knownKey in value)) {
        return false
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value, knownKey) && !Visit(property, references, value[knownKey])) {
        return false
      }
    }
  }
  if (schema.additionalProperties === false) {
    const valueKeys = Object.getOwnPropertyNames(value)
    // optimization: value is valid if schemaKey length matches the valueKey length
    if (schema.required && schema.required.length === knownKeys.length && valueKeys.length === knownKeys.length) {
      return true
    } else {
      return valueKeys.every((valueKey) => knownKeys.includes(valueKey))
    }
  } else if (typeof schema.additionalProperties === 'object') {
    const valueKeys = Object.getOwnPropertyNames(value)
    return valueKeys.every((key) => knownKeys.includes(key) || Visit(schema.additionalProperties as TSchema, references, value[key]))
  } else {
    return true
  }
}
function FromPromise(schema: TPromise, references: TSchema[], value: any): boolean {
  return IsPromise(value)
}
function FromRecord(schema: TRecord, references: TSchema[], value: any): boolean {
  if (!TypeSystemPolicy.IsRecordLike(value)) {
    return false
  }
  if (IsDefined<number>(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    return false
  }
  if (IsDefined<number>(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    return false
  }
  const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0]
  const regex = new RegExp(patternKey)
  // prettier-ignore
  const check1 = Object.entries(value).every(([key, value]) => {
    return (regex.test(key)) ? Visit(patternSchema, references, value) : true
  })
  // prettier-ignore
  const check2 = typeof schema.additionalProperties === 'object' ? Object.entries(value).every(([key, value]) => {
    return (!regex.test(key)) ? Visit(schema.additionalProperties as TSchema, references, value) : true
  }) : true
  const check3 =
    schema.additionalProperties === false
      ? Object.getOwnPropertyNames(value).every((key) => {
          return regex.test(key)
        })
      : true
  return check1 && check2 && check3
}
function FromRef(schema: TRef, references: TSchema[], value: any): boolean {
  return Visit(Deref(schema, references), references, value)
}
function FromRegExp(schema: TRegExp, references: TSchema[], value: any): boolean {
  const regex = new RegExp(schema.source, schema.flags)
  if (IsDefined<number>(schema.minLength)) {
    if (!(value.length >= schema.minLength)) return false
  }
  if (IsDefined<number>(schema.maxLength)) {
    if (!(value.length <= schema.maxLength)) return false
  }
  return regex.test(value)
}
function FromString(schema: TString, references: TSchema[], value: any): boolean {
  if (!IsString(value)) {
    return false
  }
  if (IsDefined<number>(schema.minLength)) {
    if (!(value.length >= schema.minLength)) return false
  }
  if (IsDefined<number>(schema.maxLength)) {
    if (!(value.length <= schema.maxLength)) return false
  }
  if (IsDefined<string>(schema.pattern)) {
    const regex = new RegExp(schema.pattern)
    if (!regex.test(value)) return false
  }
  if (IsDefined<string>(schema.format)) {
    const formatFunc = FormatRegistry.Get(schema.format)
    if (IsUndefined(formatFunc) || !formatFunc(value)) return false
  }
  return true
}
function FromSymbol(schema: TSymbol, references: TSchema[], value: any): boolean {
  return IsSymbol(value)
}
function FromTemplateLiteral(schema: TTemplateLiteral, references: TSchema[], value: any): boolean {
  return IsString(value) && new RegExp(schema.pattern).test(value)
}
function FromThis(schema: TThis, references: TSchema[], value: any): boolean {
  return Visit(Deref(schema, references), references, value)
}
function FromTuple(schema: TTuple<any[]>, references: TSchema[], value: any): boolean {
  if (!IsArray(value)) {
    return false
  }
  if (schema.items === undefined && !(value.length === 0)) {
    return false
  }
  if (!(value.length === schema.maxItems)) {
    return false
  }
  if (!schema.items) {
    return true
  }
  for (let i = 0; i < schema.items.length; i++) {
    if (!Visit(schema.items[i], references, value[i])) return false
  }
  return true
}
function FromUndefined(schema: TUndefined, references: TSchema[], value: any): boolean {
  return IsUndefined(value)
}
function FromUnion(schema: TUnion, references: TSchema[], value: any): boolean {
  return schema.anyOf.some((inner) => Visit(inner, references, value))
}
function FromUint8Array(schema: TUint8Array, references: TSchema[], value: any): boolean {
  if (!IsUint8Array(value)) {
    return false
  }
  if (IsDefined<number>(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
    return false
  }
  if (IsDefined<number>(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
    return false
  }
  return true
}
function FromUnknown(schema: TUnknown, references: TSchema[], value: any): boolean {
  return true
}
function FromUnsafe(schema: TUnknown, references: TSchema[], value: any): boolean {
  return true
}
function FromVoid(schema: TVoid, references: TSchema[], value: any): boolean {
  return TypeSystemPolicy.IsVoidLike(value)
}
function FromKind(schema: TSchema, references: TSchema[], value: unknown): boolean {
  if (!TypeRegistry.Has(schema[Kind])) return false
  const func = TypeRegistry.Get(schema[Kind])!
  return func(schema, value)
}
function FromRefine(schema: { [RefineKind]: Refinement[] }, references: TSchema[], value: string): boolean {
  const refinements = schema[RefineKind]
  return refinements.every((refinement) => refinement.check(value))
}
function Visit<T extends TSchema>(schema: T, references: TSchema[], value: any): boolean {
  const references_ = IsDefined<string>(schema.$id) ? [...references, schema] : references
  const schema_ = schema as any
  // --------------------------------------------------------------
  // Types
  // --------------------------------------------------------------
  const kind = schema_[Kind]
  // prettier-ignore
  const typeCheck = (
    kind === 'Any' ? FromAny(schema_, references_, value) :
    kind === 'Array' ? FromArray(schema_, references_, value) :
    kind === 'AsyncIterator' ? FromAsyncIterator(schema_, references_, value) :
    kind === 'BigInt' ? FromBigInt(schema_, references_, value) :
    kind === 'Boolean' ? FromBoolean(schema_, references_, value) :
    kind === 'Constructor'? FromConstructor(schema_, references_, value) :
    kind === 'Date' ? FromDate(schema_, references_, value) :
    kind === 'Function' ? FromFunction(schema_, references_, value) :
    kind === 'Integer' ? FromInteger(schema_, references_, value) :
    kind === 'Intersect' ? FromIntersect(schema_, references_, value) :
    kind === 'Iterator' ? FromIterator(schema_, references_, value) :
    kind === 'Literal' ? FromLiteral(schema_, references_, value) :
    kind === 'Never' ? FromNever(schema_, references_, value) :
    kind === 'Not' ? FromNot(schema_, references_, value) :
    kind === 'Null' ? FromNull(schema_, references_, value) :
    kind === 'Number' ? FromNumber(schema_, references_, value) :
    kind === 'Object' ? FromObject(schema_, references_, value) :
    kind === 'Promise' ? FromPromise(schema_, references_, value) :
    kind === 'Record' ? FromRecord(schema_, references_, value) :
    kind === 'Ref' ? FromRef(schema_, references_, value) :
    kind === 'RegExp' ? FromRegExp(schema_, references_, value) :
    kind === 'String' ? FromString(schema_, references_, value) :
    kind === 'Symbol' ? FromSymbol(schema_, references_, value) :
    kind === 'TemplateLiteral' ? FromTemplateLiteral(schema_, references_, value) :
    kind === 'This' ? FromThis(schema_, references_, value) :
    kind === 'Tuple' ? FromTuple(schema_, references_, value) :
    kind === 'Undefined' ? FromUndefined(schema_, references_, value) :
    kind === 'Union' ? FromUnion(schema_, references_, value) :
    kind === 'Uint8Array' ? FromUint8Array(schema_, references_, value) :
    kind === 'Unknown' ? FromUnknown(schema_, references_, value) :
    kind === 'Unsafe' ? FromUnsafe(schema_, references_, value) :
    kind === 'Void' ? FromVoid(schema_, references_, value) :
    TypeRegistry.Has(kind) ? FromKind(schema_, references_, value) :
    false
  )
  // --------------------------------------------------------------
  // Refinement
  // --------------------------------------------------------------
  // prettier-ignore
  return typeCheck && IsRefine(schema_) 
    ? FromRefine(schema_, references_, value) 
    : typeCheck
}
// --------------------------------------------------------------------------
// Check
// --------------------------------------------------------------------------
/** Returns true if the value matches the given type. */
export function Check<T extends TSchema>(schema: T, references: TSchema[], value: unknown): value is Static<T>
/** Returns true if the value matches the given type. */
export function Check<T extends TSchema>(schema: T, value: unknown): value is Static<T>
/** Returns true if the value matches the given type. */
export function Check(...args: any[]) {
  return args.length === 3 ? Visit(args[0], args[1], args[2]) : Visit(args[0], [], args[1])
}
