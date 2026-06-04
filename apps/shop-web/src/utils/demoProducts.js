export const demoProducts = [
  {
    id: 9001,
    productName: 'Vier Oversized Street Tee',
    productPrice: 899,
    category: 'tops',
    section: 'men',
    stocks: 18,
    imageUrl: '/images/oversizedshirt.jpg',
    description: 'A clean everyday tee styled for the live portfolio demo catalog.'
  },
  {
    id: 9002,
    productName: 'Soft Washed Graphic Shirt',
    productPrice: 1099,
    category: 'tops',
    section: 'men',
    stocks: 12,
    imageUrl: '/images/softwashedgraphicshirt.jpg',
    description: 'Relaxed graphic shirt with a checkout-ready storefront feel.'
  },
  {
    id: 9003,
    productName: 'Wide Leg Denim',
    productPrice: 1599,
    category: 'bottoms',
    section: 'women',
    stocks: 9,
    imageUrl: '/images/widelegdenim.jpg',
    description: 'A demo staple for browsing sizes, favorites, and cart flows.'
  },
  {
    id: 9004,
    productName: 'Canvas Tote Bag',
    productPrice: 699,
    category: 'bags',
    section: 'accessories',
    stocks: 24,
    imageUrl: '/images/canvas_totebag.jpg',
    description: 'Accessory sample item used when the shop backend is sleeping.'
  },
  {
    id: 9005,
    productName: 'Palermo Green Sneakers',
    productPrice: 3299,
    category: 'footwear',
    section: 'footwear',
    stocks: 7,
    imageUrl: '/images/palermogreen.jpg',
    description: 'Statement footwear for the fallback storefront catalog.'
  },
  {
    id: 9006,
    productName: 'Leather Messenger Bag',
    productPrice: 2499,
    category: 'bags',
    section: 'accessories',
    stocks: 5,
    imageUrl: '/images/leathermessengerbag.jpg',
    description: 'A polished bag item to keep the ecommerce prototype browsable.'
  }
];

const lower = (value = '') => value.toLowerCase();

export const getDemoProducts = ({ scope = 'all', section, category } = {}) => {
  return demoProducts.filter((product) => {
    if (scope === 'section') return lower(product.section) === lower(section);
    if (scope === 'category') return lower(product.category) === lower(category);
    if (scope === 'categorySection') return lower(product.section) === lower(section) && lower(product.category) === lower(category);
    return true;
  });
};

export const getDemoProductById = (id) => demoProducts.find((product) => String(product.id) === String(id)) || demoProducts[0];
