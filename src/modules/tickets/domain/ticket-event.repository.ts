/** Puerto para el registro inmutable de eventos (event sourcing ligero). */
export interface AppendTicketEventInput {
  ticketId: string;
  type: string;
  payload: unknown; // se serializa a JSON en la implementación
  actorId: string | null;
}

export interface TicketEventRepository {
  append(input: AppendTicketEventInput): Promise<void>;
}
