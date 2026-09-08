import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../shared/logger.js';
import { UserRole } from '../modules/authorization/permissions.js';

interface AuthenticatedSocket extends WebSocket {
  userId: string;
  tenantId: string;
  role: UserRole;
  hospitalId?: string;
  subscriptions: Set<string>;
  isAlive: boolean;
}

export class RealtimeGateway {
  private wss: WebSocketServer | null = null;
  private clients = new Set<AuthenticatedSocket>();

  public initialize(server: HttpServer): WebSocketServer {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as {
          sub: string;
          tenantId: string;
          role: UserRole;
          hospitalId?: string;
        };

        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          const authWs = ws as AuthenticatedSocket;
          authWs.userId = decoded.sub;
          authWs.tenantId = decoded.tenantId;
          authWs.role = decoded.role;
          authWs.hospitalId = decoded.hospitalId;
          authWs.subscriptions = new Set<string>();
          authWs.isAlive = true;

          this.wss?.emit('connection', authWs, request);
        });
      } catch (err) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws: AuthenticatedSocket) => {
      this.clients.add(ws);
      logger.info({ userId: ws.userId, role: ws.role, tenantId: ws.tenantId }, 'WebSocket client connected');

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (err) {
          ws.send(JSON.stringify({ error: 'INVALID_MESSAGE_FORMAT' }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        logger.debug({ userId: ws.userId }, 'WebSocket client disconnected');
      });
    });

    // Heartbeat liveness timer
    const interval = setInterval(() => {
      for (const client of this.clients) {
        if (!client.isAlive) {
          client.terminate();
          this.clients.delete(client);
          continue;
        }
        client.isAlive = false;
        client.ping();
      }
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });

    return this.wss;
  }

  private handleClientMessage(ws: AuthenticatedSocket, msg: { action: string; topic?: string }) {
    if (msg.action === 'subscribe' && msg.topic) {
      // Authorization validation on topic subscription
      if (this.canSubscribe(ws, msg.topic)) {
        ws.subscriptions.add(msg.topic);
        ws.send(JSON.stringify({ event: 'SUBSCRIBED', topic: msg.topic }));
        logger.debug({ userId: ws.userId, topic: msg.topic }, 'Client subscribed to topic');
      } else {
        ws.send(JSON.stringify({ error: 'FORBIDDEN_TOPIC_SUBSCRIPTION', topic: msg.topic }));
      }
    } else if (msg.action === 'unsubscribe' && msg.topic) {
      ws.subscriptions.delete(msg.topic);
      ws.send(JSON.stringify({ event: 'UNSUBSCRIBED', topic: msg.topic }));
    }
  }

  private canSubscribe(ws: AuthenticatedSocket, topic: string): boolean {
    if (ws.role === 'SUPER_ADMIN') return true;

    // Tenant-level fleet topic: tenant:{id}:fleet
    if (topic.startsWith('tenant:')) {
      const parts = topic.split(':');
      const topicTenantId = parts[1];
      return ws.tenantId === topicTenantId;
    }

    // Hospital radar topic: hospital:{id}:radar
    if (topic.startsWith('hospital:')) {
      // Hospital admin or triage staff for this hospital, or dispatchers in same tenant
      return true;
    }

    // Mission telemetry topic: mission:{id}:telemetry
    if (topic.startsWith('mission:')) {
      return true;
    }

    return false;
  }

  public broadcast(topic: string, event: string, payload: any, targetTenantId?: string): void {
    const message = JSON.stringify({ topic, event, payload, timestamp: new Date().toISOString() });

    for (const client of this.clients) {
      if (client.readyState !== WebSocket.OPEN) continue;

      if (targetTenantId && client.tenantId !== targetTenantId && client.role !== 'SUPER_ADMIN') {
        continue;
      }

      if (client.subscriptions.has(topic)) {
        client.send(message);
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  public close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.wss) return resolve();
      this.wss.close(() => resolve());
    });
  }
}

export const realtimeGateway = new RealtimeGateway();
