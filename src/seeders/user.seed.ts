// import { registerService } from '@services/user.service';
// import { type UserRequest } from '@models/user.model';

// const seedUsers = async () => {
//   const users: UserRequest[] = [
//     {
//       username: 'cici',
//       password: 'strongpassword123',
//       role: 'finance',
//     },
//     {
//       username: 'iwan',
//       password: 'strongpassword123',
//       role: 'management',
//     },
//     {
//       username: 'vivo',
//       password: 'strongpassword123',
//       role: 'management',
//     },
//   ];

//   for (const user of users) {
//     try {
//       await registerService(user);
//       console.log(`User ${user.username} berhasil didaftarkan`);
//     } catch (error) {
//       console.error(`Gagal mendaftar user ${user.username}:`, error);
//     }
//   }
// };

// seedUsers()
//   .then(() => {
//     console.log('Seeder selesai');
//     process.exit(0);
//   })
//   .catch(() => {
//     process.exit(1);
//   });
