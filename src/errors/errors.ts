/*--------------------------------------------------------------------------

@sinclair/typebox/errors

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

import { TypeSystemPolicy } from '../system/index'
import { KeyOfPattern } from '../type/keyof/index'
import { TypeRegistry, FormatRegistry } from '../type/registry/index'
import { ExtendsUndefinedCheck } from '../type/extends/extends-undefined'
import { GetErrorFunction } from './function'
import { Deref } from '../value/deref/index'
import { Hash } from '../value/hash/index'
import { Kind, RefineKind } from '../type/symbols/index'

import type { TSchema } from '../type/schema/index'
import type { TAsyncIterator } from '../type/async-iterator/index'
import type { TAny } from '../type/any/index'
import type { TArray } from '../type/array/index'
import type { TBigInt } from '../type/bigint/index'
import type { TBoolean } from '../type/boolean/index'
import type { TDate } from '../type/date/index'
import type { TConstructor } from '../type/constructor/index'
import type { TFunction } from '../type/function/index'
import type { TInteger } from '../type/integer/index'
import type { TIntersect } from '../type/intersect/index'
import type { TIterator } from '../type/iterator/index'
import type { TLiteral } from '../type/literal/index'
import { Never, type TNever } from '../type/never/index'
import type { TNot } from '../type/not/index'
import type { TNull } from '../type/null/index'
import type { TNumber } from '../type/number/index'
import type { TObject } from '../type/object/index'
import type { TPromise } from '../type/promise/index'
import type { TRecord } from '../type/record/index'
import type { TRef } from '../type/ref/index'
import type { Refinement } from '../type/refine/index'
import type { TRegExp } from '../type/regexp/index'
import type { TTemplateLiteral } from '../type/template-literal/index'
import type { TThis } from '../type/recursive/index'
import type { TTuple } from '../type/tuple/index'
import type { TUnion } from '../type/union/index'
import type { TUnknown } from '../type/unknown/index'
import type { TUnsafe } from '../type/unsafe/index'
import type { TString } from '../type/string/index'
import type { TSymbol } from '../type/symbol/index'
import type { TUndefined } from '../type/undefined/index'
import type { TUint8Array } from '../type/uint8array/index'
import type { TVoid } from '../type/void/index'
// ------------------------------------------------------------------
// ValueGuard
// ------------------------------------------------------------------
import { IsArray, IsUint8Array, IsDate, IsPromise, IsFunction, IsAsyncIterator, IsIterator, IsBoolean, IsNumber, IsBigInt, IsString, IsSymbol, IsInteger, IsNull, IsUndefined, HasPropertyKey } from '../value/guard/index'
// ------------------------------------------------------------------
// ValueGuard
// ------------------------------------------------------------------
import { IsRefine } from '../type/guard/type'
// ------------------------------------------------------------------
// ValueErrorType
// ------------------------------------------------------------------
export enum ValueErrorType {
  ArrayContains,
  ArrayMaxContains,
  ArrayMaxItems,
  ArrayMinContains,
  ArrayMinItems,
  ArrayUniqueItems,
  Array,
  AsyncIterator,
  BigIntExclusiveMaximum,
  BigIntExclusiveMinimum,
  BigIntMaximum,
  BigIntMinimum,
  BigIntMultipleOf,
  BigInt,
  Boolean,
  DateExclusiveMaximumTimestamp,
  DateExclusiveMinimumTimestamp,
  DateMaximumTimestamp,
  DateMinimumTimestamp,
  DateMultipleOfTimestamp,
  Date,
  Function,
  IntegerExclusiveMaximum,
  IntegerExclusiveMinimum,
  IntegerMaximum,
  IntegerMinimum,
  IntegerMultipleOf,
  Integer,
  IntersectUnevaluatedProperties,
  Intersect,
  Iterator,
  KindProperty,
  KindNotFound,
  Kind,
  Literal,
  Never,
  Not,
  Null,
  NumberExclusiveMaximum,
  NumberExclusiveMinimum,
  NumberMaximum,
  NumberMinimum,
  NumberMultipleOf,
  Number,
  ObjectAdditionalProperties,
  ObjectMaxProperties,
  ObjectMinProperties,
  ObjectRequiredProperty,
  Object,
  Promise,
  RegExp,
  Refinement,
  StringFormatNotFound,
  StringFormat,
  StringMaxLength,
  StringMinLength,
  StringPattern,
  String,
  Symbol,
  TupleLength,
  Tuple,
  Uint8ArrayMaxByteLength,
  Uint8ArrayMinByteLength,
  Uint8Array,
  Undefined,
  Union,
  Void,
}
// ------------------------------------------------------------------
// ValueError
// ------------------------------------------------------------------
export interface ValueError {
  type: ValueErrorType
  schema: TSchema
  path: string
  value: unknown
  message: string
}
// ------------------------------------------------------------------
// EscapeKey
// ------------------------------------------------------------------
function EscapeKey(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1') // RFC6901 Path
}
// ------------------------------------------------------------------
// Guards
// ------------------------------------------------------------------
function IsDefined<T>(value: unknown): value is T {
  return value !== undefined
}
// ------------------------------------------------------------------
// ValueErrorIterator
// ------------------------------------------------------------------
export class ValueErrorIterator {
  constructor(private readonly iterator: IterableIterator<ValueError>) {}
  public [Symbol.iterator]() {
    return this.iterator
  }
  /** Returns the first value error or undefined if no errors */
  public First(): ValueError | undefined {
    const next = this.iterator.next()
    return next.done ? undefined : next.value
  }
  /** Returns an array of errors up to the given count */
  public Take(count: number): ValueError[] {
    const errors: ValueError[] = []
    for (let i = 0; i < count; i++) {
      const next = this.iterator.next()
      if (next.done) break
      errors.push(next.value)
    }
    return errors
  }
}
// --------------------------------------------------------------------------
// Create
// --------------------------------------------------------------------------
function CreateRefinementError(schema: TSchema, refinement: Refinement, path: string, value: unknown): ValueError {
  return { type: ValueErrorType.Refinement, schema, path, value, message: refinement.message }
}
function CreateError(errorType: ValueErrorType, schema: TSchema, path: string, value: unknown): ValueError {
  return { type: errorType, schema, path, value, message: GetErrorFunction()({ errorType, path, schema, value }) }
}
// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------
function* FromAny(schema: TAny, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {}
function* FromArray(schema: TArray, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsArray(value)) {
    return yield CreateError(ValueErrorType.Array, schema, path, value)
  }
  if (IsDefined<number>(schema.minItems) && !(value.length >= schema.minItems)) {
    yield CreateError(ValueErrorType.ArrayMinItems, schema, path, value)
  }
  if (IsDefined<number>(schema.maxItems) && !(value.length <= schema.maxItems)) {
    yield CreateError(ValueErrorType.ArrayMaxItems, schema, path, value)
  }
  for (let i = 0; i < value.length; i++) {
    yield* Visit(schema.items, references, `${path}/${i}`, value[i])
  }
  // prettier-ignore
  if (schema.uniqueItems === true && !((function () { const set = new Set(); for (const element of value) { const hashed = Hash(element); if (set.has(hashed)) { return false } else { set.add(hashed) } } return true })())) {
    yield CreateError(ValueErrorType.ArrayUniqueItems, schema, path, value)
  }
  // contains
  if (!(IsDefined(schema.contains) || IsDefined(schema.minContains) || IsDefined(schema.maxContains))) {
    return
  }
  const containsSchema = IsDefined<TSchema>(schema.contains) ? schema.contains : Never()
  const containsCount = value.reduce((acc: number, value, index) => (Visit(containsSchema, references, `${path}${index}`, value).next().done === true ? acc + 1 : acc), 0)
  if (containsCount === 0) {
    yield CreateError(ValueErrorType.ArrayContains, schema, path, value)
  }
  if (IsNumber(schema.minContains) && containsCount < schema.minContains) {
    yield CreateError(ValueErrorType.ArrayMinContains, schema, path, value)
  }
  if (IsNumber(schema.maxContains) && containsCount > schema.maxContains) {
    yield CreateError(ValueErrorType.ArrayMaxContains, schema, path, value)
  }
}
function* FromAsyncIterator(schema: TAsyncIterator, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsAsyncIterator(value)) yield CreateError(ValueErrorType.AsyncIterator, schema, path, value)
}
function* FromBigInt(schema: TBigInt, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsBigInt(value)) return yield CreateError(ValueErrorType.BigInt, schema, path, value)
  if (IsDefined<bigint>(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield CreateError(ValueErrorType.BigIntExclusiveMaximum, schema, path, value)
  }
  if (IsDefined<bigint>(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield CreateError(ValueErrorType.BigIntExclusiveMinimum, schema, path, value)
  }
  if (IsDefined<bigint>(schema.maximum) && !(value <= schema.maximum)) {
    yield CreateError(ValueErrorType.BigIntMaximum, schema, path, value)
  }
  if (IsDefined<bigint>(schema.minimum) && !(value >= schema.minimum)) {
    yield CreateError(ValueErrorType.BigIntMinimum, schema, path, value)
  }
  if (IsDefined<bigint>(schema.multipleOf) && !(value % schema.multipleOf === BigInt(0))) {
    yield CreateError(ValueErrorType.BigIntMultipleOf, schema, path, value)
  }
}
function* FromBoolean(schema: TBoolean, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsBoolean(value)) yield CreateError(ValueErrorType.Boolean, schema, path, value)
}
function* FromConstructor(schema: TConstructor, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  yield* Visit(schema.returns, references, path, value.prototype)
}
function* FromDate(schema: TDate, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsDate(value)) return yield CreateError(ValueErrorType.Date, schema, path, value)
  if (IsDefined<number>(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
    yield CreateError(ValueErrorType.DateExclusiveMaximumTimestamp, schema, path, value)
  }
  if (IsDefined<number>(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
    yield CreateError(ValueErrorType.DateExclusiveMinimumTimestamp, schema, path, value)
  }
  if (IsDefined<number>(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
    yield CreateError(ValueErrorType.DateMaximumTimestamp, schema, path, value)
  }
  if (IsDefined<number>(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
    yield CreateError(ValueErrorType.DateMinimumTimestamp, schema, path, value)
  }
  if (IsDefined<number>(schema.multipleOfTimestamp) && !(value.getTime() % schema.multipleOfTimestamp === 0)) {
    yield CreateError(ValueErrorType.DateMultipleOfTimestamp, schema, path, value)
  }
}
function* FromFunction(schema: TFunction, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsFunction(value)) yield CreateError(ValueErrorType.Function, schema, path, value)
}
function* FromInteger(schema: TInteger, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsInteger(value)) return yield CreateError(ValueErrorType.Integer, schema, path, value)
  if (IsDefined<number>(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield CreateError(ValueErrorType.IntegerExclusiveMaximum, schema, path, value)
  }
  if (IsDefined<number>(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield CreateError(ValueErrorType.IntegerExclusiveMinimum, schema, path, value)
  }
  if (IsDefined<number>(schema.maximum) && !(value <= schema.maximum)) {
    yield CreateError(ValueErrorType.IntegerMaximum, schema, path, value)
  }
  if (IsDefined<number>(schema.minimum) && !(value >= schema.minimum)) {
    yield CreateError(ValueErrorType.IntegerMinimum, schema, path, value)
  }
  if (IsDefined<number>(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    yield CreateError(ValueErrorType.IntegerMultipleOf, schema, path, value)
  }
}
function* FromIntersect(schema: TIntersect, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  for (const inner of schema.allOf) {
    const next = Visit(inner, references, path, value).next()
    if (!next.done) {
      yield CreateError(ValueErrorType.Intersect, schema, path, value)
      yield next.value
    }
  }
  if (schema.unevaluatedProperties === false) {
    const keyCheck = new RegExp(KeyOfPattern(schema))
    for (const valueKey of Object.getOwnPropertyNames(value)) {
      if (!keyCheck.test(valueKey)) {
        yield CreateError(ValueErrorType.IntersectUnevaluatedProperties, schema, `${path}/${valueKey}`, value)
      }
    }
  }
  if (typeof schema.unevaluatedProperties === 'object') {
    const keyCheck = new RegExp(KeyOfPattern(schema))
    for (const valueKey of Object.getOwnPropertyNames(value)) {
      if (!keyCheck.test(valueKey)) {
        const next = Visit(schema.unevaluatedProperties, references, `${path}/${valueKey}`, value[valueKey]).next()
        if (!next.done) yield next.value // yield interior
      }
    }
  }
}
function* FromIterator(schema: TIterator, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsIterator(value)) yield CreateError(ValueErrorType.Iterator, schema, path, value)
}
function* FromLiteral(schema: TLiteral, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!(value === schema.const)) yield CreateError(ValueErrorType.Literal, schema, path, value)
}
function* FromNever(schema: TNever, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  yield CreateError(ValueErrorType.Never, schema, path, value)
}
function* FromNot(schema: TNot, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (Visit(schema.not, references, path, value).next().done === true) yield CreateError(ValueErrorType.Not, schema, path, value)
}
function* FromNull(schema: TNull, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsNull(value)) yield CreateError(ValueErrorType.Null, schema, path, value)
}
function* FromNumber(schema: TNumber, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!TypeSystemPolicy.IsNumberLike(value)) return yield CreateError(ValueErrorType.Number, schema, path, value)
  if (IsDefined<number>(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield CreateError(ValueErrorType.NumberExclusiveMaximum, schema, path, value)
  }
  if (IsDefined<number>(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield CreateError(ValueErrorType.NumberExclusiveMinimum, schema, path, value)
  }
  if (IsDefined<number>(schema.maximum) && !(value <= schema.maximum)) {
    yield CreateError(ValueErrorType.NumberMaximum, schema, path, value)
  }
  if (IsDefined<number>(schema.minimum) && !(value >= schema.minimum)) {
    yield CreateError(ValueErrorType.NumberMinimum, schema, path, value)
  }
  if (IsDefined<number>(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    yield CreateError(ValueErrorType.NumberMultipleOf, schema, path, value)
  }
}
function* FromObject(schema: TObject, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!TypeSystemPolicy.IsObjectLike(value)) return yield CreateError(ValueErrorType.Object, schema, path, value)
  if (IsDefined<number>(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    yield CreateError(ValueErrorType.ObjectMinProperties, schema, path, value)
  }
  if (IsDefined<number>(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    yield CreateError(ValueErrorType.ObjectMaxProperties, schema, path, value)
  }
  const requiredKeys = Array.isArray(schema.required) ? schema.required : ([] as string[])
  const knownKeys = Object.getOwnPropertyNames(schema.properties)
  const unknownKeys = Object.getOwnPropertyNames(value)
  for (const requiredKey of requiredKeys) {
    if (unknownKeys.includes(requiredKey)) continue
    yield CreateError(ValueErrorType.ObjectRequiredProperty, schema.properties[requiredKey], `${path}/${EscapeKey(requiredKey)}`, undefined)
  }
  if (schema.additionalProperties === false) {
    for (const valueKey of unknownKeys) {
      if (!knownKeys.includes(valueKey)) {
        yield CreateError(ValueErrorType.ObjectAdditionalProperties, schema, `${path}/${EscapeKey(valueKey)}`, value[valueKey])
      }
    }
  }
  if (typeof schema.additionalProperties === 'object') {
    for (const valueKey of unknownKeys) {
      if (knownKeys.includes(valueKey)) continue
      yield* Visit(schema.additionalProperties as TSchema, references, `${path}/${EscapeKey(valueKey)}`, value[valueKey])
    }
  }
  for (const knownKey of knownKeys) {
    const property = schema.properties[knownKey]
    if (schema.required && schema.required.includes(knownKey)) {
      yield* Visit(property, references, `${path}/${EscapeKey(knownKey)}`, value[knownKey])
      if (ExtendsUndefinedCheck(schema) && !(knownKey in value)) {
        yield CreateError(ValueErrorType.ObjectRequiredProperty, property, `${path}/${EscapeKey(knownKey)}`, undefined)
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value, knownKey)) {
        yield* Visit(property, references, `${path}/${EscapeKey(knownKey)}`, value[knownKey])
      }
    }
  }
}
function* FromPromise(schema: TPromise, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsPromise(value)) yield CreateError(ValueErrorType.Promise, schema, path, value)
}
function* FromRecord(schema: TRecord, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!TypeSystemPolicy.IsRecordLike(value)) return yield CreateError(ValueErrorType.Object, schema, path, value)
  if (IsDefined<number>(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    yield CreateError(ValueErrorType.ObjectMinProperties, schema, path, value)
  }
  if (IsDefined<number>(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    yield CreateError(ValueErrorType.ObjectMaxProperties, schema, path, value)
  }
  const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0]
  const regex = new RegExp(patternKey)
  for (const [propertyKey, propertyValue] of Object.entries(value)) {
    if (regex.test(propertyKey)) yield* Visit(patternSchema, references, `${path}/${EscapeKey(propertyKey)}`, propertyValue)
  }
  if (typeof schema.additionalProperties === 'object') {
    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      if (!regex.test(propertyKey)) yield* Visit(schema.additionalProperties as TSchema, references, `${path}/${EscapeKey(propertyKey)}`, propertyValue)
    }
  }
  if (schema.additionalProperties === false) {
    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      if (regex.test(propertyKey)) continue
      return yield CreateError(ValueErrorType.ObjectAdditionalProperties, schema, `${path}/${EscapeKey(propertyKey)}`, propertyValue)
    }
  }
}
function* FromRef(schema: TRef, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  yield* Visit(Deref(schema, references), references, path, value)
}
function* FromRegExp(schema: TRegExp, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsString(value)) return yield CreateError(ValueErrorType.String, schema, path, value)
  if (IsDefined<number>(schema.minLength) && !(value.length >= schema.minLength)) {
    yield CreateError(ValueErrorType.StringMinLength, schema, path, value)
  }
  if (IsDefined<number>(schema.maxLength) && !(value.length <= schema.maxLength)) {
    yield CreateError(ValueErrorType.StringMaxLength, schema, path, value)
  }
  const regex = new RegExp(schema.source, schema.flags)
  if (!regex.test(value)) {
    return yield CreateError(ValueErrorType.RegExp, schema, path, value)
  }
}
function* FromString(schema: TString, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsString(value)) return yield CreateError(ValueErrorType.String, schema, path, value)
  if (IsDefined<number>(schema.minLength) && !(value.length >= schema.minLength)) {
    yield CreateError(ValueErrorType.StringMinLength, schema, path, value)
  }
  if (IsDefined<number>(schema.maxLength) && !(value.length <= schema.maxLength)) {
    yield CreateError(ValueErrorType.StringMaxLength, schema, path, value)
  }
  if (IsString(schema.pattern)) {
    const regex = new RegExp(schema.pattern)
    if (!regex.test(value)) {
      yield CreateError(ValueErrorType.StringPattern, schema, path, value)
    }
  }
  if (IsString(schema.format)) {
    if (!FormatRegistry.Has(schema.format)) {
      yield CreateError(ValueErrorType.StringFormatNotFound, schema, path, value)
    } else {
      const format = FormatRegistry.Get(schema.format)!
      if (!format(value)) {
        yield CreateError(ValueErrorType.StringFormat, schema, path, value)
      }
    }
  }
}
function* FromSymbol(schema: TSymbol, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsSymbol(value)) yield CreateError(ValueErrorType.Symbol, schema, path, value)
}
function* FromTemplateLiteral(schema: TTemplateLiteral, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsString(value)) return yield CreateError(ValueErrorType.String, schema, path, value)
  const regex = new RegExp(schema.pattern)
  if (!regex.test(value)) {
    yield CreateError(ValueErrorType.StringPattern, schema, path, value)
  }
}
function* FromThis(schema: TThis, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  yield* Visit(Deref(schema, references), references, path, value)
}
function* FromTuple(schema: TTuple<any[]>, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsArray(value)) return yield CreateError(ValueErrorType.Tuple, schema, path, value)
  if (schema.items === undefined && !(value.length === 0)) {
    return yield CreateError(ValueErrorType.TupleLength, schema, path, value)
  }
  if (!(value.length === schema.maxItems)) {
    return yield CreateError(ValueErrorType.TupleLength, schema, path, value)
  }
  if (!schema.items) {
    return
  }
  for (let i = 0; i < schema.items.length; i++) {
    yield* Visit(schema.items[i], references, `${path}/${i}`, value[i])
  }
}
function* FromUndefined(schema: TUndefined, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsUndefined(value)) yield CreateError(ValueErrorType.Undefined, schema, path, value)
}
function* FromUnion(schema: TUnion, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  let count = 0
  for (const subschema of schema.anyOf) {
    const errors = [...Visit(subschema, references, path, value)]
    if (errors.length === 0) return // matched
    count += errors.length
  }
  if (count > 0) {
    yield CreateError(ValueErrorType.Union, schema, path, value)
  }
}
function* FromUint8Array(schema: TUint8Array, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!IsUint8Array(value)) return yield CreateError(ValueErrorType.Uint8Array, schema, path, value)
  if (IsDefined<number>(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
    yield CreateError(ValueErrorType.Uint8ArrayMaxByteLength, schema, path, value)
  }
  if (IsDefined<number>(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
    yield CreateError(ValueErrorType.Uint8ArrayMinByteLength, schema, path, value)
  }
}
function* FromUnknown(schema: TUnknown, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {}
function* FromUnsafe(schema: TUnsafe, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {}
function* FromVoid(schema: TVoid, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!TypeSystemPolicy.IsVoidLike(value)) yield CreateError(ValueErrorType.Void, schema, path, value)
}
function* FromKind(schema: TSchema, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  if (!HasPropertyKey(schema, Kind)) return yield CreateError(ValueErrorType.KindProperty, schema, path, value)
  const check = TypeRegistry.Get(schema[Kind])
  if (IsUndefined(check)) return yield CreateError(ValueErrorType.KindNotFound, schema, path, value)
  if (!check(schema, value)) return yield CreateError(ValueErrorType.Kind, schema, path, value)
}
function* FromRefine(schema: TSchema & Record<PropertyKey, unknown> & { [RefineKind]: Refinement[] }, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  for (const refinement of schema[RefineKind]) {
    if (refinement.check(value)) continue
    // only generate one refinement error per type
    return yield CreateRefinementError(schema, refinement, path, value)
  }
}
function* Visit<T extends TSchema>(schema: T, references: TSchema[], path: string, value: any): IterableIterator<ValueError> {
  const references_ = IsDefined<string>(schema.$id) ? [...references, schema] : references
  const schema_ = schema as any
  // --------------------------------------------------------------
  // Types
  // --------------------------------------------------------------
  const kind = schema_[Kind]
  // prettier-ignore
  yield * (
    kind === 'Any' ? FromAny(schema_, references_, path, value) :
    kind === 'Array' ? FromArray(schema_, references_, path, value) :
    kind === 'AsyncIterator' ? FromAsyncIterator(schema_, references_, path, value) :
    kind === 'BigInt' ? FromBigInt(schema_, references_, path, value) :
    kind === 'Boolean' ? FromBoolean(schema_, references_, path, value) :
    kind === 'Constructor'? FromConstructor(schema_, references_, path, value) :
    kind === 'Date' ? FromDate(schema_, references_, path, value) :
    kind === 'Function' ? FromFunction(schema_, references_, path, value) :
    kind === 'Integer' ? FromInteger(schema_, references_, path, value) :
    kind === 'Intersect' ? FromIntersect(schema_, references_, path, value) :
    kind === 'Iterator' ? FromIterator(schema_, references_, path, value) :
    kind === 'Literal' ? FromLiteral(schema_, references_, path, value) :
    kind === 'Never' ? FromNever(schema_, references_, path, value) :
    kind === 'Not' ? FromNot(schema_, references_, path, value) :
    kind === 'Null' ? FromNull(schema_, references_, path, value) :
    kind === 'Number' ? FromNumber(schema_, references_, path, value) :
    kind === 'Object' ? FromObject(schema_, references_, path, value) :
    kind === 'Promise' ? FromPromise(schema_, references_, path, value) :
    kind === 'Record' ? FromRecord(schema_, references_, path, value) :
    kind === 'Ref' ? FromRef(schema_, references_, path, value) :
    kind === 'RegExp' ? FromRegExp(schema_, references_, path, value) :
    kind === 'String' ? FromString(schema_, references_, path, value) :
    kind === 'Symbol' ? FromSymbol(schema_, references_, path, value) :
    kind === 'TemplateLiteral' ? FromTemplateLiteral(schema_, references_, path, value) :
    kind === 'This' ? FromThis(schema_, references_, path, value) :
    kind === 'Tuple' ? FromTuple(schema_, references_, path, value) :
    kind === 'Undefined' ? FromUndefined(schema_, references_, path, value) :
    kind === 'Union' ? FromUnion(schema_, references_, path, value) :
    kind === 'Uint8Array' ? FromUint8Array(schema_, references_, path, value) :
    kind === 'Unknown' ? FromUnknown(schema_, references_, path, value) :
    kind === 'Unsafe' ? FromUnsafe(schema_, references_, path, value) :
    kind === 'Void' ? FromVoid(schema_, references_, path, value) :
    FromKind(schema_, references_, path, value)
  )
  // --------------------------------------------------------------
  // Refinement
  // --------------------------------------------------------------
  if (IsRefine(schema_)) {
    yield* FromRefine(schema_ as never, references_, path, value)
  }
}
/** Returns an iterator for each error in this value. */
export function Errors<T extends TSchema>(schema: T, references: TSchema[], value: unknown): ValueErrorIterator
/** Returns an iterator for each error in this value. */
export function Errors<T extends TSchema>(schema: T, value: unknown): ValueErrorIterator
/** Returns an iterator for each error in this value. */
export function Errors(...args: any[]) {
  const iterator = args.length === 3 ? Visit(args[0], args[1], '', args[2]) : Visit(args[0], [], '', args[1])
  return new ValueErrorIterator(iterator)
}
