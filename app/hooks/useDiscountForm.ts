import { useSubmit } from "@remix-run/react";
import { useCallback, useState } from "react";

import { DiscountClass } from "../types/admin.types";
import { DiscountMethod } from "../types/types";


interface Collection {
  id: string;
  title: string;
}

interface Product {
  id: string;
  title: string;
}


interface CombinesWith {
  orderDiscounts: boolean;
  productDiscounts: boolean;
  shippingDiscounts: boolean;
}

interface DiscountConfiguration {
  cartLinePercentage: string;
  orderPercentage: string;
  deliveryPercentage: string;
  metafieldId?: string;
  collectionIds?: string[];
  collections?: Collection[];
  productIds?: string[];
  products?: Product[];
}

interface FormState {
  target: 'collections' | 'products' | null;
  title: string;
  method: DiscountMethod;
  code: string;
  combinesWith: CombinesWith;
  discountClasses: DiscountClass[];
  usageLimit: string;
  appliesOncePerCustomer: boolean;
  startDate: Date | string;
  startTime: string;
  endDate: Date | string | null;
  endTime: string;
  configuration: DiscountConfiguration;
}

interface UseDiscountFormProps {
  initialData?: {
    title: string;
    method: DiscountMethod;
    code: string;
    combinesWith: {
      orderDiscounts: boolean;
      productDiscounts: boolean;
      shippingDiscounts: boolean;
    };
    discountClasses: DiscountClass[];
    usageLimit: number | null;
    appliesOncePerCustomer: boolean;
    startsAt: string | Date;
    endsAt: string | Date | null;
    configuration: {
      cartLinePercentage: string;
      orderPercentage: string;
      deliveryPercentage: string;
      metafieldId?: string;
      collectionIds?: string[];
      productIds?: string[];
    };
  };
  onSubmit?: () => void;
}

// Handle Date and Time
export const combineDateTime = (date: string | Date, time: string): string | null => {
      let isoDate: Date;
      if (typeof date === "string") {
        // Accepts "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm"
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          isoDate = new Date(`${date}T00:00`);
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(date)) {
          isoDate = new Date(date);
        } else {
          console.warn("Invalid date input:", date);
          return null;
        }
      } else {
        isoDate = new Date(date);
      }

      if (isNaN(isoDate.getTime())) {
        console.warn("Invalid date input:", date);
        return null;
      }

      if (!time || !/^\d{2}:\d{2}$/.test(time)) {
        console.warn("Invalid time input:", time);
        return null;
      }

      const [hours, minutes] = time.split(":").map(Number);
      isoDate.setHours(hours, minutes, 0, 0);

      return isNaN(isoDate.getTime()) ? null : isoDate.toISOString();
};
export function useDiscountForm({ initialData }: UseDiscountFormProps = {}) {
  const submit = useSubmit();
  const todaysDate = new Date();

  const initialTarget = 
    initialData?.configuration?.productIds?.length 
    ? 'products'
    : initialData?.configuration?.collectionIds?.length 
    ? 'collections'
    : null;


  function getLocalDateString(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    // Returns "YYYY-MM-DD" in user's local timezone
    return d.toLocaleDateString("en-CA"); // "en-CA" gives ISO-like format
  }

  function getLocalTimeString(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    // Returns "HH:mm" in user's local timezone
    return d
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  const [formState, setFormState] = useState<FormState>(() => ({
    target: initialTarget,
    title: initialData?.title ?? "",
    method: initialData?.method ?? DiscountMethod.Code,
    code: initialData?.code ?? "",
    discountClasses: initialData?.discountClasses ?? [],
    combinesWith: initialData?.combinesWith ?? {
      orderDiscounts: false,
      productDiscounts: false,
      shippingDiscounts: false,
    },
    usageLimit: initialData?.usageLimit?.toString() ?? "",
    appliesOncePerCustomer: initialData?.appliesOncePerCustomer ?? false,
    startDate: initialData?.startsAt ? getLocalDateString(initialData.startsAt) : todaysDate,
    startTime: initialData?.startsAt ? getLocalTimeString(initialData.startsAt) : "",
    endDate: initialData?.endsAt ? getLocalDateString(initialData.endsAt) : null,
    endTime: initialData?.endsAt ? getLocalTimeString(initialData.endsAt) : "",

    configuration: {
      cartLinePercentage:
        initialData?.configuration.cartLinePercentage?.toString() ?? "0",
      orderPercentage:
        initialData?.configuration.orderPercentage?.toString() ?? "0",
      deliveryPercentage:
        initialData?.configuration.deliveryPercentage?.toString() ?? "0",
      metafieldId: initialData?.configuration.metafieldId,
      collectionIds: initialData?.configuration.collectionIds ?? [],
      productIds: initialData?.configuration.productIds ?? [],
    },
  }));

  // const [formErrors, setFormErrors] = useState<Record<string, string>>({});



  const setField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const setConfigField = useCallback(
    (
      field: keyof DiscountConfiguration,
      value: string | string[] | Collection[],
    ) => {
      setFormState((prev) => ({
        ...prev,
        configuration: { ...prev.configuration, [field]: value },
      }));
    },
    [],
  );

  const setCombinesWith = useCallback(
    (field: keyof CombinesWith, value: boolean) => {
      setFormState((prev) => ({
        ...prev,
        combinesWith: { ...prev.combinesWith, [field]: value },
      }));
    },
    [],
  );
  
  const handleSubmit = useCallback(() => {

    // const validationErrors = validateForm();
    // if(validationErrors.length > 0){
    //   return;
    // }
    // const errors = validateForm();
    // if (Object.keys(errors).length > 0) {
    //   return;
    // }

    const formData = new FormData();

    // const combineDateTime = (date: string | Date, time: string): string => {
    //   const isoDate = new Date(date);
    //   const [hours, minutes] = time.split(":").map(Number);
    //   isoDate.setHours(hours, minutes, 0, 0);
    //   return isoDate.toISOString();
    // };
    



    formData.append(
      "discount",
      JSON.stringify({
        title: formState.title,
        method: formState.method,
        code: formState.code,
        combinesWith: formState.combinesWith,
        discountClasses: formState.discountClasses,
        usageLimit:
          formState.usageLimit === ""
            ? null
            : parseInt(formState.usageLimit, 10),
        appliesOncePerCustomer: formState.appliesOncePerCustomer,
        startsAt: combineDateTime(formState.startDate, formState.startTime),
        endsAt: formState.endDate
                ? combineDateTime(formState.endDate, formState.endTime)
                : null,
        configuration: {
          ...(formState.configuration.metafieldId
            ? { metafieldId: formState.configuration.metafieldId }
            : {}),
          cartLinePercentage: parseFloat(
            formState.configuration.cartLinePercentage,
          ),
          orderPercentage: parseFloat(formState.configuration.orderPercentage),
          deliveryPercentage: parseFloat(
            formState.configuration.deliveryPercentage,
          ),
          collectionIds: formState.configuration.collectionIds,
          productIds: formState.configuration.productIds,
        },
      }),
    );
    submit(formData, { method: "post" });
  }, [formState, submit]);


  console.log(formState,'handleSubmit')
  return {
    formState,
    // formErrors,
    setField,
    setConfigField,
    setCombinesWith,
    submit: handleSubmit,
  };
}
