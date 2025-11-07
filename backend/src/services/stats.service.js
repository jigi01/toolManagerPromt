import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCompanyStats = async (companyId) => {
  const [
    totalValueResult,
    inUseCount,
    availableCount,
    totalStaff,
    toolsByCategory
  ] = await Promise.all([
    prisma.tool.aggregate({
      _sum: {
        price: true
      },
      where: {
        companyId
      }
    }),
    prisma.tool.count({
      where: {
        companyId,
        status: 'IN_USE'
      }
    }),
    prisma.tool.count({
      where: {
        companyId,
        status: 'AVAILABLE'
      }
    }),
    prisma.user.count({
      where: {
        companyId
      }
    }),
    prisma.tool.groupBy({
      by: ['categoryId'],
      where: {
        companyId
      },
      _count: {
        id: true
      }
    })
  ]);

  const categories = await prisma.category.findMany({
    where: {
      companyId
    },
    select: {
      id: true,
      name: true
    }
  });

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {});

  const toolsByCategoryWithNames = toolsByCategory.map(item => ({
    categoryId: item.categoryId,
    categoryName: item.categoryId ? (categoryMap[item.categoryId] || 'Без категории') : 'Без категории',
    count: item._count.id
  }));

  return {
    totalValue: totalValueResult._sum.price || 0,
    inUseTools: inUseCount,
    availableTools: availableCount,
    totalStaff: totalStaff,
    toolsByCategory: toolsByCategoryWithNames
  };
};

export const getActivityFeed = async (companyId, limit = 10) => {
  const activities = await prisma.toolHistory.findMany({
    where: {
      tool: {
        companyId
      }
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: limit,
    include: {
      tool: {
        select: {
          name: true,
          serialNumber: true
        }
      },
      actor: {
        select: {
          name: true
        }
      },
      fromUser: {
        select: {
          name: true
        }
      },
      toUser: {
        select: {
          name: true
        }
      },
      fromWarehouse: {
        select: {
          name: true
        }
      },
      toWarehouse: {
        select: {
          name: true
        }
      }
    }
  });

  return activities.map(activity => {
    let description = '';
    
    if (activity.action === 'TRANSFER') {
      if (activity.fromUser && activity.toUser) {
        description = `${activity.actor.name} передал ${activity.tool.name} от ${activity.fromUser.name} к ${activity.toUser.name}`;
      } else if (activity.fromWarehouse && activity.toUser) {
        description = `${activity.actor.name} выдал ${activity.tool.name} со склада "${activity.fromWarehouse.name}" сотруднику ${activity.toUser.name}`;
      } else if (activity.toUser) {
        description = `${activity.actor.name} передал ${activity.tool.name} сотруднику ${activity.toUser.name}`;
      } else if (activity.toWarehouse) {
        description = `${activity.actor.name} передал ${activity.tool.name} на склад "${activity.toWarehouse.name}"`;
      }
    } else if (activity.action === 'CHECK_IN') {
      if (activity.toWarehouse) {
        description = `${activity.actor.name} вернул ${activity.tool.name} на склад "${activity.toWarehouse.name}"`;
      } else {
        description = `${activity.actor.name} вернул ${activity.tool.name} на склад`;
      }
    }

    return {
      id: activity.id,
      timestamp: activity.timestamp,
      description,
      action: activity.action,
      tool: activity.tool
    };
  });
};
