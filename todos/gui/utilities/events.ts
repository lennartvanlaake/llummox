export type BoardClient = {
  writeSSE(message: {
    event: string;
    data: string;
    id?: string;
  }): Promise<void>;
  onAbort(listener: () => void): void;
};

export function createClients() {
  const clients = new Set<BoardClient>();

  return {
    add(client: BoardClient) {
      clients.add(client);
      client.onAbort(() => clients.delete(client));
    },
    get size() {
      return clients.size;
    },
    async push(event: string, html: string, id?: number) {
      if (clients.size === 0) return;
      await Promise.all(
        [...clients].map(async (client) => {
          try {
            await client.writeSSE({
              event,
              data: html,
              ...(id === undefined ? {} : { id: String(id) }),
            });
          } catch {
            clients.delete(client);
          }
        }),
      );
    },
  };
}

export type Clients = ReturnType<typeof createClients>;
