// // View Discounts Page app.discounts.tsx

import { useState, useCallback, useMemo, useEffect } from "react";
import { useFetcher, useLoaderData, useNavigate, useLocation } from "@remix-run/react";
import { Page, Card, IndexTable, Button, Modal, BlockStack,  IndexFilters, useSetIndexFiltersMode,useIndexResourceState,Pagination,} from "@shopify/polaris";

import { json, type LoaderFunctionArgs, type ActionFunctionArgs} from "@remix-run/node";
import { getAllDiscounts, updateDiscountStatus, deleteDiscount } from "../models/discounts.server";
import {
  DeleteIcon, EditIcon,StatusActiveIcon, DisabledIcon
} from '@shopify/polaris-icons';
import type { IndexFiltersProps, TabProps } from "@shopify/polaris";

/** ---------- Types ---------- */
type DiscountType = "code" | "automatic";

type Discount = {
  id: string;
  title: string;
  status?: "ACTIVE" | "DISABLED" | string;
  type: DiscountType;
  method: string;
  used?: number;
};

type LoaderData = {
  discounts: Discount[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string | null;
  startCursor: string | null;
  error?: string;
};

type ActionResponse = { success: true; message: string } | { success: false; error: string };

/** ---------- Loader ---------- */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const after = url.searchParams.get("after");
  // const before = url.searchParams.get("before");

  try {
    const data = await getAllDiscounts(request, after ?? undefined);
    // Ensure a stable LoaderData shape
    return json<LoaderData>({
      discounts: data.discounts ?? [],
      hasNextPage: !!data.hasNextPage,
      hasPreviousPage: !!data.hasPreviousPage,
      endCursor: data.endCursor ?? null,
      startCursor: data.startCursor ?? null,
    });
  } catch (error: any) {
    console.error("Loader error:", error);
    return json<LoaderData>({
      discounts: [],
      hasNextPage: false,
      hasPreviousPage: false,
      endCursor: null,
      startCursor: null,
      error: "Failed to load discounts",
    }, { status: 500 });
  }
}

/** ---------- Action ---------- */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");
  const type = formData.get("type");
  const actionType = formData.get("action");

  if (typeof id !== "string" || (type !== "code" && type !== "automatic")) {
    return json<ActionResponse>({ success: false, error: "Invalid or missing id/type." }, { status: 400 });
  }

  if (actionType !== "activate" && actionType !== "deactivate" && actionType !== "delete") {
    return json<ActionResponse>({ success: false, error: "Invalid action." }, { status: 400 });
  }

  try {
    if (actionType === "delete") {
      await deleteDiscount(request, id, type);
      return json<ActionResponse>({ success: true, message: "Discount deleted" });
    }
    await updateDiscountStatus(request, id, type, actionType);
    return json<ActionResponse>({ success: true, message: `Discount ${actionType}d` });
  } catch (err: any) {
    console.error("Action error:", err);
    return json<ActionResponse>({ success: false, error: err?.message ?? "Action failed" }, { status: 500 });
  }
}

type SortKey = "title" | "used";
type SortValue = `${SortKey} asc` | `${SortKey} desc`;

export default function DiscountsList() {
  const loaderData = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const location = useLocation();



  // Two fetchers: one for list reload/pagination, one for mutations
  const listFetcher = useFetcher<LoaderData>();
  const actionFetcher = useFetcher<ActionResponse>();

  // Use listFetcher data if present (fresh), otherwise loader data
  const data = listFetcher.data ?? loaderData;
  const { discounts, hasNextPage, hasPreviousPage, endCursor, startCursor } = data;

  // UI states
  const [active, setActive] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<{ id: string; type: string } | null>(null);

      // Open modal
  const openModal = (id: string, type: string) => {
    setSelectedDiscount({ id, type });
    setActive(true);
  };

  // Close modal explicitly
  const closeModal = () => {
    setActive(false);
    setSelectedDiscount(null);
  };

  // Track which discount is currently being mutated (so only that row shows loading)
  const [mutatingDiscountId, setMutatingDiscountId] = useState<string | null>(null);

  // Search, sort, tabs
  const [queryValue, setQueryValue] = useState<string>("");
  const sortOptions: IndexFiltersProps["sortOptions"] = [
    { label: "Title", value: "title asc", directionLabel: "A–Z" },
    { label: "Title", value: "title desc", directionLabel: "Z–A" },
    { label: "Used", value: "used asc", directionLabel: "Low → High" },
    { label: "Used", value: "used desc", directionLabel: "High → Low" },
  ];
  const [sortSelected, setSortSelected] = useState<string[]>(["title asc"]);
  const tabs: TabProps[] = [{ id: "all", content: "All", isLocked: true }];
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const { mode, setMode } = useSetIndexFiltersMode();
  const primaryAction: IndexFiltersProps["primaryAction"] = {
    type: "save-as",
    onAction: async () => true,
    disabled: false,
    loading: false,
  };

  // Filter + Sort
  const filtered = useMemo(() => {
    const q = queryValue.trim().toLowerCase();
    if (!q) return discounts;
    return discounts.filter((d) => [d.title, d.status ?? "", d.method ?? ""].join(" ").toLowerCase().includes(q));
  }, [discounts, queryValue]);

  const sorted = useMemo(() => {
    const current = (sortSelected[0] ?? "title asc") as SortValue;
    const [key, dir] = current.split(" ") as [SortKey, "asc" | "desc"];
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (key === "title") {
        const cmp = a.title.localeCompare(b.title);
        return dir === "asc" ? cmp : -cmp;
      }
      const av = a.used ?? 0;
      const bv = b.used ?? 0;
      const cmp = av === bv ? 0 : av < bv ? -1 : 1;
      return dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortSelected]);

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(sorted);

  const handleFiltersQueryChange = useCallback((value: string) => setQueryValue(value), []);
  const handleQueryClear = useCallback(() => setQueryValue(""), []);
  const handleSort = useCallback((value: string[]) => setSortSelected(value as SortValue[]), []);

  const refreshList = useCallback(() => {
    listFetcher.load(`/app/discounts${location.search || ""}`);
  }, [listFetcher, location.search]);

  // Toggle status for a specific discount (per-item mutating id)
  const handleToggleStatus = (d: Discount) => {
    setMutatingDiscountId(d.id);
    actionFetcher.submit(
      { id: d.id, type: d.type, action: d.status === "ACTIVE" ? "deactivate" : "activate" },
      { method: "post" }
    );
  };

  // Open delete modal for a specific discount
  // const openDeleteModal = (d: Discount) => {
  //   setSelectedDiscount(d);
  //   setActive(true);
  // };

  // Confirm delete - set mutating id to selected discount and submit
  // const handleDeleteConfirm = () => {
  //   if (!selectedDiscount) return;
  //   setMutatingDiscountId(selectedDiscount.id);
  //   actionFetcher.submit(
  //     { id: selectedDiscount.id, type: selectedDiscount.type, action: "delete" },
  //     { method: "post" }
  //   );
  // };

  // After any mutation completes, refresh the list and reset per-item loading/modal
  // useEffect(() => {
  //   // When fetcher becomes idle, the mutation finished (success or failure)
  //   if (actionFetcher.state === "idle") {
  //     // success -> refresh
  //     if (actionFetcher.data?.success) {
  //       refreshList();
  //       if (active) setActive(false);
  //       setSelectedDiscount(null);
  //     } else if (actionFetcher.data && !actionFetcher.data.success) {
  //       // optional: show an error toast. For now, log it.
  //       console.error("Mutation error:", actionFetcher.data.error);
  //     }
  //     // always clear the per-item mutating id once request completes
  //     setMutatingDiscountId(null);
  //   }
  // }, [actionFetcher.state, actionFetcher.data, refreshList, active]);

  // Watch for successful delete to close modal
  useEffect(() => {
    if (actionFetcher.state === "idle" && actionFetcher.data?.success){
      closeModal(); // close only after delete success
      // refreshList();
    }
  }, [actionFetcher.state, actionFetcher.data, refreshList]);

  // Helper: is this discount currently being mutated?
  const isMutating = (discountId: string) => mutatingDiscountId !== null && mutatingDiscountId === discountId && actionFetcher.state !== "idle";

  return (
    <Page>
      <ui-title-bar title="View & Update Discounts" />
      <Card>
        <IndexFilters
          sortOptions={sortOptions}
          sortSelected={sortSelected}
          onSort={handleSort}
          queryValue={queryValue}
          queryPlaceholder="Search by title, status, or method"
          onQueryChange={handleFiltersQueryChange}
          onQueryClear={handleQueryClear}
          primaryAction={primaryAction}
          cancelAction={{ onAction: () => {}, disabled: false, loading: false }}
          tabs={tabs}
          selected={selectedTab}
          onSelect={setSelectedTab}
          canCreateNewView={false}
          filters={[]}
          appliedFilters={[]}
          onClearAll={() => {}}
          mode={mode}
          setMode={setMode}
        />

        <IndexTable
          resourceName={{ singular: "discount", plural: "discounts" }}
          itemCount={sorted.length}
          selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: "Title" },
            { title: "Status" },
            { title: "Method" },
            { title: "Used" },
            { title: "Update Status" },
            { title: "Edit" },
            { title: "Delete" },
          ]}
          selectable={false}
        >
          {sorted.map((discount, index) => (
            <IndexTable.Row id={discount.id} key={discount.id} position={index} selected={selectedResources.includes(discount.id)}>
              <IndexTable.Cell>{discount.title}</IndexTable.Cell>
              <IndexTable.Cell>{discount.status}</IndexTable.Cell>
              <IndexTable.Cell>{discount.method}</IndexTable.Cell>
              <IndexTable.Cell>{discount.used ?? 0}</IndexTable.Cell>

              {/* Activate / Deactivate - shows loading only for mutated row */}
              <IndexTable.Cell>
                <Button
                  size="slim"
                  tone={discount.status === "ACTIVE" ? "critical" : "success"}
                  icon={discount.status === "ACTIVE" ? DisabledIcon : StatusActiveIcon}
                  loading={isMutating(discount.id)}
                  onClick={() => handleToggleStatus(discount)}
                >
                  {discount.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </Button>
              </IndexTable.Cell>

              {/* Edit */}
              <IndexTable.Cell>
                <Button tone="success" icon={EditIcon} onClick={() => navigate(`/app/discount/${discount.id.split("/").pop()}`)}>
                  Edit
                </Button>
              </IndexTable.Cell>

              {/* Delete - open modal, show loading only for the deleted row */}
              <IndexTable.Cell>
                {/* <Button
                  tone="critical"
                  icon={DeleteIcon}
                  loading={isMutating(discount.id)}
                  onClick={() => openDeleteModal(discount)}
                >
                  Delete
                </Button> */}
                <Button 
                  tone="critical"
                  icon={DeleteIcon} 
                  onClick={() => openModal(discount.id, discount.type)}
                >
                  Delete
                </Button>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>

        <Pagination
          hasPrevious={hasPreviousPage}
          onPrevious={() => listFetcher.load(`/app/discounts?before=${startCursor ?? ""}`)}
          hasNext={hasNextPage}
          onNext={() => listFetcher.load(`/app/discounts?after=${endCursor ?? ""}`)}
        />
      </Card>

      {/* Delete modal: loading only when the currently selected discount is being mutated */}
      <Modal
        open={active}
        onClose={closeModal}
        title="Delete Discount"
        primaryAction={{
          content: "Delete",
          destructive: true,
          loading: actionFetcher.state === "submitting",
          onAction: () => {
            if (selectedDiscount) {
              actionFetcher.submit(
                {
                  id: selectedDiscount.id,
                  type: selectedDiscount.type,
                  action: "delete",
                },
                { method: "post" }
              );
            }
          },
        }}
        secondaryActions={[{ content: "Cancel", onAction: closeModal }]}
      >
        <Modal.Section>
          <BlockStack>Are you sure you want to delete this discount?</BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

