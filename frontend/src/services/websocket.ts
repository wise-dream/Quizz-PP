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
        console.log('🔌 [WebSocket] Attempting to connect to:', this.url);
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('✅ [WebSocket] Connection opened successfully');
          console.log('📊 [WebSocket] Ready state:', this.ws?.readyState);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          console.log('📨 [WebSocket] Message received:', event.data);
          try {
            const data = JSON.parse(event.data);
            console.log('📦 [WebSocket] Parsed data:', data);
            this.messageHandlers.forEach((handler, index) => {
              console.log(`🔄 [WebSocket] Calling handler ${index}:`, handler);
              handler({ type: 'message', data });
            });
          } catch (error) {
            console.error('❌ [WebSocket] Error parsing message:', error);
            console.error('❌ [WebSocket] Raw message:', event.data);
            this.messageHandlers.forEach((handler, index) => {
              console.log(`🔄 [WebSocket] Calling error handler ${index}:`, handler);
              handler({ type: 'error', error: 'Invalid message format' });
            });
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 [WebSocket] Connection closed');
          console.log('📊 [WebSocket] Close code:', event.code);
          console.log('📊 [WebSocket] Close reason:', event.reason);
          console.log('📊 [WebSocket] Was clean:', event.wasClean);
          this.messageHandlers.forEach((handler, index) => {
            console.log(`🔄 [WebSocket] Calling close handler ${index}:`, handler);
            handler({ type: 'close' });
          });
          
          // Only attempt to reconnect if it wasn't a clean close (user-initiated)
          // and if we haven't exceeded max attempts
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`🔄 [WebSocket] Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connect().catch(console.error);
            }, this.reconnectDelay * this.reconnectAttempts);
          } else if (event.wasClean) {
            console.log('🔄 [WebSocket] Clean close, not attempting reconnection');
          } else {
            console.log('❌ [WebSocket] Max reconnection attempts reached');
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ [WebSocket] Connection error:', error);
          console.error('❌ [WebSocket] Error event:', error);
          this.messageHandlers.forEach((handler, index) => {
            console.log(`🔄 [WebSocket] Calling error handler ${index}:`, handler);
            handler({ type: 'error', error: 'Connection error' });
          });
          reject(error);
        };

      } catch (error) {
        console.error('❌ [WebSocket] Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    console.log('🔌 [WebSocket] Disconnecting...');
    if (this.ws) {
      console.log('🔌 [WebSocket] Closing connection');
      this.ws.close();
      this.ws = null;
      console.log('✅ [WebSocket] Disconnected');
    } else {
      console.log('⚠️ [WebSocket] Already disconnected');
    }
  }

  send(event: Event) {
    console.log('📤 [WebSocket] send() called');
    console.log('📤 [WebSocket] Event to send:', event);
    console.log('📊 [WebSocket] Current state:', this.ws?.readyState);
    console.log('📊 [WebSocket] Is connected:', this.isConnected());
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(event);
      console.log('📤 [WebSocket] Sending message:', message);
      console.log('📤 [WebSocket] Message length:', message.length);
      this.ws.send(message);
      console.log('✅ [WebSocket] Message sent successfully');
    } else {
      const errorMsg = `WebSocket is not connected. State: ${this.ws?.readyState}`;
      console.error('❌ [WebSocket]', errorMsg);
      throw new Error(errorMsg);
    }
  }

  onMessage(handler: (message: WebSocketMessage) => void) {
    console.log('📝 [WebSocket] Adding message handler:', handler);
    this.messageHandlers.push(handler);
    console.log('📝 [WebSocket] Total handlers:', this.messageHandlers.length);
    
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        console.log('🗑️ [WebSocket] Removing handler at index:', index);
        this.messageHandlers.splice(index, 1);
        console.log('📝 [WebSocket] Remaining handlers:', this.messageHandlers.length);
      } else {
        console.log('⚠️ [WebSocket] Handler not found for removal');
      }
    };
  }

  isConnected(): boolean {
    const connected = this.ws?.readyState === WebSocket.OPEN;
    console.log('📊 [WebSocket] isConnected():', connected);
    console.log('📊 [WebSocket] Ready state:', this.ws?.readyState);
    return connected;
  }
}
