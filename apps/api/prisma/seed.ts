import { PrismaClient, Role, SellerStatus, ProductType, ProductStatus, ReturnPolicy } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Admin User ──────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { uq_users_email_active: { email: 'admin@crochethub.com', deletedAt: null } },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@crochethub.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`  Admin user: ${admin.email}`);

  // ─── Test Buyer ──────────────────────────────────
  const buyerPassword = await bcrypt.hash('buyer123456', 12);
  const buyer = await prisma.user.upsert({
    where: { uq_users_email_active: { email: 'buyer@test.com', deletedAt: null } },
    update: {},
    create: {
      name: 'Test Buyer',
      email: 'buyer@test.com',
      passwordHash: buyerPassword,
      role: Role.BUYER,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`  Buyer user: ${buyer.email}`);

  // ─── Test Seller ─────────────────────────────────
  const sellerPassword = await bcrypt.hash('seller123456', 12);
  const sellerUser = await prisma.user.upsert({
    where: { uq_users_email_active: { email: 'seller@test.com', deletedAt: null } },
    update: {},
    create: {
      name: 'Craft Corner',
      email: 'seller@test.com',
      passwordHash: sellerPassword,
      role: Role.SELLER,
      emailVerifiedAt: new Date(),
    },
  });

  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      businessName: 'Craft Corner Studio',
      description: 'Handmade crochet items with love and care. Specializing in amigurumi and home decor.',
      status: SellerStatus.APPROVED,
      approvedBy: admin.id,
      approvedAt: new Date(),
      commissionRate: 1500, // 15%
    },
  });
  console.log(`  Seller user: ${sellerUser.email} (profile: ${sellerProfile.businessName})`);

  // ─── Categories ──────────────────────────────────
  const categories = [
    { name: 'Amigurumi', slug: 'amigurumi' },
    { name: 'Blankets & Throws', slug: 'blankets-throws' },
    { name: 'Bags & Accessories', slug: 'bags-accessories' },
    { name: 'Home Decor', slug: 'home-decor' },
    { name: 'Baby & Kids', slug: 'baby-kids' },
    { name: 'Clothing & Wearables', slug: 'clothing-wearables' },
    { name: 'Seasonal & Holiday', slug: 'seasonal-holiday' },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
  }
  console.log(`  Categories: ${createdCategories.length} created`);

  // ─── Sample Products ─────────────────────────────
  const products = [
    {
      sellerProfileId: sellerProfile.id,
      categoryId: createdCategories[0].id, // Amigurumi
      name: 'Crochet Teddy Bear',
      slug: 'crochet-teddy-bear',
      description: 'Adorable handmade crochet teddy bear, perfect for gifts. Made with premium cotton yarn in a smoke-free environment. Approximately 12 inches tall.',
      productType: ProductType.READY_STOCK,
      priceInCents: 89900, // ₹899
      stockQuantity: 5,
      returnPolicy: ReturnPolicy.DEFECT_ONLY,
      status: ProductStatus.APPROVED,
      approvedBy: admin.id,
      approvedAt: new Date(),
      meta: { materials: ['Cotton yarn', 'Polyester fill'], dimensions: '12 inches', weight: '150g' },
    },
    {
      sellerProfileId: sellerProfile.id,
      categoryId: createdCategories[1].id, // Blankets
      name: 'Rainbow Baby Blanket',
      slug: 'rainbow-baby-blanket',
      description: 'Soft, cozy baby blanket in beautiful rainbow colors. Hand-crocheted with baby-safe yarn. Machine washable.',
      productType: ProductType.MADE_TO_ORDER,
      priceInCents: 249900, // ₹2,499
      leadTimeDays: 7,
      returnPolicy: ReturnPolicy.NO_RETURN,
      status: ProductStatus.APPROVED,
      approvedBy: admin.id,
      approvedAt: new Date(),
      meta: { materials: ['Baby-safe acrylic yarn'], dimensions: '36x48 inches', weight: '400g' },
    },
    {
      sellerProfileId: sellerProfile.id,
      categoryId: createdCategories[2].id, // Bags
      name: 'Bohemian Market Bag',
      slug: 'bohemian-market-bag',
      description: 'Stylish and sturdy crochet market bag with bohemian pattern. Perfect for groceries, beach trips, or everyday use.',
      productType: ProductType.READY_STOCK,
      priceInCents: 59900, // ₹599
      stockQuantity: 8,
      returnPolicy: ReturnPolicy.DEFECT_ONLY,
      status: ProductStatus.APPROVED,
      approvedBy: admin.id,
      approvedAt: new Date(),
      meta: { materials: ['Jute and cotton blend'], dimensions: '14x16 inches', weight: '200g' },
    },
    {
      sellerProfileId: sellerProfile.id,
      categoryId: createdCategories[3].id, // Home Decor
      name: 'Macrame Wall Hanging',
      slug: 'macrame-wall-hanging',
      description: 'Beautiful macrame and crochet fusion wall hanging. Adds a boho touch to any room.',
      productType: ProductType.MADE_TO_ORDER,
      priceInCents: 149900, // ₹1,499
      leadTimeDays: 10,
      returnPolicy: ReturnPolicy.NO_RETURN,
      status: ProductStatus.APPROVED,
      approvedBy: admin.id,
      approvedAt: new Date(),
      meta: { materials: ['Natural cotton cord', 'Wooden dowel'], dimensions: '24x36 inches' },
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }
  console.log(`  Products: ${products.length} created`);

  // ─── Buyer Address ───────────────────────────────
  const existingAddress = await prisma.address.findFirst({ where: { userId: buyer.id } });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: buyer.id,
        label: 'Home',
        line1: '42 MG Road',
        line2: 'Apt 301',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'IN',
        isDefault: true,
      },
    });
    console.log('  Buyer address created');
  }

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
