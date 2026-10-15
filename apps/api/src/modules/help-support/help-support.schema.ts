/**
 * BR-82: Help & Support request/response schemas (Zod, `.strict()`), matching
 * docs/openapi.yaml.
 *
 * Content is PLAIN TEXT. A '>' is allowed (the FAQ copy writes navigation as
 * "More > Finance > Add Expense") and so is a lone '<' ("qty < 5"); what is
 * refused is anything that opens a tag, comment or declaration (`<b`, `</p`,
 * `<!--`, `<?`). Unconfirmed default, not a client rule.
 */
import { z } from 'zod';

export const helpLocales = ['en', 'ta'] as const;
export const helpLocale = z.enum(helpLocales);

const TAG_LIKE = /<\s*[/!?a-zA-Z]/;

function plainText(max: number) {
  return z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !TAG_LIKE.test(value), { message: 'Must be plain text: HTML or markup is not allowed.' });
}

const category = plainText(60);
const title = plainText(200);
const body = plainText(4000);
const sortOrder = z.number().int().min(0).max(100_000);

/** Loose on purpose: a helpline can be written "+91 1800-845-6677". */
const phone = z
  .string()
  .trim()
  .max(32)
  .regex(/^\+?[0-9][0-9 ()-]{4,30}$/, { message: 'Must look like a phone number: digits, spaces, ( ) - and an optional leading +.' });
const email = z.string().trim().max(254).email();

export const articleIdParams = z.object({ id: z.string().uuid() }).strict();

export const readHelpQuery = z
  .object({
    locale: helpLocale.default('en'),
    category: category.optional(),
  })
  .strict();
export type ReadHelpQuery = z.infer<typeof readHelpQuery>;

export const listArticlesQuery = z
  .object({
    locale: helpLocale.optional(),
    category: category.optional(),
    isPublished: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  })
  .strict();
export type ListArticlesQuery = z.infer<typeof listArticlesQuery>;

export const createArticleBody = z
  .object({
    category,
    locale: helpLocale,
    title,
    body,
    sortOrder: sortOrder.default(0),
  })
  .strict();
export type CreateArticleBody = z.infer<typeof createArticleBody>;

export const updateArticleBody = z
  .object({
    category: category.optional(),
    locale: helpLocale.optional(),
    title: title.optional(),
    body: body.optional(),
    sortOrder: sortOrder.optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: 'Send at least one field to change.',
  });
export type UpdateArticleBody = z.infer<typeof updateArticleBody>;

/** `null` clears a channel, an absent key leaves it alone. */
export const updateContactBody = z
  .object({
    phone: phone.nullable().optional(),
    email: email.nullable().optional(),
  })
  .strict()
  .refine((value) => value.phone !== undefined || value.email !== undefined, {
    message: 'Send phone, email or both.',
  });
export type UpdateContactBody = z.infer<typeof updateContactBody>;

export const readerArticleResponse = z.object({
  id: z.string().uuid(),
  category: z.string(),
  locale: helpLocale,
  title: z.string(),
  body: z.string(),
  sortOrder: z.number().int(),
});
export type ReaderArticleResponse = z.infer<typeof readerArticleResponse>;

export const managerArticleResponse = readerArticleResponse.extend({
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type ManagerArticleResponse = z.infer<typeof managerArticleResponse>;

export const contactResponse = z.object({
  phone: z.string().nullable(),
  email: z.string().nullable(),
});
export type ContactResponse = z.infer<typeof contactResponse>;

export const readHelpResponse = z.object({
  items: z.array(readerArticleResponse),
  categories: z.array(z.string()),
  contact: contactResponse,
});
export type ReadHelpResponse = z.infer<typeof readHelpResponse>;
