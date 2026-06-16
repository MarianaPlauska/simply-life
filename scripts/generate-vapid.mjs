// Gera par de chaves VAPID para Web Push — cole no .env.local / Vercel
import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('Adicione ao .env.local e ao Vercel (Environment Variables):\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:seu-email@dominio.com');
