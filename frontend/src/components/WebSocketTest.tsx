import React, { useState, useEffect } from 'react';

export const WebSocketTest: React.FC = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<string>('Disconnected');
  const [messages, setMessages] = useState<string[]>([]);
  const [testUrl, setTestUrl] = useState('ws://localhost:3000/ws');

  const connect = () => {
    try {
      console.log('Attempting to connect to:', testUrl);
      const websocket = new WebSocket(testUrl);
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
        setStatus('Connected');
        setMessages(prev => [...prev, 'Connected to WebSocket']);
      };
      
      websocket.onmessage = (event) => {
        console.log('Received message:', event.data);
        setMessages(prev => [...prev, `Received: ${event.data}`]);
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('Error');
        setMessages(prev => [...prev, `Error: ${error}`]);
      };
      
      websocket.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setStatus('Disconnected');
        setMessages(prev => [...prev, `Closed: ${event.code} ${event.reason}`]);
      };
      
      setWs(websocket);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setStatus('Error');
      setMessages(prev => [...prev, `Failed to create WebSocket: ${error}`]);
    }
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  };

  const sendTestMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'create_room',
        timestamp: Date.now()
      };
      console.log('Sending test message:', message);
      ws.send(JSON.stringify(message));
      setMessages(prev => [...prev, `Sent: ${JSON.stringify(message)}`]);
    } else {
      setMessages(prev => [...prev, 'Cannot send: WebSocket not connected']);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">WebSocket Connection Test</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">WebSocket URL:</label>
        <input
          type="text"
          value={testUrl}
          onChange={(e) => setTestUrl(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-4 flex gap-2">
        <button
          onClick={connect}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Connect
        </button>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Disconnect
        </button>
        <button
          onClick={sendTestMessage}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Send Test Message
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-lg">
          Status: <span className={`font-bold ${
            status === 'Connected' ? 'text-green-600' : 
            status === 'Error' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {status}
          </span>
        </p>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Messages:</h2>
        <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className="text-sm mb-1">
              {msg}
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p><strong>WebSocket States:</strong></p>
        <ul className="list-disc list-inside">
          <li>0 = CONNECTING</li>
          <li>1 = OPEN</li>
          <li>2 = CLOSING</li>
          <li>3 = CLOSED</li>
        </ul>
        <p className="mt-2">
          <strong>Current state:</strong> {ws?.readyState ?? 'N/A'}
        </p>
      </div>
    </div>
  );
};
