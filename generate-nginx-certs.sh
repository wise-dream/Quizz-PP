#!/bin/bash

# SSL Certificate Generation Script for Nginx

echo "🔐 Generating SSL certificates for Nginx..."

# Create nginx ssl directory
mkdir -p nginx/ssl

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out nginx/ssl/key.pem 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key nginx/ssl/key.pem -out nginx/ssl/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
openssl x509 -req -days 365 -in nginx/ssl/cert.csr -signkey nginx/ssl/key.pem -out nginx/ssl/cert.pem

# Clean up CSR file
rm nginx/ssl/cert.csr

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificates location:"
echo "   - Certificate: nginx/ssl/cert.pem"
echo "   - Private Key: nginx/ssl/key.pem"
echo ""
echo "⚠️  Note: These are self-signed certificates for development/testing."
echo "   For production, use certificates from a trusted CA."
echo ""
echo "🚀 You can now start the full stack with:"
echo "   docker-compose --profile production up -d"
