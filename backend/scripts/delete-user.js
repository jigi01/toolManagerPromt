import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const email = process.argv[2];

if (!email) {
    console.error('Пожалуйста, укажите email пользователя.');
    console.error('Пример использования: node scripts/delete-user.js your.email@yandex.ru');
    process.exit(1);
}

async function main() {
    console.log(`🔍 Поиск пользователя с email: ${email}...`);
    const user = await prisma.user.findUnique({
        where: { email },
        include: { company: true }
    });

    if (!user) {
        console.error('❌ Пользователь не найден.');
        return;
    }

    console.log(`✅ Нашел пользователя: ${user.name} (ID: ${user.id})`);

    // Check if user is the only one in their company (typical for OAuth auto-reg)
    const companyUsersCount = await prisma.user.count({
        where: { companyId: user.companyId }
    });

    if (companyUsersCount === 1) {
        console.log(`🏢 Пользователь — единственный сотрудник компании "${user.company.name}". Удаляю компанию и все связанные данные...`);
        // Start transaction to delete everything
        await prisma.$transaction(async (tx) => {
            // Delete related data first if no cascade
            await tx.warehouse.deleteMany({ where: { companyId: user.companyId } });

            // Delete tool history where user is involved
            await tx.toolHistory.deleteMany({
                where: { OR: [{ actorId: user.id }, { fromUserId: user.id }, { toUserId: user.id }] }
            });

            await tx.user.delete({ where: { id: user.id } });
            await tx.role.deleteMany({ where: { companyId: user.companyId } });
            await tx.company.delete({ where: { id: user.companyId } });
        });
        console.log('🎉 Пользователь и его компания полностью удалены.');
    } else {
        console.log('👤 Удаляю только пользователя (компания останется)...');
        await prisma.$transaction(async (tx) => {
            // Remove user from tool history (set to null if possible, or delete)
            // Ideally we should set to null to keep history, but schema might not allow null for actorId.
            // Schema: actor User @relation(...) -> actorId String (not nullable)
            // So we MUST delete history records where this user is the ACTOR.
            // For fromUser/toUser, they are nullable (String?), so we can set them to null?
            // Actually, deleting history is cleaner for "hard delete" script.

            console.log('   🧹 Очистка истории действий...');
            await tx.toolHistory.deleteMany({
                where: { OR: [{ actorId: user.id }, { fromUserId: user.id }, { toUserId: user.id }] }
            });

            // Also check if user has tools assigned
            console.log('   🛠️ Возврат инструментов на склад...');
            await tx.tool.updateMany({
                where: { currentUserId: user.id },
                data: { currentUserId: null, status: 'AVAILABLE' } // Should probably set warehouseId too but we don't know which one. Logic issue.
                // Better approach: Let Prisma set null on onDelete: SetNull (which is set in schema for currentUserId)
                // But ToolHistory constraint blocked us.
            });

            await tx.user.delete({ where: { id: user.id } });
        });
        console.log('🎉 Пользователь удален.');
    }
}

main()
    .catch(e => {
        console.error('❌ Ошибка при удалении:', e);
    })
    .finally(async () => await prisma.$disconnect());
