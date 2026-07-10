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
    price: 180000,
    originalPrice: 220000,
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
    price: 190000,
    originalPrice: 230000,
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
    price: 170000,
    originalPrice: 210000,
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
]

export function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + 'đ'
}
