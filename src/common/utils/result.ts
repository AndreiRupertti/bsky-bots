export type IResult<E, Res> = IResultOptions<undefined, E>["failure"] | IResultOptions<Res, undefined>["success"];
export type IResultAsync<E, Res> = Promise<IResult<E, Res>>;

type IResultOptions<T, E> = {
  failure: { status: "failure"; isOk: false; isErr: true; data: E };
  success: { status: "success"; isOk: true; isErr: false; data: T };
};

export const Result = <T, E extends Error>(
  unsafeOperation: () => T,
  errorHandler?: (err: unknown) => E,
): IResult<E | Error, T> => {
  try {
    const res = unsafeOperation();
    return ok(res);
  } catch (e) {
    const errResult = errorHandler ? errorHandler(e) : extractError(e);
    return error<E | Error>(errResult);
  }
};

export const ResultAsync = async <T, E extends Error = Error>(
  promise: Promise<T>,
  errorHandler?: (err: unknown) => E,
): IResultAsync<E | Error, T> => {
  const newPromise = promise
    .then((value: T) => ok(value))
    .catch((e) => {
      const errResult = errorHandler ? errorHandler(e) : extractError(e);
      return error<E | Error>(errResult);
    });

  return newPromise;
};

export const error = <E extends Error>(err: E | string) => {
  return {
    status: "failure",
    isOk: false,
    isErr: true,
    data: typeof err === "string" ? new Error(err) : err,
  } as const;
};

export const ok = <T>(result: T) => {
  return {
    status: "success",
    isOk: true,
    isErr: false,
    data: result,
  } as const;
};

const extractError = (err: unknown): Error => {
  console.log(err);
  if (!err) return new Error("undefined error");
  if (typeof err === "string") return new Error(err);
  if (err instanceof Error) return err;
  if (typeof err === "object") {
    const message = Object.entries(err)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");
    return new Error(message);
  }

  const message = String(err);
  return new Error(message);
};
