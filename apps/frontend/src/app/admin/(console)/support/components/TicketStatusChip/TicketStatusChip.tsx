import Chip from "@mui/material/Chip";
import type { TicketStatus } from "@quickhotels/types/support";
import { STATUS_LABEL } from "../../utils/ticketText";

const COLOR: Record<TicketStatus, "error" | "warning" | "info" | "success" | "default"> = {
  OPEN: "error",
  IN_PROGRESS: "warning",
  WAITING_ON_CUSTOMER: "info",
  RESOLVED: "success",
  CLOSED: "default",
};

export default function TicketStatusChip({ status }: { status: TicketStatus }) {
  return <Chip size="small" variant="outlined" color={COLOR[status]} label={STATUS_LABEL[status]} sx={{ height: 22, fontSize: "0.75rem", fontWeight: 600 }} />;
}
