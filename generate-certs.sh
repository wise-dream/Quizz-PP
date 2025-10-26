#!/bin/bash

# SSL Certificate Generation Script for PowerPoint Quiz Server

echo "🔐 Generating SSL certificates for PowerPoint Quiz Server..."

# Create certs directory
mkdir -p certs

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out certs/key.pem 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key certs/key.pem -out certs/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
openssl x509 -req -days 365 -in certs/cert.csr -signkey certs/key.pem -out certs/cert.pem

# Clean up CSR file
rm certs/cert.csr

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificates location:"
echo "   - Certificate: certs/cert.pem"
echo "   - Private Key: certs/key.pem"
echo ""
echo "⚠️  Note: These are self-signed certificates for development/testing."
echo "   For production, use certificates from a trusted CA."
echo ""
echo "🚀 You can now start the server with:"
echo "   docker-compose up -d"
