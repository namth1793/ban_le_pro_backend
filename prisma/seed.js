const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function dateAt(daysAgo, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function expiry(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

let orderSeq = 1;
function orderNum() {
  return `ORD${String(orderSeq++).padStart(5, '0')}`;
}

async function main() {
  console.log('🗑  Xoá dữ liệu cũ...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.userShop.deleteMany({});
  await prisma.shop.deleteMany({});
  await prisma.user.deleteMany({});

  // ─── USERS ────────────────────────────────────────────────────
  console.log('👤 Tạo users...');
  const pw = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.create({
    data: { email: 'owner@demo.com', password: pw, fullName: 'Nguyễn Minh Tâm', phone: '0901234567', role: 'OWNER' }
  });
  const staff1 = await prisma.user.create({
    data: { email: 'staff1@demo.com', password: pw, fullName: 'Trần Thị Lan', phone: '0912345678', role: 'STAFF' }
  });
  const staff2 = await prisma.user.create({
    data: { email: 'staff2@demo.com', password: pw, fullName: 'Lê Văn Bình', phone: '0923456789', role: 'STAFF' }
  });

  // ─── SHOP ─────────────────────────────────────────────────────
  console.log('🏪 Tạo cửa hàng...');
  const shop = await prisma.shop.create({
    data: {
      name: 'Tạp Hóa Minh Tâm',
      code: 'SHOP001',
      businessType: 'tapHoa',
      address: '123 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM',
      phone: '028-3456-7890',
      email: 'taphoaminhtam@gmail.com',
      taxCode: '0312345678',
      maxProducts: 999999,
      maxStaff: 10,
      subscription: {
        create: {
          planType: 'BASIC',
          startedAt: dateAt(30),
          expiresAt: expiry(335),
          status: 'ACTIVE',
          autoRenew: true
        }
      }
    }
  });

  await prisma.userShop.createMany({
    data: [
      { userId: owner.id,  shopId: shop.id, role: 'OWNER' },
      { userId: staff1.id, shopId: shop.id, role: 'STAFF' },
      { userId: staff2.id, shopId: shop.id, role: 'STAFF' }
    ]
  });

  await prisma.staff.createMany({
    data: [
      { userId: staff1.id, shopId: shop.id, role: 'SALES',     permissions: JSON.stringify(['orders', 'products.view']), isActive: true },
      { userId: staff2.id, shopId: shop.id, role: 'INVENTORY', permissions: JSON.stringify(['products', 'inventory']), isActive: true }
    ]
  });

  // ─── PRODUCTS ─────────────────────────────────────────────────
  console.log('📦 Tạo sản phẩm...');
  const productDefs = [
    // ── Thực phẩm ──
    { code:'SP001', name:'Mì gói Hảo Hảo tôm chua cay',   price:3500,   cost:2800,  stock:200, lowStockThreshold:20, category:'Thực phẩm',         unit:'gói',  expiryDate: expiry(180) },
    { code:'SP002', name:'Mì gói 3 Miền thịt bằm',        price:4000,   cost:3200,  stock:150, lowStockThreshold:20, category:'Thực phẩm',         unit:'gói',  expiryDate: expiry(180) },
    { code:'SP003', name:'Phở gói Vifon bò 75g',           price:5000,   cost:3800,  stock:120, lowStockThreshold:15, category:'Thực phẩm',         unit:'gói',  expiryDate: expiry(150) },
    { code:'SP004', name:'Gạo thơm ST25 5kg',              price:95000,  cost:78000, stock:45,  lowStockThreshold:10, category:'Thực phẩm',         unit:'túi' },
    { code:'SP005', name:'Muối iốt Cánh Buồm 1kg',        price:5000,   cost:3500,  stock:80,  lowStockThreshold:10, category:'Thực phẩm',         unit:'gói' },
    // ── Đồ uống ──
    { code:'SP006', name:'Coca Cola lon 330ml',            price:10000,  cost:7500,  stock:144, lowStockThreshold:24, category:'Đồ uống',           unit:'lon' },
    { code:'SP007', name:'Pepsi lon 330ml',                price:9000,   cost:7000,  stock:96,  lowStockThreshold:24, category:'Đồ uống',           unit:'lon' },
    { code:'SP008', name:'Bia Tiger lon 330ml',            price:13000,  cost:10000, stock:240, lowStockThreshold:24, category:'Đồ uống',           unit:'lon' },
    { code:'SP009', name:'Nước suối Aquafina 500ml',       price:8000,   cost:5500,  stock:200, lowStockThreshold:24, category:'Đồ uống',           unit:'chai' },
    { code:'SP010', name:'Cà phê G7 3in1 hộp 21 gói',    price:65000,  cost:50000, stock:45,  lowStockThreshold:10, category:'Đồ uống',           unit:'hộp' },
    { code:'SP011', name:'Trà Lipton túi lọc 100 túi',    price:45000,  cost:35000, stock:30,  lowStockThreshold:5,  category:'Đồ uống',           unit:'hộp' },
    // ── Sữa ──
    { code:'SP012', name:'Sữa tươi Vinamilk có đường 1L', price:35000,  cost:28000, stock:60,  lowStockThreshold:12, category:'Sữa & chế phẩm',   unit:'hộp',  expiryDate: expiry(30) },
    { code:'SP013', name:'Sữa đặc Ông Thọ 380g',          price:25000,  cost:20000, stock:80,  lowStockThreshold:10, category:'Sữa & chế phẩm',   unit:'lon' },
    { code:'SP014', name:'Sữa Milo hộp 1L',               price:42000,  cost:33000, stock:35,  lowStockThreshold:8,  category:'Sữa & chế phẩm',   unit:'hộp',  expiryDate: expiry(45) },
    { code:'SP015', name:'Yaourt Vinamilk dâu 100g',      price:6500,   cost:5000,  stock:6,   lowStockThreshold:12, category:'Sữa & chế phẩm',   unit:'hộp',  expiryDate: expiry(14) }, // LOW STOCK + sắp hết hạn
    // ── Bánh kẹo ──
    { code:'SP016', name:'Bánh Oreo vị kem sữa 133g',     price:18000,  cost:14000, stock:90,  lowStockThreshold:10, category:'Bánh kẹo',          unit:'gói' },
    { code:'SP017', name:'Kẹo mềm Alpenliebe dâu',        price:2000,   cost:1500,  stock:300, lowStockThreshold:50, category:'Bánh kẹo',          unit:'viên' },
    { code:'SP018', name:'Snack khoai tây Poca vị phô mai 40g', price:10000, cost:7500, stock:70, lowStockThreshold:15, category:'Bánh kẹo',       unit:'gói' },
    { code:'SP019', name:'Socola KitKat 2 thanh',         price:15000,  cost:11000, stock:5,   lowStockThreshold:10, category:'Bánh kẹo',          unit:'cái',  expiryDate: expiry(55) }, // LOW STOCK
    { code:'SP020', name:'Bánh quy Bourbon kem vani 56g', price:15000,  cost:11500, stock:55,  lowStockThreshold:10, category:'Bánh kẹo',          unit:'gói' },
    // ── Hóa phẩm ──
    { code:'SP021', name:'Bột giặt Ariel Matic 2.4kg',   price:95000,  cost:78000, stock:25,  lowStockThreshold:5,  category:'Hóa phẩm',          unit:'túi' },
    { code:'SP022', name:'Nước rửa chén Sunlight 750ml', price:32000,  cost:25000, stock:40,  lowStockThreshold:8,  category:'Hóa phẩm',          unit:'chai' },
    { code:'SP023', name:'Xà phòng tắm Dove 90g',        price:16000,  cost:12500, stock:50,  lowStockThreshold:10, category:'Hóa phẩm',          unit:'cục' },
    { code:'SP024', name:'Nước lau sàn Sunhouse 1L',     price:25000,  cost:19000, stock:4,   lowStockThreshold:8,  category:'Hóa phẩm',          unit:'chai' }, // LOW STOCK
    { code:'SP025', name:'Giấy vệ sinh Bless You 10 cuộn', price:45000, cost:35000, stock:30, lowStockThreshold:6,  category:'Hóa phẩm',          unit:'gói' },
    // ── Chăm sóc cá nhân ──
    { code:'SP026', name:'Dầu gội Sunsilk mềm mượt 650ml', price:78000, cost:60000, stock:35, lowStockThreshold:6, category:'Chăm sóc cá nhân',  unit:'chai' },
    { code:'SP027', name:'Sữa tắm Dove dưỡng ẩm 530g',  price:80000,  cost:62000, stock:20,  lowStockThreshold:5,  category:'Chăm sóc cá nhân',  unit:'chai' },
    { code:'SP028', name:'Kem đánh răng P/S bạc hà 250g', price:32000, cost:25000, stock:45, lowStockThreshold:8,  category:'Chăm sóc cá nhân',  unit:'tuýp' },
    { code:'SP029', name:'Dao cạo râu Gillette vỉ 5 cái', price:25000, cost:18000, stock:3,  lowStockThreshold:5,  category:'Chăm sóc cá nhân',  unit:'vỉ' }, // LOW STOCK
    // ── Đông lạnh ──
    { code:'SP030', name:'Xúc xích Vissan cocktail 500g', price:65000, cost:52000, stock:15, lowStockThreshold:5,  category:'Đông lạnh',          unit:'gói',  expiryDate: expiry(28) }, // sắp hết hạn
    { code:'SP031', name:'Chả giò rế Nam Phương 500g',   price:55000,  cost:44000, stock:10,  lowStockThreshold:5,  category:'Đông lạnh',          unit:'gói',  expiryDate: expiry(50) },
    { code:'SP032', name:'Bò viên Thiên Đình 500g',      price:72000,  cost:58000, stock:8,   lowStockThreshold:5,  category:'Đông lạnh',          unit:'gói',  expiryDate: expiry(75) },
    // ── Gia vị ──
    { code:'SP033', name:'Nước mắm Phú Quốc 40° 500ml', price:45000,  cost:35000, stock:60,  lowStockThreshold:10, category:'Gia vị',             unit:'chai' },
    { code:'SP034', name:'Tương ớt Chinsu 250g',         price:18000,  cost:14000, stock:85,  lowStockThreshold:15, category:'Gia vị',             unit:'chai' },
    { code:'SP035', name:'Dầu ăn Neptune chai 1L',       price:55000,  cost:44000, stock:40,  lowStockThreshold:8,  category:'Gia vị',             unit:'chai' },
  ];

  const products = [];
  for (const p of productDefs) {
    const prod = await prisma.product.create({ data: { ...p, shopId: shop.id } });
    products.push(prod);
  }
  // Helper: shorthand reference by 0-based index
  const P = products;

  // ─── CUSTOMERS ────────────────────────────────────────────────
  console.log('👥 Tạo khách hàng...');
  const customerDefs = [
    { code:'KH001', name:'Nguyễn Văn An',   phone:'0901111111', email:'ngvanan@gmail.com',  address:'45 Lê Lợi, Q.1',          totalSpent:85000000,  loyaltyPoints:850000 }, // DIAMOND
    { code:'KH002', name:'Trần Thị Bình',   phone:'0902222222',                             address:'12 Trần Hưng Đạo, Q.5',   totalSpent:35000000,  loyaltyPoints:350000 }, // GOLD
    { code:'KH003', name:'Lê Văn Cường',    phone:'0903333333',                                                                 totalSpent:18000000,  loyaltyPoints:180000 }, // GOLD
    { code:'KH004', name:'Phạm Thị Dung',   phone:'0904444444', email:'dungpt@gmail.com',   address:'78 Võ Văn Tần, Q.3',      totalSpent:8500000,   loyaltyPoints:85000  }, // SILVER
    { code:'KH005', name:'Hoàng Văn Em',    phone:'0905555555',                                                                 totalSpent:6200000,   loyaltyPoints:62000  }, // SILVER
    { code:'KH006', name:'Vũ Thị Phương',   phone:'0906666666',                                                                 totalSpent:3100000,   loyaltyPoints:31000  }, // BRONZE
    { code:'KH007', name:'Đặng Văn Giàu',   phone:'0907777777',                                                                 totalSpent:1500000,   loyaltyPoints:15000  }, // BRONZE
    { code:'KH008', name:'Bùi Thị Hạnh',    phone:'0908888888',                                                                 totalSpent:950000,    loyaltyPoints:9500   }, // BRONZE
    { code:'KH009', name:'Trịnh Văn Ích',   phone:'0909999999',                                                                 totalSpent:520000,    loyaltyPoints:5200   }, // BRONZE
    { code:'KH010', name:'Ngô Thị Kim',     phone:'0910000000',                                                                 totalSpent:210000,    loyaltyPoints:2100   }, // BRONZE
    { code:'KH011', name:'Đinh Văn Long',   phone:'0911111111',                             address:'9 Cách Mạng Tháng 8, Q.3', totalSpent:2000000,  loyaltyPoints:20000  }, // BRONZE
    { code:'KH012', name:'Mai Thị Mến',     phone:'0912222222', email:'menmt@gmail.com',                                        totalSpent:12500000,  loyaltyPoints:125000 }, // SILVER
    { code:'KH013', name:'Trương Văn Nam',  phone:'0913333333',                                                                 totalSpent:45000000,  loyaltyPoints:450000 }, // GOLD
    { code:'KH014', name:'Lý Thị Oanh',     phone:'0914444444', email:'oanhlt@gmail.com',                                       totalSpent:62000000,  loyaltyPoints:620000 }, // DIAMOND
    { code:'KH015', name:'Phan Văn Phúc',   phone:'0915555555', email:'phucpv@gmail.com',   address:'33 Nguyễn Đình Chiểu, Q.3', totalSpent:120000000, loyaltyPoints:1200000 }, // DIAMOND
  ];

  const customers = [];
  for (const c of customerDefs) {
    const cust = await prisma.customer.create({ data: { ...c, shopId: shop.id } });
    customers.push(cust);
  }
  const C = customers;

  // ─── ORDERS ───────────────────────────────────────────────────
  console.log('🧾 Tạo đơn hàng...');

  // Helper: create one order with items
  async function createOrder({ day, hour, minute = 0, custIdx, pay, disc = 0, items, status = 'COMPLETED', note }) {
    const createdAt = dateAt(day, hour, minute);
    const orderItems = items.map(([pIdx, qty]) => ({
      productId: P[pIdx].id,
      quantity: qty,
      price: P[pIdx].price,
      subtotal: P[pIdx].price * qty
    }));
    const totalAmount = orderItems.reduce((s, i) => s + i.subtotal, 0);
    const finalAmount = totalAmount - disc;
    const createdById = day % 2 === 0 ? owner.id : staff1.id;

    await prisma.order.create({
      data: {
        orderNumber: orderNum(),
        totalAmount,
        discount: disc,
        finalAmount,
        paymentMethod: pay,
        orderStatus: status,
        note: note || null,
        createdAt,
        shopId: shop.id,
        customerId: custIdx !== null && custIdx !== undefined ? C[custIdx].id : null,
        createdById,
        items: { create: orderItems }
      }
    });
  }

  // ── Hôm nay (day=0) – 8 đơn ──
  await createOrder({ day:0, hour:8,  minute:15, custIdx:0,    pay:'CASH',          items:[[0,5],[8,6],[5,2]]                    });
  await createOrder({ day:0, hour:9,  minute:30,               pay:'CASH',          items:[[5,2],[6,4],[7,6]]                    });
  await createOrder({ day:0, hour:10, minute:0,  custIdx:1,    pay:'MOMO',  disc:5000, items:[[11,2],[12,1],[0,3]]              });
  await createOrder({ day:0, hour:11, minute:45,               pay:'CASH',          items:[[2,3],[16,5],[15,1]]                  });
  await createOrder({ day:0, hour:12, minute:30, custIdx:3,    pay:'BANK_TRANSFER', items:[[20,1],[21,1],[24,1]]                 });
  await createOrder({ day:0, hour:14, minute:0,                pay:'CASH',          items:[[3,1],[32,1],[33,2]]                  });
  await createOrder({ day:0, hour:15, minute:20, custIdx:2,    pay:'MOMO',  disc:10000, items:[[25,1],[26,1],[27,1],[23,1]], note:'Khách nhờ giao hàng' });
  await createOrder({ day:0, hour:16, minute:10,               pay:'CASH',          items:[[8,12],[9,1]], status:'PENDING'       }); // đang chờ

  // ── Hôm qua (day=1) – 7 đơn ──
  await createOrder({ day:1, hour:8,  minute:0,                pay:'CASH',          items:[[0,10],[1,5]]                         });
  await createOrder({ day:1, hour:9,  minute:30, custIdx:4,    pay:'MOMO',          items:[[5,4],[6,3],[8,5]]                    });
  await createOrder({ day:1, hour:11, minute:0,  custIdx:6,    pay:'CASH',          items:[[11,1],[13,1]]                        });
  await createOrder({ day:1, hour:13, minute:0,                pay:'CASH',          items:[[17,3],[15,2],[16,10]]                });
  await createOrder({ day:1, hour:15, minute:30, custIdx:11,   pay:'BANK_TRANSFER', items:[[26,1],[27,1],[22,2]]                 });
  await createOrder({ day:1, hour:17, minute:0,                pay:'CASH',          items:[[7,24]]                               }); // thùng bia
  await createOrder({ day:1, hour:18, minute:0,  custIdx:13,   pay:'BANK_TRANSFER', disc:50000, items:[[3,1],[34,2],[33,2],[32,1]], note:'Mua hàng về quê' });

  // ── 2 ngày trước – 6 đơn ──
  await createOrder({ day:2, hour:9,  minute:0,  custIdx:5,    pay:'CASH',          items:[[2,5],[0,5],[8,6]]                    });
  await createOrder({ day:2, hour:10, minute:30,               pay:'CASH',          items:[[5,2],[6,2],[17,2]]                   });
  await createOrder({ day:2, hour:13, minute:0,  custIdx:12,   pay:'BANK_TRANSFER', disc:20000, items:[[20,2],[24,1],[22,3],[25,1]] });
  await createOrder({ day:2, hour:15, minute:0,                pay:'MOMO',          items:[[33,1],[34,1]]                        }); // tương ớt + dầu ăn
  await createOrder({ day:2, hour:16, minute:30, custIdx:7,    pay:'CASH',          items:[[15,3],[16,20],[18,2]]                });
  await createOrder({ day:2, hour:19, minute:0,                pay:'CASH',          items:[[6,6],[5,6],[7,6]], status:'CANCELLED', note:'Khách đổi ý' });

  // ── 3 ngày trước – 5 đơn ──
  await createOrder({ day:3, hour:8,  minute:0,                pay:'CASH',          items:[[0,20],[1,10],[2,5]]                  }); // mua sỉ mì gói
  await createOrder({ day:3, hour:10, minute:0,  custIdx:9,    pay:'CASH',          items:[[5,3],[8,3]]                          });
  await createOrder({ day:3, hour:14, minute:0,                pay:'CASH',          items:[[27,1],[28,1]]                        });
  await createOrder({ day:3, hour:16, minute:30, custIdx:0,    pay:'BANK_TRANSFER', disc:50000, items:[[3,1],[34,2],[32,1],[33,3],[31,1]] });
  await createOrder({ day:3, hour:18, minute:0,                pay:'MOMO',          items:[[29,1],[30,1]]                        });

  // ── 4 ngày trước – 4 đơn ──
  await createOrder({ day:4, hour:9,  minute:0,                pay:'CASH',          items:[[5,6],[7,6],[8,6]]                    });
  await createOrder({ day:4, hour:13, minute:0,  custIdx:13,   pay:'BANK_TRANSFER', items:[[25,1],[26,1],[27,1],[21,1]]          });
  await createOrder({ day:4, hour:16, minute:0,                pay:'CASH',          items:[[0,5],[2,5],[9,1]]                    });
  await createOrder({ day:4, hour:18, minute:30, custIdx:1,    pay:'MOMO',          items:[[8,12],[6,6]]                         });

  // ── 5 ngày trước – 5 đơn ──
  await createOrder({ day:5, hour:8,  minute:0,                pay:'CASH',          items:[[11,2],[12,2],[14,2]]                 });
  await createOrder({ day:5, hour:10, minute:0,  custIdx:1,    pay:'MOMO',          items:[[5,4],[6,4],[7,4]]                    });
  await createOrder({ day:5, hour:14, minute:0,                pay:'CASH',          items:[[15,2],[17,3],[19,2]]                 });
  await createOrder({ day:5, hour:16, minute:30, custIdx:3,    pay:'BANK_TRANSFER', disc:10000, items:[[20,1],[21,2],[24,1]]    });
  await createOrder({ day:5, hour:18, minute:0,                pay:'CASH',          items:[[8,6],[5,4]]                          });

  // ── 6 ngày trước – 4 đơn ──
  await createOrder({ day:6, hour:8,  minute:30,               pay:'CASH',          items:[[0,10],[1,5],[2,3]]                   });
  await createOrder({ day:6, hour:11, minute:0,  custIdx:8,    pay:'CASH',          items:[[5,2],[8,4]]                          });
  await createOrder({ day:6, hour:14, minute:0,                pay:'MOMO',          items:[[26,1],[28,1]]                        });
  await createOrder({ day:6, hour:16, minute:30,               pay:'CASH',          items:[[3,1],[33,1],[34,1],[32,1]]           });

  // ── 7 ngày trước – 4 đơn ──
  await createOrder({ day:7, hour:9,  minute:0,                pay:'CASH',          items:[[0,8],[5,4]]                          });
  await createOrder({ day:7, hour:14, minute:0,  custIdx:4,    pay:'MOMO',          items:[[13,1],[11,1],[14,2]]                 });
  await createOrder({ day:7, hour:17, minute:0,                pay:'CASH',          items:[[7,12],[5,6]]                         });
  await createOrder({ day:7, hour:18, minute:30, custIdx:14,   pay:'BANK_TRANSFER', disc:100000, items:[[20,2],[21,2],[22,4],[24,2],[25,1]] });

  // ── 8–10 ngày trước – 3 đơn / ngày ──
  await createOrder({ day:8, hour:10, minute:0,                pay:'CASH',          items:[[17,5],[15,3],[16,10]]                });
  await createOrder({ day:8, hour:15, minute:0,  custIdx:14,   pay:'BANK_TRANSFER', disc:100000, items:[[20,2],[21,2],[24,2],[22,4],[25,1]] });
  await createOrder({ day:8, hour:17, minute:0,                pay:'CASH',          items:[[8,6],[5,6]]                          });

  await createOrder({ day:9, hour:8,  minute:0,                pay:'CASH',          items:[[0,15],[1,10]]                        });
  await createOrder({ day:9, hour:11, minute:0,  custIdx:2,    pay:'MOMO',          items:[[5,6],[7,6]]                          });
  await createOrder({ day:9, hour:16, minute:0,                pay:'CASH',          items:[[32,1],[33,2],[34,1]]                 });

  await createOrder({ day:10, hour:9,  minute:0,               pay:'CASH',          items:[[11,3],[12,2]]                        });
  await createOrder({ day:10, hour:14, minute:0, custIdx:5,    pay:'CASH',          items:[[29,1],[30,1],[31,1]]                 });
  await createOrder({ day:10, hour:17, minute:0,               pay:'MOMO',          items:[[5,4],[6,4],[9,1]]                    });

  // ── 11–14 ngày trước – 2–3 đơn / ngày ──
  await createOrder({ day:11, hour:10, minute:0,               pay:'CASH',          items:[[5,4],[6,4],[8,6]]                    });
  await createOrder({ day:11, hour:15, minute:0, custIdx:10,   pay:'BANK_TRANSFER', items:[[25,1],[27,1],[21,1]]                 });

  await createOrder({ day:12, hour:9,  minute:0,               pay:'CASH',          items:[[0,10],[2,5],[8,12]]                  });
  await createOrder({ day:12, hour:16, minute:0, custIdx:6,    pay:'CASH',          items:[[15,2],[17,10],[19,1]]                });

  await createOrder({ day:13, hour:10, minute:0, custIdx:1,    pay:'MOMO',          items:[[5,4],[7,4],[6,4]]                    });
  await createOrder({ day:13, hour:14, minute:0,               pay:'CASH',          items:[[3,1],[34,1]]                         });
  await createOrder({ day:13, hour:17, minute:0,               pay:'CASH',          items:[[8,12],[7,6]]                         });

  await createOrder({ day:14, hour:9,  minute:0,               pay:'CASH',          items:[[0,10],[1,10]]                        });
  await createOrder({ day:14, hour:17, minute:0, custIdx:7,    pay:'CASH',          items:[[9,1],[10,1]]                         });

  // ── 15–20 ngày trước – 2 đơn / ngày ──
  await createOrder({ day:15, hour:10, minute:0,               pay:'CASH',          items:[[20,1],[22,2],[24,1]]                 });
  await createOrder({ day:15, hour:15, minute:0, custIdx:11,   pay:'BANK_TRANSFER', items:[[26,1],[28,1],[27,1]]                 });

  await createOrder({ day:16, hour:9,  minute:0,               pay:'CASH',          items:[[5,6],[8,6],[7,4]]                    });
  await createOrder({ day:16, hour:14, minute:0, custIdx:0,    pay:'BANK_TRANSFER', disc:100000, items:[[3,2],[34,2],[32,2],[33,4]] });

  await createOrder({ day:17, hour:10, minute:0,               pay:'MOMO',          items:[[11,2],[13,1],[14,2]]                 });
  await createOrder({ day:17, hour:16, minute:0, custIdx:8,    pay:'CASH',          items:[[0,5],[2,5],[8,6]]                    });

  await createOrder({ day:18, hour:9,  minute:0,               pay:'CASH',          items:[[15,3],[17,5],[18,2]]                 });
  await createOrder({ day:18, hour:14, minute:0, custIdx:12,   pay:'BANK_TRANSFER', disc:50000, items:[[25,2],[21,2],[27,1]]    });

  await createOrder({ day:19, hour:10, minute:0,               pay:'CASH',          items:[[5,3],[6,3],[7,3]]                    });
  await createOrder({ day:19, hour:15, minute:0,               pay:'CASH',          items:[[0,8],[8,10]]                         });

  await createOrder({ day:20, hour:9,  minute:0,  custIdx:9,   pay:'CASH',          items:[[5,2],[8,4]]                          });
  await createOrder({ day:20, hour:14, minute:0,               pay:'MOMO',          items:[[34,1],[32,1],[30,1]]                 });

  // ── 21–29 ngày trước – 1–2 đơn / ngày ──
  await createOrder({ day:21, hour:10, minute:0,               pay:'CASH',          items:[[0,10],[1,5],[8,5]]                   });
  await createOrder({ day:22, hour:11, minute:0, custIdx:14,   pay:'BANK_TRANSFER', disc:200000, items:[[20,3],[21,3],[22,6],[24,3],[25,2]] });
  await createOrder({ day:23, hour:9,  minute:0,               pay:'CASH',          items:[[5,4],[7,4],[6,3]]                    });
  await createOrder({ day:23, hour:15, minute:0, custIdx:3,    pay:'MOMO',          items:[[26,1],[27,1]]                        });
  await createOrder({ day:24, hour:10, minute:0,               pay:'CASH',          items:[[11,2],[12,2],[14,2]]                 });
  await createOrder({ day:25, hour:9,  minute:0,               pay:'CASH',          items:[[3,1],[33,1],[34,2]]                  });
  await createOrder({ day:25, hour:16, minute:0, custIdx:4,    pay:'CASH',          items:[[5,2],[6,2],[8,4]]                    });
  await createOrder({ day:26, hour:10, minute:0,               pay:'MOMO',          items:[[0,8],[2,5]]                          });
  await createOrder({ day:27, hour:11, minute:0, custIdx:13,   pay:'BANK_TRANSFER', disc:100000, items:[[20,2],[24,1],[28,2],[22,4]] });
  await createOrder({ day:27, hour:16, minute:0,               pay:'CASH',          items:[[5,3],[7,3]]                          });
  await createOrder({ day:28, hour:9,  minute:0,               pay:'CASH',          items:[[15,2],[17,5],[16,20]]                });
  await createOrder({ day:29, hour:10, minute:0,               pay:'CASH',          items:[[5,6],[8,6],[6,4]]                    });
  await createOrder({ day:29, hour:14, minute:0, custIdx:0,    pay:'BANK_TRANSFER', items:[[3,2],[34,2],[32,2]]                  });

  console.log('');
  console.log('✅ Seed hoàn tất!');
  console.log('─────────────────────────────────────────');
  console.log(`   🏪  Cửa hàng : Tạp Hóa Minh Tâm`);
  console.log(`   📧  Email    : owner@demo.com`);
  console.log(`   🔑  Mật khẩu : password123`);
  console.log(`   📦  Sản phẩm : ${products.length}`);
  console.log(`   👥  Khách hàng: ${customers.length}`);
  console.log(`   🧾  Đơn hàng : ${orderSeq - 1}`);
  console.log('─────────────────────────────────────────');
  console.log('   Staff 1: staff1@demo.com / password123');
  console.log('   Staff 2: staff2@demo.com / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
