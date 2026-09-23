// generar-certs.js
// Ejecutar con: node generar-certs.js
// Genera certs/key.pem y certs/cert.pem para HTTPS local con Vite 5

const forge = require('node-forge');
const fs    = require('fs');

console.log('Generando certificado autofirmado...');

// Par de claves RSA 2048
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();

cert.publicKey    = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter  = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

const attrs = [
  { name: 'commonName',       value: 'localhost' },
  { name: 'organizationName', value: 'Dev Local'  },
];

cert.setSubject(attrs);
cert.setIssuer(attrs);

cert.setExtensions([
  { name: 'basicConstraints', cA: true },
  { name: 'subjectAltName', altNames: [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1'   },
  ]},
]);

cert.sign(keys.privateKey, forge.md.sha256.create());

fs.mkdirSync('certs', { recursive: true });
fs.writeFileSync('certs/key.pem',  forge.pki.privateKeyToPem(keys.privateKey));
fs.writeFileSync('certs/cert.pem', forge.pki.certificateToPem(cert));

console.log('OK - certs/key.pem y certs/cert.pem generados correctamente');
