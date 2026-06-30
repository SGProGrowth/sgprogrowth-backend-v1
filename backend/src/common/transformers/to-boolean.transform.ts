import { Transform } from 'class-transformer'

/** Parses query-string booleans safely (`"false"` must not become true). */
export function ToBoolean() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined
    if (value === true || value === 1 || value === '1' || value === 'true') return true
    if (value === false || value === 0 || value === '0' || value === 'false') return false
    return undefined
  })
}
