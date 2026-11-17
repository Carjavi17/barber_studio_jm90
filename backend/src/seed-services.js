import { prisma } from './lib/prisma.js';

const services = [
  { name: 'Aseo de barba', durationMinutes: 30, price: 20000 },
  { name: 'Corte + aseo de barba', durationMinutes: 60, price: 30000 },
  { name: 'Corte + barba', durationMinutes: 30, price: 26000 },
  { name: 'Corte de Cabello', durationMinutes: 30, price: 22000 },
  { name: 'Corte de niño', durationMinutes: 30, price: 20000 },
  // The price arrived as "$1": hidden until the real price is set from the app
  { name: 'Corte padre e hijo', durationMinutes: 60, price: 1, isActive: false },
];

const count = await prisma.service.count();

if (count > 0) {
  console.log('Ya hay servicios cargados, no se hace nada.');
} else {
  await prisma.service.createMany({ data: services });
  console.log(`Se cargaron ${services.length} servicios.`);
}

await prisma.$disconnect();