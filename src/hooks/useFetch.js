import { useState, useEffect, useCallback } from 'react';

export function useFetch(fetchFn, dependencies = []) {
    const [state, setState] = useState({
        data: null,
        loading: true,
        error: null
    });
    const [reloadKey, setReloadKey] = useState(0);

    const refetch = useCallback(() => {
        setReloadKey((prev) => prev + 1);
    }, []);

    const depsKey = JSON.stringify(dependencies);

    useEffect(() => {
        const controller = new AbortController();
        let isCurrent = true;

        Promise.resolve()
            .then(() => {
                if (!isCurrent) return null;
                setState((prev) => ({ ...prev, loading: true, error: null }));
                return fetchFn(controller.signal);
            })
            .then((result) => {
                if (isCurrent && result !== null) {
                    setState({ data: result, loading: false, error: null });
                }
            })
            .catch((err) => {
                if (err?.name === 'AbortError' || controller.signal.aborted) {
                    return;
                }
                if (isCurrent) {
                    setState({
                        data: null,
                        loading: false,
                        error: err instanceof Error ? err : new Error(String(err))
                    });
                }
            });

        return () => {
            isCurrent = false;
            controller.abort();
        };
    }, [fetchFn, depsKey, reloadKey]);

    return {
        data: state.data,
        loading: state.loading,
        error: state.error,
        refetch
    };
}

export default useFetch;
