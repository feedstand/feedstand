import { z } from 'zod'
import {
  looseOpml,
  strictOpml,
  strictOpml10,
  strictOpml11,
  strictOpml20,
  strictOpml20Outline,
} from './schemas'

// export type StrictOpml10Outline = {
//   // TODO: Fill the type.
// }

// export type StrictOpml11Outline = StrictOpml10Outline

// export type StrictOpml20Outline = {
//   text: string
//   isComment?: boolean
//   isBreakpoint?: boolean
//   created?: Date
//   // TODO: As per docs, the "category" property is a "comma-separated slash-delimited
//   // categories". Should it be represented by array of strings then?
//   category?: string
//   outline?: Array<StrictOpml20Outline>
// } & (
//   | {
//       type: 'rss'
//       xmlUrl: string
//       description?: string
//       htmlUrl?: string
//       language?: string
//       title?: string
//       version?: 'RSS' | 'RSS1' | 'scriptingNews'
//     }
//   | {
//       type: 'link' | 'include'
//       url: string
//     }
// )

// export type StrictOpmlOutline = StrictOpml10Outline | StrictOpml11Outline | StrictOpml20Outline

// export type StrictOpml10 = {
//   version: '1.0'
// }

// export type StrictOpml11 = { version: '1.1' } & Omit<StrictOpml10, 'version'>

// export type StrictOpml20 = {
//   version: '2.0'
//   head: {
//     title?: string
//     dateCreated?: Date
//     dateModified?: Date
//     ownerName?: string
//     ownerEmail?: string
//     ownerId?: string
//     docs?: string
//     expansionState?: string
//     vertScrollState?: number
//     windowTop?: number
//     windowLeft?: number
//     windowBottom?: number
//     windowRight?: number
//   }
//   body: {
//     outline: Array<StrictOpml20Outline>
//   }
// }

// export type StrictOpml = StrictOpml10 | StrictOpml11 | StrictOpml20

export type LooseOpmlOutline = {
  outline?: Array<LooseOpmlOutline>
} & {
  [K in string]: K extends 'outline' ? never : string | undefined
}

export type LooseOpml = z.infer<typeof looseOpml>

export type StrictOpml20Outline = z.infer<typeof strictOpml20Outline>
export type StrictOpml10 = z.infer<typeof strictOpml10>
export type StrictOpml11 = z.infer<typeof strictOpml11>
export type StrictOpml20 = z.infer<typeof strictOpml20>
export type StrictOpml = z.infer<typeof strictOpml>
