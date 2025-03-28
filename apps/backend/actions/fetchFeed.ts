import { type WorkflowProcessor, createWorkflow } from '../helpers/workflows'
import { failedPage } from '../processors/common/failedPage'
import { guardedPage } from '../processors/common/guardedPage'
import { preflightFetch } from '../processors/common/preflightFetch'
import { responseFetch } from '../processors/common/responseFetch'
import { atomFeed } from '../processors/fetchers/atomFeed'
import { invalidFeed } from '../processors/fetchers/invalidFeed'
import { jsonFeed } from '../processors/fetchers/jsonFeed'
import { rdfFeed } from '../processors/fetchers/rdfFeed'
import { redirectPage } from '../processors/fetchers/redirectPage'
import { rssFeed } from '../processors/fetchers/rssFeed'
import { soundCloudFeed } from '../processors/fetchers/soundCloudFeed'
import type { FeedData } from '../types/schemas'

export type FetchFeedProcessor = WorkflowProcessor<FeedData>

export const processors: Array<FetchFeedProcessor> = [
  preflightFetch('lastScanEtag', 'lastScannedAt'),
  responseFetch,
  soundCloudFeed,
  rssFeed,
  atomFeed,
  jsonFeed,
  rdfFeed,
  redirectPage,
  guardedPage,
  invalidFeed,
  failedPage,
]

export const fetchFeed = createWorkflow<FeedData>(processors)
