import { Router, Request, Response, NextFunction } from 'express';
import { catalogService } from '../modules/catalog/catalog.service';
import { cacheMiddleware } from '../middleware/cache';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Cache product listing for 30 seconds (changes frequently with filters)
router.get('/products', cacheMiddleware(30), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await catalogService.getProducts({
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      productType: req.query.productType as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      sellerId: req.query.sellerId as string,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 12,
      sort: req.query.sort as string,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Cache individual product pages for 60 seconds
// Uses optionalAuth so authenticated users get isWishlisted flag
router.get('/products/:slug', optionalAuth, cacheMiddleware(60), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const product = await catalogService.getProductBySlug(req.params.slug, userId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Cache categories for 5 minutes (rarely changes)
router.get('/categories', cacheMiddleware(300), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await catalogService.getCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// Cache category product listings for 30 seconds
router.get('/categories/:slug/products', cacheMiddleware(30), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await catalogService.getCategoryBySlug(req.params.slug);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const result = await catalogService.getProducts({
      categoryId: category.id,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 12,
      sort: req.query.sort as string,
    });
    res.json({ category, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
