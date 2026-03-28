import { PrismaClient, Role, SellerStatus, ProductType, ProductStatus, ReturnPolicy } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Admin User ──────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crochethub.com' },
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
    where: { email: 'buyer@test.com' },
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
    where: { email: 'seller@test.com' },
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

  // Product images from Stitch designs, keyed by slug
  const productImages: Record<string, string> = {
    'crochet-teddy-bear': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbSKaOXBYr5LiWAkLU7I9QiHsBAOn_e7Q5z-rPM_kByU6zwp5dveyAWX7zxiAYCmRH6-2cEwwvJ8ZE5FKoseVlt3SYzM2bSIjjv2KMM9_MnMsomKrLiIu81K_cMfTOva6rL272VaZw6t8GFQ7vR8AxghtbsOHsXDdRmvu4_-Ecj9sjHW977ww5JnkCDJqhfVRkgxbKdOSRK8NT8mdIsiNH2S5Y53vt9LT_fKi3X_WCsqo6ifQeFkj7uy-93XH0PDa-0UJHALrKmA',
    'rainbow-baby-blanket': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZ5JIhgSf7Ga0kkXgUkMRmIDNrKrW2FnP1RMXTXNaJEILAfW3CA699CJEHIBeafstrbQyE1w16St1_v9tWbDh7F8SKEw6HVTLd2YVC8RNxQbmjX31jSxjJENjhNaOBISBJ3ECF4OsxFDSVnvUyjso70Dq0oCaFEZF1RT9aJ4_NUhnnosAM8n4lOdjKrmqY162KIk3vD5GA-6hwLDoLckPEvdUt5d4RdyiOpudeqD18g8RTb5H_rCyb-L8YOnOlSTXJyuIS6JGmnw',
    'bohemian-market-bag': 'https://lh3.googleusercontent.com/aida-public/AB6AXuATM8hIhzbXVvN-0Skb7am9WxJuyxF4_U4mfFD8eZrWf0DJmAqfKg1hm8Jd8amW-pk3HfSKHkJcA4ee4zCKJ0R4u38OzEG45o33b4DvdHjRl_nRMCwCy8yBvBncWCy23GYkNdkfUVxYgZGaySLk8QwXd0FPdDcCo4kAJRgagPxXcAAPfz01FVQPBvJtXTG-pR3fVzKg5EzbN3lrkkByxDjP03faImhqupbC1REBxVYXx8k4Ic9ol3keAqg4QplHKBfkiG_e1ZxOzg',
    'macrame-wall-hanging': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnzE8LajGofEuJBtd8SDDXTf-PPmmLu9ppDZevjvzqTUw9L-6bCjKJpcxOl5PRVNY_TvIhpL6zRR9cmvO_azhG-5TCZLosIUxnli39sfwU_fRr0q8RCWA-zpoJqlvOxqowOEQhdbWVocEMivblTfEtAiThuvRYm5aoZdwsJquFKKlaPMAVBi8zgLSzM7dMNkxZrodDhBh9GI0xRHUy_-tXKQr0_ijRGf_q2bns1k6UVHjt7lNUB1qRqcK2YPeBFkP1f2Ng_2Zu0Q',
  };

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });

    // Add product media if image exists and no media record exists yet
    const imageUrl = productImages[product.slug];
    if (imageUrl) {
      const existingMedia = await prisma.productMedia.findFirst({
        where: { productId: created.id },
      });
      if (!existingMedia) {
        await prisma.productMedia.create({
          data: {
            productId: created.id,
            filePath: imageUrl,
            type: 'IMAGE',
            isPrimary: true,
            sortOrder: 0,
          },
        });
      }
    }
  }
  console.log(`  Products: ${products.length} created (with images)`);

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
