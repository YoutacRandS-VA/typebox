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

import { Kind, TransformKind } from '../../type/symbols/index'
import { TypeBoxError } from '../../type/error/index'
import { ValueError } from '../../errors/index'
import { KeyOfPropertyKeys } from '../../type/keyof/index'
import { Index } from '../../type/indexed/index'
import { Deref } from '../deref/index'
import { Check } from '../check/index'

import type { TSchema } from '../../type/schema/index'
import type { TArray } from '../../type/array/index'
import type { TIntersect } from '../../type/intersect/index'
import type { TNot } from '../../type/not/index'
import type { TObject } from '../../type/object/index'
import type { TRecord } from '../../type/record/index'
import type { TRef } from '../../type/ref/index'
import type { TThis } from '../../type/recursive/index'
import type { TTuple } from '../../type/tuple/index'
import type { TUnion } from '../../type/union/index'

// ------------------------------------------------------------------
// ValueGuard
// ------------------------------------------------------------------
import { IsStandardObject, IsArray, IsValueType } from '../guard/index'
// ------------------------------------------------------------------
// TypeGuard
// ------------------------------------------------------------------
import { IsTransform, IsSchema } from '../../type/guard/type'
// ------------------------------------------------------------------
// Errors
// ------------------------------------------------------------------
// thrown externally
// prettier-ignore
export class TransformDecodeCheckError extends TypeBoxError {
  constructor(
    public readonly schema: TSchema, 
    public readonly value: unknown, 
    public readonly error: ValueError
  ) {
    super(`Unable to decode value as it does not match the expected schema`)
  }
}
// prettier-ignore
export class TransformDecodeError extends TypeBoxError {
  constructor(
    public readonly schema: TSchema, 
    public readonly path: string,
    public readonly value: unknown, 
    public readonly error: Error, 
  ) {
    super(error instanceof Error ? error.message : 'Unknown error')
  }
}
// ------------------------------------------------------------------
// Decode
// ------------------------------------------------------------------
// prettier-ignore
function Default(schema: TSchema, path: string, value: any) {
  try {
    return IsTransform(schema) ? schema[TransformKind].decode(value) : value
  } catch (error) {
    throw new TransformDecodeError(schema, path, value, error as Error)
  }
}
// prettier-ignore
function FromArray(schema: TArray, references: TSchema[], path: string, value: any): any {
  return (IsArray(value))
    ? Default(schema, path, value.map((value: any, index) => Visit(schema.items, references, `${path}/${index}`, value)))
    : Default(schema, path, value)
}
// prettier-ignore
function FromIntersect(schema: TIntersect, references: TSchema[], path: string, value: any) {
  if (!IsStandardObject(value) || IsValueType(value)) return Default(schema, path, value)
  const knownKeys = KeyOfPropertyKeys(schema) as string[]
  const knownProperties = { ...value } as Record<PropertyKey, unknown>
  for(const key of knownKeys) if(key in knownProperties) {
    knownProperties[key] = Visit(Index(schema, [key]), references, `${path}/${key}`, knownProperties[key])
  }
  if (!IsTransform(schema.unevaluatedProperties)) {
    return Default(schema, path, knownProperties)
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties)
  const unevaluatedProperties = schema.unevaluatedProperties as TSchema
  const unknownProperties = { ...knownProperties } as Record<PropertyKey, unknown>
  for(const key of unknownKeys) if(!knownKeys.includes(key)) {
    unknownProperties[key] = Default(unevaluatedProperties, `${path}/${key}`, unknownProperties[key])
  }
  return Default(schema, path, unknownProperties)
}
function FromNot(schema: TNot, references: TSchema[], path: string, value: any) {
  return Default(schema, path, Visit(schema.not, references, path, value))
}
// prettier-ignore
function FromObject(schema: TObject, references: TSchema[], path: string, value: any) {
  if (!IsStandardObject(value)) return Default(schema, path, value)
  const knownKeys = KeyOfPropertyKeys(schema)
  const knownProperties = { ...value } as Record<PropertyKey, unknown>
  for(const key of knownKeys) if(key in knownProperties) {
    knownProperties[key] = Visit(schema.properties[key], references, `${path}/${key}`, knownProperties[key])
  }
  if (!IsSchema(schema.additionalProperties)) {
    return Default(schema, path, knownProperties)
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties)
  const additionalProperties = schema.additionalProperties as TSchema
  const unknownProperties = { ...knownProperties } as Record<PropertyKey, unknown>
  for(const key of unknownKeys) if(!knownKeys.includes(key)) {
    unknownProperties[key] = Default(additionalProperties, `${path}/${key}`, unknownProperties[key])
  }
  return Default(schema, path, unknownProperties)
}
// prettier-ignore
function FromRecord(schema: TRecord, references: TSchema[], path: string, value: any) {
  if (!IsStandardObject(value)) return Default(schema, path, value)
  const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0]
  const knownKeys = new RegExp(pattern)
  const knownProperties = { ...value } as Record<PropertyKey, unknown>
  for(const key of Object.getOwnPropertyNames(value)) if(knownKeys.test(key)) {
    knownProperties[key] = Visit(schema.patternProperties[pattern], references, `${path}/${key}`, knownProperties[key])
  }
  if (!IsSchema(schema.additionalProperties)) {
    return Default(schema, path, knownProperties)
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties)
  const additionalProperties = schema.additionalProperties as TSchema
  const unknownProperties = {...knownProperties} as Record<PropertyKey, unknown>
  for(const key of unknownKeys) if(!knownKeys.test(key)) {
    unknownProperties[key] = Default(additionalProperties, `${path}/${key}`, unknownProperties[key])
  }
  return Default(schema, path, unknownProperties)
}
// prettier-ignore
function FromRef(schema: TRef, references: TSchema[], path: string, value: any) {
  const target = Deref(schema, references)
  return Default(schema, path, Visit(target, references, path, value))
}
// prettier-ignore
function FromThis(schema: TThis, references: TSchema[], path: string, value: any) {
  const target = Deref(schema, references)
  return Default(schema, path, Visit(target, references, path, value))
}
// prettier-ignore
function FromTuple(schema: TTuple, references: TSchema[], path: string, value: any) {
  return (IsArray(value) && IsArray(schema.items))
    ? Default(schema, path, schema.items.map((schema, index) => Visit(schema, references, `${path}/${index}`, value[index])))
    : Default(schema, path, value)
}
// prettier-ignore
function FromUnion(schema: TUnion, references: TSchema[], path: string, value: any) {
  for (const subschema of schema.anyOf) {
    if (!Check(subschema, references, value)) continue
    // note: ensure interior is decoded first
    const decoded = Visit(subschema, references, path, value)
    return Default(schema, path, decoded)
  }
  return Default(schema, path, value)
}
// prettier-ignore
function Visit(schema: TSchema, references: TSchema[], path: string, value: any): any {
  const references_ = typeof schema.$id === 'string' ? [...references, schema] : references
  const schema_ = schema as any
  switch (schema[Kind]) {
    case 'Array':
      return FromArray(schema_, references_, path, value)
    case 'Intersect':
      return FromIntersect(schema_, references_, path, value)
    case 'Not':
      return FromNot(schema_, references_, path, value)
    case 'Object':
      return FromObject(schema_, references_, path, value)
    case 'Record':
      return FromRecord(schema_, references_, path, value)
    case 'Ref':
      return FromRef(schema_, references_, path, value)
    case 'Symbol':
      return Default(schema_, path, value)
    case 'This':
      return FromThis(schema_, references_, path, value)
    case 'Tuple':
      return FromTuple(schema_, references_, path, value)
    case 'Union':
      return FromUnion(schema_, references_, path, value)
    default:
      return Default(schema_, path, value)
  }
}
/**
 * `[Internal]` Decodes the value and returns the result. This function requires that
 * the caller `Check` the value before use. Passing unchecked values may result in
 * undefined behavior. Refer to the `Value.Decode()` for implementation details.
 */
export function TransformDecode(schema: TSchema, references: TSchema[], value: unknown): unknown {
  return Visit(schema, references, '', value)
}
