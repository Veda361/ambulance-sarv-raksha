import { getAccessToken } from './api';

type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'DISCONNECTED';
type MessageCallback = (data: { topic: string; event: string; payload: any; timestamp: string }) => void;

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'DISCONNECTED';
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private messageListeners = new Map<string, Set<MessageCallback>>();
  private activeSubscriptions = new Set<string>();
  private reconnectAttempts = 0;
  private maxReconnectDelay = 15000;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private lastSynchronizedAt: string | null = null;

  public connect(): void {
    const token = getAccessToken();
    if (!token) {
      this.setStatus('DISCONNECTED');
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use host if in dev proxy or production
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
        this.reconnectAttempts = 0;
        this.lastSynchronizedAt = new Date().toISOString();

        // Resubscribe to existing topics on reconnect
        for (const topic of this.activeSubscriptions) {
          this.send({ action: 'subscribe', topic });
        }

        // Setup ping heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.lastSynchronizedAt = new Date().toISOString();

          if (msg.topic && this.messageListeners.has(msg.topic)) {
            const listeners = this.messageListeners.get(msg.topic)!;
            listeners.forEach((callback) => callback(msg));
          }
        } catch {
          // Ignore non-JSON frame
        }
      };

      this.ws.onclose = () => {
        this.cleanup();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.ws) this.ws.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private startHeartbeat(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'ping' }));
      }
    }, 25000);
  }

  private scheduleReconnect(): void {
    this.setStatus('RECONNECTING');
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private cleanup(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.ws = null;
  }

  public disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }

  public subscribe(topic: string, callback: MessageCallback): () => void {
    this.activeSubscriptions.add(topic);

    if (!this.messageListeners.has(topic)) {
      this.messageListeners.set(topic, new Set());
    }
    this.messageListeners.get(topic)!.add(callback);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ action: 'subscribe', topic });
    }

    // Return unsubscription function
    return () => {
      const listeners = this.messageListeners.get(topic);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.messageListeners.delete(topic);
          this.activeSubscriptions.delete(topic);
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({ action: 'unsubscribe', topic });
          }
        }
      }
    };
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getLastSyncTime(): string | null {
    return this.lastSynchronizedAt;
  }
}

export const realtimeClient = new RealtimeClient();
