import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Начало миграции: создание дефолтных складов...');

  try {
    // Получаем все компании
    const companies = await prisma.company.findMany({
      include: {
        warehouses: true,
        tools: true
      }
    });

    console.log(`📦 Найдено компаний: ${companies.length}`);

    for (const company of companies) {
      console.log(`\n📍 Обработка компании: ${company.name} (ID: ${company.id})`);

      // Проверяем, есть ли у компании склады
      if (company.warehouses.length === 0) {
        console.log('  ➕ Создание дефолтного склада...');
        
        // Создаем дефолтный склад
        const warehouse = await prisma.warehouse.create({
          data: {
            name: 'Основной склад',
            companyId: company.id,
            isDefault: true
          }
        });

        console.log(`  ✅ Создан склад: ${warehouse.name} (ID: ${warehouse.id})`);

        // Привязываем все инструменты, которые на складе (без владельца), к этому складу
        const toolsToUpdate = company.tools.filter(tool => !tool.currentUserId);
        
        if (toolsToUpdate.length > 0) {
          console.log(`  🔧 Привязка ${toolsToUpdate.length} инструментов к складу...`);
          
          await prisma.tool.updateMany({
            where: {
              id: { in: toolsToUpdate.map(t => t.id) },
              companyId: company.id
            },
            data: {
              warehouseId: warehouse.id
            }
          });

          console.log(`  ✅ Инструменты привязаны к складу`);
        } else {
          console.log(`  ℹ️  Нет инструментов для привязки`);
        }
      } else {
        console.log(`  ✅ У компании уже есть склады: ${company.warehouses.length}`);
        
        // Проверяем, есть ли дефолтный склад
        const defaultWarehouse = company.warehouses.find(w => w.isDefault);
        
        if (!defaultWarehouse) {
          console.log('  ⚠️  Нет дефолтного склада, устанавливаем первый как дефолтный');
          await prisma.warehouse.update({
            where: { id: company.warehouses[0].id },
            data: { isDefault: true }
          });
          console.log(`  ✅ Склад "${company.warehouses[0].name}" установлен как дефолтный`);
        }

        // Привязываем инструменты без склада к дефолтному складу
        const targetWarehouse = defaultWarehouse || company.warehouses[0];
        const toolsWithoutWarehouse = company.tools.filter(tool => !tool.currentUserId && !tool.warehouseId);
        
        if (toolsWithoutWarehouse.length > 0) {
          console.log(`  🔧 Привязка ${toolsWithoutWarehouse.length} инструментов без склада...`);
          
          await prisma.tool.updateMany({
            where: {
              id: { in: toolsWithoutWarehouse.map(t => t.id) },
              companyId: company.id
            },
            data: {
              warehouseId: targetWarehouse.id
            }
          });

          console.log(`  ✅ Инструменты привязаны к складу "${targetWarehouse.name}"`);
        }
      }
    }

    console.log('\n✅ Миграция завершена успешно!');
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateData()
  .then(() => {
    console.log('✨ Все готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Миграция не удалась:', error);
    process.exit(1);
  });
