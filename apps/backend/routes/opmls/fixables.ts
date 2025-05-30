import { createRoute, z } from '@hono/zod-openapi'
import { parseOpml } from 'feedsmith'
import { suggestFixes } from '../../actions/suggestFixes.ts'
import { createHandler } from '../../helpers/hono.ts'
import { fixable } from '../../schemas/fixable.ts'

export const route = createRoute({
  method: 'post',
  path: '/opmls/fixables',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.instanceof(File).optional().openapi({ type: 'string', format: 'binary' }),
            text: z.string().optional(),
          }),
          // .refine((data) => !!data.file !== !!data.text, {
          //   message: 'You must provide either an XML file or XML string.',
          //   path: ['file'],
          // }),
        },
      },
      required: true,
      description: '',
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(fixable),
        },
      },
      description: '',
    },
  },
})

export const handler = createHandler(route, async (context) => {
  const formData = await context.req.formData()
  const opmlFile = formData.get('file')
  const opmlText = formData.get('text')

  let opmlContent = ''

  if (opmlFile instanceof File) {
    opmlContent = await opmlFile.text()
  } else if (typeof opmlText === 'string') {
    opmlContent = opmlText
  }

  const opml = parseOpml(opmlContent)
  const fixables = await suggestFixes(opml)

  return context.json(fixables, 200)
})
