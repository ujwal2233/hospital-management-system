import { FilterQuery, Model, PopulateOptions, SortOrder } from 'mongoose';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export async function paginate<T>(
  model: Model<any>,
  filter: FilterQuery<T>,
  query: PaginationQueryDto,
  options: {
    sort?: Record<string, SortOrder>;
    populate?: PopulateOptions | PopulateOptions[];
  } = {},
): Promise<Paginated<T>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  // Determine sort order: prefer explicit options.sort, otherwise use query.sortBy/sortOrder if provided,
  // fallback to createdAt desc.
  // If client provided an explicit sortBy, prefer that. Otherwise fall back to options.sort or createdAt desc.
  const sortOption: Record<string, SortOrder> =
    query.sortBy ? { [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 } : options.sort ?? { createdAt: -1 };

  let find = model
    .find(filter)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);
  if (options.populate) find = find.populate(options.populate);

  const [data, total] = await Promise.all([
    find.lean<T[]>().exec(),
    model.countDocuments(filter).exec(),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}
