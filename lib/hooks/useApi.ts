import { useState, useEffect, useCallback, useRef } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  immediate?: boolean;
  deps?: any[];
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const { onSuccess, onError, immediate = true, deps = [] } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to avoid recreating fetchData on every render
  const apiFunctionRef = useRef(apiFunction);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  
  // Update refs on each render
  useEffect(() => {
    apiFunctionRef.current = apiFunction;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunctionRef.current();
      setData(result);
      onSuccessRef.current?.(result);
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = (error.response?.data as any)?.detail || error.message || 'An error occurred';
      const errorObj = new Error(errorMessage);
      setError(errorObj);
      onErrorRef.current?.(errorObj);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - stable reference

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, fetchData, ...deps]);

  return { data, loading, error, refetch: fetchData };
}

interface UseMutationOptions<T, V> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseMutationReturn<T, V> {
  mutate: (variables: V) => Promise<T | undefined>;
  loading: boolean;
  error: Error | null;
}

export function useMutation<T, V>(
  apiFunction: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, V> = {}
): UseMutationReturn<T, V> {
  const { onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to avoid recreating mutate on every render
  const apiFunctionRef = useRef(apiFunction);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  
  // Update refs on each render
  useEffect(() => {
    apiFunctionRef.current = apiFunction;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  const mutate = useCallback(
    async (variables: V): Promise<T | undefined> => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunctionRef.current(variables);
        onSuccessRef.current?.(result);
        return result;
      } catch (err) {
        const error = err as AxiosError;
        const errorMessage = (error.response?.data as any)?.detail || error.message || 'An error occurred';
        const errorObj = new Error(errorMessage);
        setError(errorObj);
        onErrorRef.current?.(errorObj);
        toast.error(errorMessage);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [] // Empty dependency array - stable reference
  );

  return { mutate, loading, error };
}
