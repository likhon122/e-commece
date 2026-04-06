export type DeliveryFlowStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered";

export type TrackableOrderStatus =
  | DeliveryFlowStatus
  | "cancelled"
  | "refunded";

export interface TrackingHistoryPoint {
  status: TrackableOrderStatus;
  note?: string;
  updatedAt: string | Date;
}

export interface DeliveryTimelineStage {
  status: DeliveryFlowStatus;
  label: string;
  description: string;
  at?: Date;
  note?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

const stageMeta: Record<DeliveryFlowStatus, { label: string; description: string }> = {
  pending: {
    label: "Order Placed",
    description: "Order received and awaiting final checks.",
  },
  confirmed: {
    label: "Payment Confirmed",
    description: "Payment verified and order approved.",
  },
  processing: {
    label: "Packed",
    description: "Items are packed and ready for dispatch.",
  },
  shipped: {
    label: "In Transit",
    description: "Shipment is on the way to destination.",
  },
  delivered: {
    label: "Delivered",
    description: "Order delivered successfully.",
  },
};

export const DELIVERY_FLOW: DeliveryFlowStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

export function isDeliveryFlowStatus(
  status: TrackableOrderStatus,
): status is DeliveryFlowStatus {
  return DELIVERY_FLOW.includes(status as DeliveryFlowStatus);
}

export function getStatusLabel(status: TrackableOrderStatus): string {
  if (isDeliveryFlowStatus(status)) {
    return stageMeta[status].label;
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return "Refunded";
}

export function getNextDeliveryStatus(
  status: TrackableOrderStatus,
): DeliveryFlowStatus | null {
  if (!isDeliveryFlowStatus(status)) {
    return null;
  }

  const currentIndex = DELIVERY_FLOW.indexOf(status);
  if (currentIndex < 0 || currentIndex >= DELIVERY_FLOW.length - 1) {
    return null;
  }

  return DELIVERY_FLOW[currentIndex + 1];
}

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLatestHistoryForStatus(
  history: TrackingHistoryPoint[],
  status: TrackableOrderStatus,
): { at?: Date; note?: string } {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index];
    if (item.status !== status) {
      continue;
    }

    const at = toDate(item.updatedAt) || undefined;
    return {
      at,
      note: item.note,
    };
  }

  return {};
}

export function getDeliveryProgressIndex(
  currentStatus: TrackableOrderStatus,
  history: TrackingHistoryPoint[],
): number {
  if (isDeliveryFlowStatus(currentStatus)) {
    return DELIVERY_FLOW.indexOf(currentStatus);
  }

  let maxIndex = -1;
  for (const item of history) {
    if (!isDeliveryFlowStatus(item.status)) {
      continue;
    }

    const index = DELIVERY_FLOW.indexOf(item.status);
    maxIndex = Math.max(maxIndex, index);
  }

  return maxIndex;
}

export function buildDeliveryTimeline(
  currentStatus: TrackableOrderStatus,
  history: TrackingHistoryPoint[],
): DeliveryTimelineStage[] {
  const progressIndex = getDeliveryProgressIndex(currentStatus, history);
  const currentFlowIndex = isDeliveryFlowStatus(currentStatus)
    ? DELIVERY_FLOW.indexOf(currentStatus)
    : -1;

  return DELIVERY_FLOW.map((status, index) => {
    const historyState = getLatestHistoryForStatus(history, status);

    return {
      status,
      label: stageMeta[status].label,
      description: stageMeta[status].description,
      at: historyState.at,
      note: historyState.note,
      isCompleted: index <= progressIndex,
      isCurrent: index === currentFlowIndex,
    };
  });
}
