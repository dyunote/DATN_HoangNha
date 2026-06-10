// Tien ich: tao bcrypt hash cho mat khau, dung khi can them user thu cong vao DB
// Cach dung: npm run hash -- "matkhaucuaban"
import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.log('Cach dung: npm run hash -- "mat_khau_can_hash"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log(hash);
