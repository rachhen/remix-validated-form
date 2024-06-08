import {
  FetcherWithComponents,
  SubmitOptions,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { FieldErrors, GenericObject } from "@rvf/core";
import { useEffect, useRef } from "react";

export function useSubmitComplete(isSubmitting: boolean, callback: () => void) {
  const isPending = useRef(false);
  useEffect(() => {
    if (isSubmitting) {
      isPending.current = true;
    }

    if (!isSubmitting && isPending.current) {
      isPending.current = false;
      callback();
    }
  });
}

export const useHasActiveFormSubmit = (
  fetcher?: FetcherWithComponents<unknown>,
): boolean => {
  const navigation = useNavigation();
  const hasActiveSubmission = fetcher
    ? fetcher.state === "submitting"
    : navigation.state === "submitting" || navigation.state === "loading";
  return hasActiveSubmission;
};

export const useRemixSubmit = (
  fetcher?: FetcherWithComponents<unknown>,
  serverValidationErrors?: FieldErrors,
) => {
  const hasActiveSubmission = useHasActiveFormSubmit(fetcher);
  const resolver = useRef<PromiseWithResolvers<void>>();
  useSubmitComplete(hasActiveSubmission, () => {
    if (serverValidationErrors) {
      resolver.current?.reject();
    } else {
      resolver.current?.resolve();
    }
  });

  const submit = useSubmit();

  const handleSubmit = (
    modifiedFormData: FormData | GenericObject,
    submitOptions?: SubmitOptions,
  ) => {
    const resolvers = Promise.withResolvers<void>();
    resolver.current = resolvers;

    if (fetcher) fetcher.submit(modifiedFormData, submitOptions);
    else submit(modifiedFormData, submitOptions);

    return resolvers.promise;
  };

  return handleSubmit;
};
