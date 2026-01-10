import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
    'USER_INVITE',
    'USER_DELETE',
    'USER_READ',
    'USER_ASSIGN_ROLE',
    'ROLE_MANAGE',
    'TOOL_CREATE',
    'TOOL_UPDATE',
    'TOOL_DELETE',
    'TOOL_READ',
    'TOOL_TRANSFER',
    'TOOL_CHECKIN',
    'WAREHOUSE_CREATE',
    'WAREHOUSE_UPDATE',
    'WAREHOUSE_DELETE',
    'WAREHOUSE_READ'
];

// Helper to generate JWT token
const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};



// VK OAuth Service


// Yandex OAuth Service
export const yandexAuthService = {
    getAuthUrl: () => {
        const { YANDEX_CLIENT_ID } = process.env;
        if (!YANDEX_CLIENT_ID) throw new Error('YANDEX_CLIENT_ID is not defined');

        // Remove trailing slash if present to avoid double slashes
        const baseUrl = (process.env.API_URL || 'http://localhost:5001').replace(/\/$/, '');
        const redirectUri = `${baseUrl}/api/auth/yandex/callback`;

        console.log('Yandex Auth Generated Redirect URI:', redirectUri); // Debug log

        return `https://oauth.yandex.ru/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${redirectUri}&force_confirm=yes`;
    },

    handleCallback: async (code) => {
        const { YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET } = process.env;

        // 1. Exchange code for token
        const tokenRes = await fetch('https://oauth.yandex.ru/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: YANDEX_CLIENT_ID,
                client_secret: YANDEX_CLIENT_SECRET,
            }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description);

        const { access_token } = tokenData;

        // 2. Get user info
        const userRes = await fetch('https://login.yandex.ru/info?format=json', {
            headers: { Authorization: `OAuth ${access_token}` },
        });

        const yandexUser = await userRes.json();
        const { id, default_email, first_name, last_name, default_avatar_id } = yandexUser;

        const email = default_email || `yandex_${id}@placeholder.com`;
        const name = `${first_name} ${last_name}`;
        const avatarUrl = `https://avatars.yandex.net/get-yapic/${default_avatar_id}/islands-200`;

        // 3. Find or Create User
        let user = await prisma.user.findUnique({
            where: { yandexId: String(id) },
            include: { role: true, company: true }
        });

        if (!user) {
            if (email) {
                user = await prisma.user.findUnique({
                    where: { email },
                    include: { role: true, company: true }
                });

                if (user) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: { yandexId: String(id), avatarUrl: user.avatarUrl || avatarUrl },
                        include: { role: true, company: true }
                    });
                }
            }
        }


        if (!user) {
            return {
                registerRequired: true,
                profile: {
                    email,
                    name,
                    yandexId: String(id),
                    avatarUrl,
                    provider: 'yandex'
                }
            };
        }

        const token = generateToken(user.id, user.role);
        return { token, user };
    }
};
