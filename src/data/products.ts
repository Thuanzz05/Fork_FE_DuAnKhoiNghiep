export interface Product {
  id: string
  slug: string
  name: string
  nameEn: string
  category: string
  categorySlug: string
  image: string
  price: number
  originalPrice?: number
  discount?: number
  weight: string
  origin: string
  description: string
  mainIngredients: string[]
  tags: string[]
  isCombo?: boolean
}

export const categories = [
  { name: 'Tất cả sản phẩm', slug: 'tat-ca' },
  { name: 'Sữa rửa mặt', slug: 'sua-rua-mat' },
  { name: 'Mặt nạ', slug: 'mat-na' },
  { name: 'Toner', slug: 'toner' },
  { name: 'Combo', slug: 'combo' },
]

export const products: Product[] = [
  {
    id: '1',
    slug: 'combo-cham-soc-da-toan-dien-dau-do-3-mon-150g',
    name: 'Combo chăm sóc da toàn diện đậu đỏ 3 món 150g',
    nameEn: 'Red Bean Complete Skincare Combo',
    category: 'Combo',
    categorySlug: 'combo',
    image: '/images/products/combo-3mon6.jpg',
    price: 450000,
    originalPrice: 550000,
    discount: 18,
    weight: '150g x 3',
    origin: 'Việt Nam',
    description:
      'Bộ combo gồm Sữa rửa mặt tạo bọt đậu đỏ, Mặt nạ tẩy tế bào chết đậu đỏ và Toner dưỡng da đậu đỏ. Combo chăm sóc da toàn diện, phù hợp cho mọi loại da. Không Sulfate, không Paraben, không Alcohol.',
    mainIngredients: ['Bột đậu đỏ', 'Bột cám gạo', 'Chiết xuất nghệ', 'Nước hoa hồng'],
    tags: ['Không Sulfate', 'Không Paraben', 'Không Alcohol'],
    isCombo: true,
  },
  {
    id: '2',
    slug: 'sua-rua-mat-tao-bot-dau-do-150g',
    name: 'Sữa rửa mặt tạo bọt đậu đỏ 150g',
    nameEn: 'Red Bean Foaming Facial Cleanser',
    category: 'Sữa rửa mặt',
    categorySlug: 'sua-rua-mat',
    image: '/images/products/sua-rua-mat-tao-bot3.jpg',
    price: 220000,
    originalPrice: 270000,
    discount: 18,
    weight: '150g',
    origin: 'Việt Nam',
    description:
      'Sữa rửa mặt tạo bọt giúp làm sạch da mặt, loại bỏ bụi bẩn, bã nhờn, mồ hôi trên da một cách dịu nhẹ. Giúp da ẩm mượt, mềm mại và trông sáng mịn. Chiết xuất đậu đỏ Việt Nam kết hợp hoa cúc La Mã.',
    mainIngredients: ['Chiết xuất đậu đỏ', 'Chiết xuất hoa cúc La Mã', 'Niacinamide', 'Panthenol'],
    tags: ['Làm sạch sâu', 'Dưỡng ẩm', 'Sáng da'],
  },
  {
    id: '3',
    slug: 'mat-na-tay-te-bao-chet-dau-do-150g',
    name: 'Mặt nạ tẩy tế bào chết đậu đỏ 150g',
    nameEn: 'Red Bean Exfoliating Mask',
    category: 'Mặt nạ',
    categorySlug: 'mat-na',
    image: '/images/products/mat-na-tay-te-bao-chet6.jpg',
    price: 250000,
    originalPrice: 300000,
    discount: 17,
    weight: '150g',
    origin: 'Việt Nam',
    description:
      'Mặt nạ giúp làm sạch và loại bỏ bụi bẩn, tế bào chết trên da, giúp da ẩm mượt, góp phần mang lại một làn da sáng khỏe, mềm mại. Đặc biệt phù hợp cho làn da xỉn màu.',
    mainIngredients: ['Hyaluronic Acid', 'Niacinamide', 'Bột đậu đỏ', 'Bột cám gạo'],
    tags: ['Tẩy tế bào chết', 'Sáng da', 'Dưỡng ẩm'],
  },
  {
    id: '4',
    slug: 'toner-duong-da-dau-do',
    name: 'Toner dưỡng da đậu đỏ',
    nameEn: 'Red Bean Moisturizing Toner',
    category: 'Toner',
    categorySlug: 'toner',
    image: '/images/products/toner-duong-da4.jpg',
    price: 220000,
    originalPrice: 270000,
    discount: 19,
    weight: '150g',
    origin: 'Việt Nam',
    description:
      'Toner giúp dưỡng ẩm, giúp làn da ẩm mượt, mềm mại. Giúp làm dịu da khi bị khô căng, ửng đỏ, ngứa rát. Đã được kiểm nghiệm da liễu theo tiêu chuẩn Nhật Bản.',
    mainIngredients: ['Chiết xuất đậu đỏ', 'Chiết xuất hoa cúc La Mã', 'Chiết xuất rễ Cam Thảo', 'Nước hoa hồng'],
    tags: ['Dưỡng ẩm', 'Làm dịu da', 'Cân bằng pH'],
  },
  {
    id: '5',
    slug: 'combo-duong-da-dau-do-mini',
    name: 'Bộ combo dưỡng da đậu đỏ mini',
    nameEn: 'Red Bean Mini Skincare Set',
    category: 'Combo',
    categorySlug: 'combo',
    image: '/images/products/combo-duong-da-mini4.png',
    price: 250000,
    originalPrice: 320000,
    discount: 22,
    weight: 'Mini size',
    origin: 'Việt Nam',
    description:
      'Bộ combo mini tiện lợi mang theo khi du lịch, bao gồm phiên bản nhỏ gọn của Sữa rửa mặt, Mặt nạ tẩy tế bào chết và Toner đậu đỏ. Trải nghiệm trọn bộ chăm sóc da đậu đỏ.',
    mainIngredients: ['Bột đậu đỏ', 'Bột cám gạo', 'Chiết xuất nghệ', 'Nước hoa hồng'],
    tags: ['Mini size', 'Tiện lợi', 'Quà tặng'],
    isCombo: true,
  },
  {
    id: '6',
    slug: 'serum-dau-do-duong-sang-da',
    name: 'Serum Đậu Đỏ Dưỡng sáng da',
    nameEn: 'Red Bean Brightening Serum',
    category: 'Toner',
    categorySlug: 'toner',
    image: '/images/products/toner-duong-da6.png',
    price: 280000,
    originalPrice: 350000,
    discount: 20,
    weight: '30ml',
    origin: 'Việt Nam',
    description: 'Serum dưỡng sáng da từ đậu đỏ giúp cải thiện làn da xỉn màu, dưỡng ẩm sâu và đem lại sự trẻ trung, đều màu cho làn da của bạn.',
    mainIngredients: ['Chiết xuất đậu đỏ', 'Vitamin B3', 'Hyaluronic Acid'],
    tags: ['Dưỡng sáng da', 'Mờ thâm', 'Cấp ẩm'],
  },
  {
    id: '7',
    slug: 'kem-duong-am-dau-do',
    name: 'Kem dưỡng ẩm Cấp ẩm, mịn da',
    nameEn: 'Red Bean Moisturizing Cream',
    category: 'Toner',
    categorySlug: 'toner',
    image: '/images/products/combo-duong-da-mini.png',
    price: 290000,
    originalPrice: 360000,
    discount: 19,
    weight: '50g',
    origin: 'Việt Nam',
    description: 'Kem dưỡng ẩm đậu đỏ giúp duy trì độ ẩm tự nhiên, tăng độ đàn hồi và làm dịu làn da nhạy cảm.',
    mainIngredients: ['Bột đậu đỏ', 'Ceramide', 'Shea Butter'],
    tags: ['Cấp ẩm', 'Mịn da', 'Dịu nhẹ'],
  },
  {
    id: '8',
    slug: 'tay-trang-dau-do-lam-sach-sau',
    name: 'Tẩy trang dịu nhẹ Làm sạch sâu',
    nameEn: 'Red Bean Gentle Cleansing Water',
    category: 'Sữa rửa mặt',
    categorySlug: 'sua-rua-mat',
    image: '/images/products/sua-rua-mat-tao-bot2.png',
    price: 240000,
    originalPrice: 300000,
    discount: 20,
    weight: '200ml',
    origin: 'Việt Nam',
    description: 'Nước tẩy trang đậu đỏ làm sạch sâu lớp trang điểm và bụi bẩn bám trên da mà không gây khô rát, an toàn cho mọi loại da.',
    mainIngredients: ['Chiết xuất đậu đỏ', 'Nước khoáng tự nhiên', 'Glycerin'],
    tags: ['Tẩy trang', 'Làm sạch sâu', 'Dịu nhẹ'],
  },
]

export function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + 'đ'
}
