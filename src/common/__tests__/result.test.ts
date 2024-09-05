import { setTimeout } from "node:timers/promises";
import { Result, ResultAsync } from "@/common/utils/result";
import { ZodError, z } from "zod";

describe("Result util", () => {
  describe("Synchronous handling", () => {
    const synchronousTestInput = [
      {
        description: "when parsing a failed zod schema",
        exec: () => z.object({ name: z.string() }).parse({ invalid_param: "string" }),
        expectedResult: { isOk: false, isErr: true, data: expect.any(ZodError), status: "failure" },
      },
      {
        description: "when parsing a invalid url",
        exec: () => new URL("http:// invalid_url $%$ˆ$ .. com"),
        expectedResult: { isOk: false, isErr: true, data: expect.any(Error), status: "failure" },
      },
      {
        description: "when parsing a valid zod schema",
        exec: () => z.object({ name: z.string() }).parse({ name: "string" }),
        expectedResult: { isOk: true, isErr: false, data: { name: "string" }, status: "success" },
      },
      {
        description: "when parsing a valid url",
        exec: () => new URL("http://valid-url.com"),
        expectedResult: { isOk: true, isErr: false, data: expect.any(URL), status: "success" },
      },
    ];

    it.each(synchronousTestInput)(
      "result should be $expectedResult.status $description ",
      ({ exec, expectedResult }) => {
        const result = Result(() => exec());
        expect(result).toEqual(expectedResult);
      },
    );

    it("error should be custom when passing a custom error handler", async () => {
      const unsafeFun = () => {
        throw new Error("Some Error");
      };

      const result = await Result(unsafeFun, () => new Error("My custom Error"));

      expect(result.data).toEqual(new Error("My custom Error"));
    });
  });

  describe("Asynchronous handling", () => {
    const asynchronousTestInput = [
      {
        description: "on promise fail",
        exec: () =>
          setTimeout(100).then(() => {
            throw new Error("Delayed Error");
          }),
        expectedResult: { isOk: false, isErr: true, data: expect.any(Error), status: "failure" },
      },
      {
        description: "on promise sucess",
        exec: () => setTimeout(100).then(() => "success!"),
        expectedResult: { isOk: true, isErr: false, data: "success!", status: "success" },
      },
      {
        description: "on void promise sucess",
        exec: () => setTimeout(100).then(() => {}),
        expectedResult: { isOk: true, isErr: false, data: undefined, status: "success" },
      },
      {
        description: "on promise with a catch chain",
        exec: () =>
          setTimeout(100)
            .then(() => {
              throw new Error("Delayed Error");
            })
            .catch(() => "fallback"),
        expectedResult: { isOk: true, isErr: false, data: "fallback", status: "success" },
      },
    ];

    it.each(asynchronousTestInput)(
      "result should be $expectedResult.status $description ",
      async ({ exec, expectedResult }) => {
        const result = await ResultAsync(exec() as Promise<string | void>);
        expect(result).toEqual(expectedResult);
      },
    );

    it("error should be custom when passing a custom error handler", async () => {
      const throwPromise = setTimeout(100).then(() => {
        throw new Error("Some Error");
      });

      const result = await ResultAsync(throwPromise, () => new Error("My custom Error"));
      expect(result.data).toEqual(new Error("My custom Error"));
    });
  });
});
