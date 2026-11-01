import { useEffect, useState } from "react";
type RequestState<T> =
  | { status: "loading"; data?: never; message?: never }
  | { status: "error"; data?: never; message: string }
  | { status: "success"; data: T; message?: never };
export function useMovieRequest<T>(
  key: string,
  request: (signal: AbortSignal) => Promise<T>,
  errorMessage: (error: unknown) => string,
) {
  const [result, setResult] = useState<{
    key: string;
    state: RequestState<T>;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setResult({ key, state: { status: "loading" } });
    void request(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({ key, state: { status: "success", data } });
      },
      (error) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            state: { status: "error", message: errorMessage(error) },
          });
      },
    );
    return () => controller.abort();
  }, [key, request, errorMessage]);
  return result?.key === key ? result.state : { status: "loading" as const };
}
