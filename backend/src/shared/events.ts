import { EventEmitter } from 'events';
import { logger } from './logger.js';

export interface DomainEvent<T = any> {
  eventId: string;
  eventType: string;
  aggregateId: string;
  tenantId?: string;
  actorId?: string;
  occurredAt: string;
  payload: T;
  correlationId?: string;
}

export type DomainEventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

export class DomainEventBus {
  private static instance: DomainEventBus;
  private emitter = new EventEmitter();

  private constructor() {
    this.emitter.setMaxListeners(50);
  }

  public static getInstance(): DomainEventBus {
    if (!DomainEventBus.instance) {
      DomainEventBus.instance = new DomainEventBus();
    }
    return DomainEventBus.instance;
  }

  public publish<T>(event: DomainEvent<T>): void {
    logger.debug({ eventType: event.eventType, aggregateId: event.aggregateId }, 'Publishing domain event');
    this.emitter.emit(event.eventType, event);
    this.emitter.emit('*', event);
  }

  public subscribe<T>(eventType: string, handler: DomainEventHandler<T>): void {
    this.emitter.on(eventType, async (event: DomainEvent<T>) => {
      try {
        await handler(event);
      } catch (err) {
        logger.error({ err, eventType, eventId: event.eventId }, 'Error handling domain event');
      }
    });
  }

  public clearAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

export const eventBus = DomainEventBus.getInstance();
