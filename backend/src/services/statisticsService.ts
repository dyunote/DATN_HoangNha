import * as orderModel from '../models/orderModel';
import * as productModel from '../models/productModel';

export const getDashboardStats = async () => {
  const revenueStats = await orderModel.getRevenueStats();
  const topProducts = await productModel.findTopSelling(5);

  return {
    ...revenueStats,
    top_products: topProducts,
  };
};
