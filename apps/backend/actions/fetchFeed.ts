import { createWorkflow, type WorkflowProcessor } from '../helpers/workflows.js'
import { failedPage } from '../processors/common/failedPage.js'
import { guardedPage } from '../processors/common/guardedPage.js'
import { preflightFetch } from '../processors/common/preflightFetch.js'
import { responseFetch } from '../processors/common/responseFetch.js'
import { atomFeed } from '../processors/fetchers/atomFeed.js'
import { invalidFeed } from '../processors/fetchers/invalidFeed.js'
import { jsonFeed } from '../processors/fetchers/jsonFeed.js'
import { rdfFeed } from '../processors/fetchers/rdfFeed.js'
import { redirectPage } from '../processors/fetchers/redirectPage.js'
import { rssFeed } from '../processors/fetchers/rssFeed.js'
import { soundCloudFeed } from '../processors/fetchers/soundCloudFeed.js'
import type { FeedData } from '../types/schemas.js'

export type FetchFeedProcessor = WorkflowProcessor<FeedData>

export const fetchFeed = createWorkflow<FeedData>([
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
])
