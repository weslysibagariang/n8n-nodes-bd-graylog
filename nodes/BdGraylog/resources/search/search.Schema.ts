import { z } from 'zod';


/** View Search Schema */
const elasticSearchQuerySchema = z.object({
    type: z.literal('elasticsearch'),
    query_string: z.string().min(1),
});

const timeRangeSchema = z.object({
    type: z.enum(['absolute', 'relative', 'keyword']),
    from: z.union([z.string().min(1), z.number().positive()]),
    to: z.optional(z.string().min(1)),
    keyword: z.optional(z.string().min(1)),
    timezone: z.optional(z.string().min(1)),
}).refine((data) => {
    if (data.type === 'absolute') {
        return data.from && data.to;
    }
    if (data.type === 'relative') {
        return data.from && !data.to;
    }
    if (data.type === 'keyword') {
        return data.keyword && data.timezone;
    }
    return false;
}, { message: 'Invalid time range configuration' });

export interface Filter {
    type: string;
    filters?: Filter[];
    id?: string;
    category?: string;
}

const leafFilterSchema = z.union([
    z.object({
        type: z.string().min(1),
        id: z.string().min(1),
    }),
    z.object({
        type: z.string().min(1),
        category: z.string().min(1),
    }),
])

const recursiveFilterSchema: z.ZodType<Filter> = z.lazy(() =>
    z.object({
        type: z.string().min(1),
        filters: z.array(z.union([leafFilterSchema, recursiveFilterSchema])),
    })
);

const rootFiltersSchema = z.array(z.object({})).default([]);

const backEndQuerySchema = z.object({}).default({});

const searchTypesSchema = z.object({
    timerange: z.any().default(null),
    query: backEndQuerySchema.nullable().default(null),
    streams: z.array(z.string().min(1)).default([]),
    stream_categories: z.array(z.string().min(1)).default([]),
    id: z.optional(
        z.string().min(1)
    ),
    name: z.string().default(''),
    series: z.array(
        z.object({
            type: z.string().min(1),
            id: z.string().min(1),
            field: z.optional(z.string().min(1)),
        })
    ).optional(),
    sort: z.array(
        z.object({
            field: z.string().min(1).default('timestamp'),
            order: z.enum(['ASC', 'DESC']).default('DESC'),
        })
    ).default([]),
    rollup: z.boolean().optional(),
    type: z.string().min(1).optional(),
    row_groups: z.array(
        z.object({
            type: z.string().min(1),
            fields: z.array(z.string().min(1)),
            interval: z.object({
                type: z.string().min(1).default('auto'),
                scaling: z.number().positive().default(1),
            })
        })
    ).optional(),
    column_groups: z.array(z.any()).default([]).optional(),
    fields: z.array(z.any()).default([]).optional(),
    decorators: z.array(z.any()).default([]).optional(),
    filter: z.string().nullable().default(null),
    filters: z.array(z.any()).default([]),
})

const parametersSchema = z.array(z.any()).default([]);

const queriesSchema = z.object({
    id: z.string().optional(),
    query: elasticSearchQuerySchema,
    timerange: timeRangeSchema,
    filter: recursiveFilterSchema,
    filters: rootFiltersSchema,
    search_types: z.array(searchTypesSchema).min(1),
});

export const viewsSearchRequestBodySchema = z.object({
    id: z.string().optional(),
    queries: z.array(queriesSchema).min(1),
    parameters: parametersSchema,
})

/** Search Aggregate Schema */
const groupingSchema = z.object({
    field: z.string().optional(),
    limit: z.number().positive().optional(),
});

const metricSchema = z.object({
    field: z.string().optional(),
    configuration: z.object({}).optional(),
    function: z.string().optional(),
    sort: z.enum(['Ascending', 'Descending']).optional(),
});

export const searchAggregateRequestBodySchema = z.object({
    stream_categories: z.array(z.string()).optional(),
    timerange: timeRangeSchema,
    query: z.string().default(''),
    streams: z.array(z.string()).default([]),
    group_by: z.array(groupingSchema).default([]),
    metrics: z.array(metricSchema).default([]),
});
