import type { CreateTicketRequest, CreateTicketResponse } from "@quickhotels/types/support";
import { postJson } from "./client";

export const supportApi = {
  // Signed-in customers send their token so the request is linked to them.
  createTicket: (request: CreateTicketRequest, token: string | null) =>
    postJson<CreateTicketResponse>("/v1/support/tickets", request, token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
};
