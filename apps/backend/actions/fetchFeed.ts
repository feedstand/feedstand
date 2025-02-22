import { failedPage } from '../processors/common/failedPage'
import { guardedPage } from '../processors/common/guardedPage'
import { preflightFetch } from '../processors/common/preflightFetch'
import { responseFetch } from '../processors/common/responseFetch'
import { invalidFeed } from '../processors/fetchers/invalidFeed'
import { jsonFeed } from '../processors/fetchers/jsonFeed'
import { redirectPage } from '../processors/fetchers/redirectPage'
import { soundCloudFeed } from '../processors/fetchers/soundCloudFeed'
import { xmlFeed } from '../processors/fetchers/xmlFeed'
import { FeedData } from '../types/schemas'
import { createWorkflow, WorkflowProcessor } from './createWorkflow'

export type FetchFeedProcessor = WorkflowProcessor<FeedData>

export const processors: Array<FetchFeedProcessor> = [
  preflightFetch('lastScanEtag', 'lastScannedAt'),
  responseFetch,
  soundCloudFeed,
  jsonFeed,
  xmlFeed,
  redirectPage,
  guardedPage,
  invalidFeed,
  failedPage,
]

export const fetchFeed = createWorkflow<FeedData>(processors)
