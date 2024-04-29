/*--------------------------------------------------------------------------

@sinclair/typebox/type

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

import { RefineKind } from '../symbols/index'
import { TSchema } from '../schema/index'
import { Static } from '../static/index'
import { CloneType } from '../clone/type'
import { IsRefine } from '../guard/type'

export interface RefinementCheckOptions {
  [key: string]: any
  message: string
}
export interface Refinement extends RefinementCheckOptions {
  check: RefineCheckFunction
}
export type RefineCheckFunction<T extends TSchema = TSchema, S = Static<T>> = (value: S) => boolean

function DefaultRefinementCheckOptions(): RefinementCheckOptions {
  return { message: 'Invalid' }
}
export class RefineBuilder<T extends TSchema> {
  constructor(private readonly schema: T, private readonly refinements: Refinement[]) {}
  /** Adds a refinement check to this type */
  public Check(check: RefineCheckFunction<T>, options: RefinementCheckOptions = DefaultRefinementCheckOptions()): RefineBuilder<T> {
    return new RefineBuilder(this.schema, [...this.refinements, { check, ...options }])
  }
  /** Completes the refinement and returns the type. */
  public Done(): T {
    return CloneType(this.schema, { [RefineKind]: [...this.refinements] })
  }
}

/** `[Json]` Refines a type by applying additional runtime checks */
export function Refine<T extends TSchema>(schema: T): RefineBuilder<T> {
  return new RefineBuilder(schema, IsRefine(schema) ? schema[RefineKind] : [])
}
