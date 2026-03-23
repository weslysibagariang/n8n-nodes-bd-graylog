import { z} from 'zod';

const page = z.number().int().positive().default(1);
const perPage = z.number().int().positive().max(100).default(50);
const query = z.string().optional();

export const getEventNotificationsRequestQuerySchema = z.object({
    page: page,
    per_page: perPage,
    query: query,
});
