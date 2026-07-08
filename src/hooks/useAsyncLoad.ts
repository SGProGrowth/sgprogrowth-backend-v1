import { useCallback, useEffect, useState } from 'react'
import { getFriendlyErrorMessage } from '../lib/api/errors'
import { isRequestAborted } from '../lib/api/client'

interface UseAsyncLoadOptions {
  enabled?: boolean
  immediate?: boolean
}

export function useAsyncLoad<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  options: UseAsyncLoadOptions = {},
) {
  const { enabled = true, immediate = true } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate && enabled)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    loader()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (cancelled || isRequestAborted(err)) return
        setError(getFriendlyErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps
  }, [enabled, version, ...deps])

  return { data, loading, error, reload, setData }
}
