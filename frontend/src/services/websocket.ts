import { Event, WebSocketMessage } from '../types';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => 
              handler({ type: 'message', data })
            );
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            this.messageHandlers.forEach(handler => 
              handler({ type: 'error', error: 'Invalid message format' })
            );
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.messageHandlers.forEach(handler => 
            handler({ type: 'close' })
          );
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
              this.connect().catch(console.error);
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.messageHandlers.forEach(handler => 
            handler({ type: 'error', error: 'Connection error' })
          );
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(event: Event) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  onMessage(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.push(handler);
    
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
